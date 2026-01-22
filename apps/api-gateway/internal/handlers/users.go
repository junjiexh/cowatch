package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/cowatch/api-gateway/internal/api"
	"github.com/yourusername/cowatch/api-gateway/internal/middleware"
	"github.com/yourusername/cowatch/api-gateway/internal/models"
)

// GetUsersMeRecentRooms returns the current user's recent rooms
// GET /users/me/recent-rooms
func (s *Server) GetUsersMeRecentRooms(c *gin.Context, params api.GetUsersMeRecentRoomsParams) {
	user, ok := middleware.GetUser(c)
	if !ok {
		respondError(c, http.StatusUnauthorized, "UNAUTHORIZED", "未登录")
		return
	}

	limit := 10
	if params.Limit != nil && *params.Limit > 0 && *params.Limit <= 50 {
		limit = *params.Limit
	}

	var members []models.RoomMember
	if err := s.db.Preload("Room").Preload("Room.Owner").
		Where("user_id = ?", user.ID).
		Order("last_visited_at DESC").
		Limit(limit).
		Find(&members).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "获取最近房间失败")
		return
	}

	result := make([]api.RecentRoom, 0, len(members))
	for _, member := range members {
		if member.Room == nil {
			continue
		}
		result = append(result, api.RecentRoom{
			Room:                  roomToAPI(member.Room),
			LastVisited:           member.LastVisitedAt,
			LastWatchedVideoTitle: member.LastWatchedVideoTitle,
		})
	}

	c.JSON(http.StatusOK, result)
}

// PostVideosParse is a stub for video parsing (not implemented)
// POST /videos/parse
func (s *Server) PostVideosParse(c *gin.Context) {
	respondError(c, http.StatusNotImplemented, "NOT_IMPLEMENTED", "视频解析功能暂未实现")
}
