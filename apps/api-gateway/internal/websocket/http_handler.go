// Package websocket provides WebSocket HTTP handler for room connections
package websocket

import (
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"gorm.io/gorm"

	"github.com/yourusername/cowatch/api-gateway/internal/models"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow all origins in development
		// TODO: Restrict in production
		return true
	},
}

// HTTPHandler handles WebSocket HTTP connections
type HTTPHandler struct {
	Hub       *Hub
	DB        *gorm.DB
	JWTSecret string
}

// NewHTTPHandler creates a new WebSocket HTTP handler
func NewHTTPHandler(hub *Hub, db *gorm.DB, jwtSecret string) *HTTPHandler {
	return &HTTPHandler{
		Hub:       hub,
		DB:        db,
		JWTSecret: jwtSecret,
	}
}

// HandleWebSocket upgrades HTTP connection to WebSocket
func (h *HTTPHandler) HandleWebSocket(c *gin.Context) {
	roomCode := c.Param("roomCode")

	// Authenticate user from query param token (WebSocket can't use Authorization header easily)
	token := c.Query("token")
	if token == "" {
		// Also check Authorization header as fallback
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
				token = parts[1]
			}
		}
	}

	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未登录"})
		return
	}

	// Parse JWT token
	claims := &Claims{}
	parsedToken, err := jwt.ParseWithClaims(token, claims, func(t *jwt.Token) (interface{}, error) {
		return []byte(h.JWTSecret), nil
	})
	if err != nil || !parsedToken.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "无效的认证令牌"})
		return
	}

	// Load user from database
	var user models.User
	if err := h.DB.First(&user, "id = ?", claims.UserID).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户不存在"})
		return
	}

	// Find room by code
	var room models.Room
	if err := h.DB.Preload("Owner").First(&room, "code = ? AND is_active = ?", roomCode, true).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "房间不存在"})
		return
	}

	// Check if user is a member of the room
	var member models.RoomMember
	if err := h.DB.First(&member, "room_id = ? AND user_id = ?", room.ID, user.ID).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "你不是该房间的成员"})
		return
	}

	// Upgrade to WebSocket
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("[WebSocket] Failed to upgrade connection: %v", err)
		return
	}

	// Determine if user is host
	isHost := room.OwnerID == user.ID
	hasControlPermission := isHost || member.HasControlPermission

	// Create client
	client := &Client{
		ID:                   uuid.New().String(),
		RoomID:               room.ID,
		RoomCode:             room.Code,
		UserID:               user.ID,
		Username:             user.Username,
		AvatarURL:            getAvatarURL(user.AvatarURL),
		IsHost:               isHost,
		HasControlPermission: hasControlPermission,
		Conn:                 conn,
		Send:                 make(chan *WSMessage, 256),
		Hub:                  h.Hub,
		DB:                   h.DB,
	}

	// Register client with hub
	h.Hub.register <- client

	// Update last visited time
	h.DB.Model(&member).Update("last_visited_at", time.Now())

	// Send room init event to the client
	go h.sendRoomInit(client, &room)

	// Start pumps
	go client.WritePump()
	go client.ReadPump()
}

// sendRoomInit sends the room initialization event to a newly connected client
func (h *HTTPHandler) sendRoomInit(client *Client, room *models.Room) {
	// Get all room members
	var members []models.RoomMember
	h.DB.Preload("User").Where("room_id = ?", room.ID).Find(&members)

	// Get online clients in this room
	onlineUserIDs := h.Hub.GetOnlineUserIDs(room.ID)

	// Build participants list
	participants := make([]RoomParticipant, 0, len(members))
	for _, m := range members {
		if m.User == nil {
			continue
		}

		isOnline := false
		for _, id := range onlineUserIDs {
			if id == m.UserID {
				isOnline = true
				break
			}
		}

		role := "member"
		if m.UserID == room.OwnerID {
			role = "host"
		}

		hasControl := role == "host" || m.HasControlPermission

		participants = append(participants, RoomParticipant{
			ID:                   m.UserID,
			Username:             m.User.Username,
			AvatarURL:            m.User.AvatarURL,
			IsOnline:             isOnline,
			Role:                 role,
			HasControlPermission: hasControl,
		})
	}

	// For now, use empty recent messages and default video state
	// TODO: Implement message history storage
	recentMessages := []Message{}

	videoState := VideoState{
		CurrentTime:  0,
		IsPlaying:    false,
		PlaybackRate: 1.0,
		Volume:       1.0,
	}

	// Send room init event
	initEvent := NewRoomInitEvent(participants, recentMessages, videoState)
	select {
	case client.Send <- initEvent:
	default:
		log.Printf("[WebSocket] Failed to send room init to client %s", client.ID)
	}
}

// Claims represents JWT claims
type Claims struct {
	UserID   string `json:"userId"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// getAvatarURL safely dereferences a string pointer
func getAvatarURL(ptr *string) string {
	if ptr == nil {
		return ""
	}
	return *ptr
}
