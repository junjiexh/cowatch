package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/yourusername/cowatch/api-gateway/internal/api"
	"github.com/yourusername/cowatch/api-gateway/internal/middleware"
	"github.com/yourusername/cowatch/api-gateway/internal/models"
)

// GetRooms returns a list of rooms
// GET /rooms
func (s *Server) GetRooms(c *gin.Context, params api.GetRoomsParams) {
	limit := 20
	offset := 0

	if params.Limit != nil && *params.Limit > 0 && *params.Limit <= 100 {
		limit = *params.Limit
	}
	if params.Offset != nil && *params.Offset >= 0 {
		offset = *params.Offset
	}

	var rooms []models.Room
	if err := s.db.Preload("Owner").
		Where("is_active = ?", true).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&rooms).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "获取房间列表失败")
		return
	}

	// Get current user if authenticated
	user, _ := middleware.GetUser(c)

	result := make([]api.Room, len(rooms))
	for i, room := range rooms {
		result[i] = roomToAPI(&room, user, s.db)
	}

	c.JSON(http.StatusOK, result)
}

// PostRooms creates a new room
// POST /rooms
func (s *Server) PostRooms(c *gin.Context) {
	user, ok := middleware.GetUser(c)
	if !ok {
		respondError(c, http.StatusUnauthorized, "UNAUTHORIZED", "未登录")
		return
	}

	var req api.CreateRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数错误")
		return
	}

	// Validate input
	if len(req.Name) < 1 || len(req.Name) > 100 {
		respondError(c, http.StatusBadRequest, "INVALID_NAME", "房间名称长度必须在1-100个字符之间")
		return
	}

	room := models.Room{
		Name:     req.Name,
		OwnerID:  user.ID,
		IsActive: true,
	}

	if req.MaxUsers != nil && *req.MaxUsers >= 2 && *req.MaxUsers <= 50 {
		room.MaxUsers = *req.MaxUsers
	}

	if req.Password != nil && *req.Password != "" {
		if err := room.SetPassword(*req.Password); err != nil {
			respondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "设置房间密码失败")
			return
		}
	}

	if err := s.db.Create(&room).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "创建房间失败")
		return
	}

	// Reload with owner
	s.db.Preload("Owner").First(&room, "id = ?", room.ID)

	// Add creator as first member
	member := models.RoomMember{
		RoomID:        room.ID,
		UserID:        user.ID,
		LastVisitedAt: time.Now(),
	}
	s.db.Create(&member)

	c.JSON(http.StatusCreated, roomToAPI(&room, user, s.db))
}

// GetRoomsRoomCode returns room details by code
// GET /rooms/{roomCode}
func (s *Server) GetRoomsRoomCode(c *gin.Context, roomCode string) {
	var room models.Room
	if err := s.db.Preload("Owner").Where("code = ?", roomCode).First(&room).Error; err != nil {
		respondError(c, http.StatusNotFound, "ROOM_NOT_FOUND", "房间不存在")
		return
	}

	// Get current user if authenticated
	user, _ := middleware.GetUser(c)

	c.JSON(http.StatusOK, roomToAPI(&room, user, s.db))
}

// PostRoomsRoomCodeJoin allows a user to join a room
// POST /rooms/{roomCode}/join
func (s *Server) PostRoomsRoomCodeJoin(c *gin.Context, roomCode string) {
	user, ok := middleware.GetUser(c)
	if !ok {
		respondError(c, http.StatusUnauthorized, "UNAUTHORIZED", "未登录")
		return
	}

	// Find room
	var room models.Room
	if err := s.db.Preload("Owner").Where("code = ?", roomCode).First(&room).Error; err != nil {
		respondError(c, http.StatusNotFound, "ROOM_NOT_FOUND", "房间不存在")
		return
	}

	// Check password if required
	if room.HasPassword() {
		var req api.PostRoomsRoomCodeJoinJSONRequestBody
		if err := c.ShouldBindJSON(&req); err != nil {
			respondError(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数错误")
			return
		}

		password := ""
		if req.Password != nil {
			password = *req.Password
		}

		if !room.CheckPassword(password) {
			respondError(c, http.StatusForbidden, "WRONG_PASSWORD", "密码错误")
			return
		}
	}

	// Add or update room membership
	var member models.RoomMember
	result := s.db.Where("room_id = ? AND user_id = ?", room.ID, user.ID).First(&member)
	if result.Error != nil {
		// Create new membership
		member = models.RoomMember{
			RoomID:        room.ID,
			UserID:        user.ID,
			LastVisitedAt: time.Now(),
		}
		s.db.Create(&member)
	} else {
		// Update last visited time
		s.db.Model(&member).Update("last_visited_at", time.Now())
	}

	c.JSON(http.StatusOK, roomToAPI(&room, user, s.db))
}

// roomToAPI converts a models.Room to api.Room
func roomToAPI(room *models.Room, currentUser *models.User, db *gorm.DB) api.Room {
	hasPassword := room.HasPassword()
	userCount := 0 // TODO: Get actual online user count from WebSocket hub

	result := api.Room{
		Id:          room.ID,
		Code:        room.Code,
		Name:        room.Name,
		OwnerId:     room.OwnerID,
		IsActive:    room.IsActive,
		HasPassword: &hasPassword,
		MaxUsers:    &room.MaxUsers,
		UserCount:   &userCount,
		CreatedAt:   &room.CreatedAt,
	}

	if room.Owner != nil {
		result.OwnerName = &room.Owner.Username
	}

	// Set current user role and permissions
	if currentUser != nil {
		if currentUser.ID == room.OwnerID {
			// User is the room owner
			role := api.Host
			hasControl := true
			result.CurrentUserRole = &role
			result.CurrentUserHasControl = &hasControl
		} else {
			// User is a member, check for control permission
			var member models.RoomMember
			err := db.Where("room_id = ? AND user_id = ?", room.ID, currentUser.ID).First(&member).Error
			if err == nil {
				// User is a member
				role := api.Member
				result.CurrentUserRole = &role
				result.CurrentUserHasControl = &member.HasControlPermission
			} else {
				// User is a guest (not a member)
				role := api.Guest
				hasControl := false
				result.CurrentUserRole = &role
				result.CurrentUserHasControl = &hasControl
			}
		}
	} else {
		// No current user (not authenticated)
		role := api.Guest
		hasControl := false
		result.CurrentUserRole = &role
		result.CurrentUserHasControl = &hasControl
	}

	return result
}
