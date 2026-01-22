package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/yourusername/cowatch/api-gateway/internal/api"
	"github.com/yourusername/cowatch/api-gateway/internal/middleware"
	"github.com/yourusername/cowatch/api-gateway/internal/models"
)

func TestGetUsersMeRecentRooms(t *testing.T) {
	server, router := setupTestServer(t)
	router.GET("/users/me/recent-rooms", middleware.AuthMiddleware(server.db, testJWTSecret), func(c *gin.Context) {
		server.GetUsersMeRecentRooms(c, api.GetUsersMeRecentRoomsParams{})
	})

	// Create test user
	user := models.User{Username: "recentroomuser"}
	user.SetPassword("password123")
	server.db.Create(&user)
	token, _ := middleware.GenerateToken(&user, testJWTSecret)

	// Create rooms owned by another user
	owner := models.User{Username: "recentroomowner"}
	owner.SetPassword("password123")
	server.db.Create(&owner)

	room1 := models.Room{Name: "Room 1", OwnerID: owner.ID, IsActive: true}
	room2 := models.Room{Name: "Room 2", OwnerID: owner.ID, IsActive: true}
	server.db.Create(&room1)
	server.db.Create(&room2)

	// Add user as member to rooms
	member1 := models.RoomMember{
		RoomID:        room1.ID,
		UserID:        user.ID,
		LastVisitedAt: time.Now().Add(-1 * time.Hour),
	}
	member2 := models.RoomMember{
		RoomID:        room2.ID,
		UserID:        user.ID,
		LastVisitedAt: time.Now(),
	}
	server.db.Create(&member1)
	server.db.Create(&member2)

	t.Run("get recent rooms", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/users/me/recent-rooms", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var rooms []api.RecentRoom
		err := json.Unmarshal(w.Body.Bytes(), &rooms)
		require.NoError(t, err)
		assert.Len(t, rooms, 2)
		// Most recent should be first
		assert.Equal(t, "Room 2", rooms[0].Room.Name)
		assert.Equal(t, "Room 1", rooms[1].Room.Name)
	})

	t.Run("unauthenticated user", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/users/me/recent-rooms", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})
}
