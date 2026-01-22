package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/yourusername/cowatch/api-gateway/internal/api"
	"github.com/yourusername/cowatch/api-gateway/internal/middleware"
	"github.com/yourusername/cowatch/api-gateway/internal/models"
)

func TestGetRooms(t *testing.T) {
	server, router := setupTestServer(t)
	router.GET("/rooms", func(c *gin.Context) {
		server.GetRooms(c, api.GetRoomsParams{})
	})

	// Create test rooms
	user := models.User{Username: "roomowner"}
	user.SetPassword("password123")
	server.db.Create(&user)

	for i := 0; i < 3; i++ {
		room := models.Room{
			Name:     "Test Room " + string(rune('A'+i)),
			OwnerID:  user.ID,
			IsActive: true,
		}
		server.db.Create(&room)
	}

	t.Run("list rooms", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/rooms", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var rooms []api.Room
		err := json.Unmarshal(w.Body.Bytes(), &rooms)
		require.NoError(t, err)
		assert.Len(t, rooms, 3)
	})
}

func TestPostRooms(t *testing.T) {
	server, router := setupTestServer(t)
	router.POST("/rooms", middleware.AuthMiddleware(server.db, testJWTSecret), server.PostRooms)

	// Create test user
	user := models.User{Username: "roomcreator"}
	user.SetPassword("password123")
	server.db.Create(&user)
	token, _ := middleware.GenerateToken(&user, testJWTSecret)

	t.Run("create room successfully", func(t *testing.T) {
		body := `{"name":"My Test Room"}`
		req := httptest.NewRequest("POST", "/rooms", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)

		var room api.Room
		err := json.Unmarshal(w.Body.Bytes(), &room)
		require.NoError(t, err)
		assert.Equal(t, "My Test Room", room.Name)
		assert.Len(t, room.Code, 8)
		assert.Equal(t, user.ID, room.OwnerId)
	})

	t.Run("create room with password", func(t *testing.T) {
		body := `{"name":"Private Room","password":"secret123"}`
		req := httptest.NewRequest("POST", "/rooms", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)

		var room api.Room
		err := json.Unmarshal(w.Body.Bytes(), &room)
		require.NoError(t, err)
		assert.True(t, *room.HasPassword)
	})

	t.Run("create room without auth", func(t *testing.T) {
		body := `{"name":"Unauthorized Room"}`
		req := httptest.NewRequest("POST", "/rooms", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})
}

func TestGetRoomsRoomCode(t *testing.T) {
	server, router := setupTestServer(t)
	router.GET("/rooms/:roomCode", func(c *gin.Context) {
		server.GetRoomsRoomCode(c, c.Param("roomCode"))
	})

	// Create test room
	user := models.User{Username: "roomowner2"}
	user.SetPassword("password123")
	server.db.Create(&user)

	room := models.Room{
		Name:     "Findable Room",
		OwnerID:  user.ID,
		IsActive: true,
	}
	server.db.Create(&room)

	t.Run("get existing room", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/rooms/"+room.Code, nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response api.Room
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)
		assert.Equal(t, room.Code, response.Code)
		assert.Equal(t, "Findable Room", response.Name)
	})

	t.Run("get non-existent room", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/rooms/NOTFOUND", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}

func TestPostRoomsRoomCodeJoin(t *testing.T) {
	server, router := setupTestServer(t)
	router.POST("/rooms/:roomCode/join", middleware.AuthMiddleware(server.db, testJWTSecret), func(c *gin.Context) {
		server.PostRoomsRoomCodeJoin(c, c.Param("roomCode"))
	})

	// Create test users
	owner := models.User{Username: "roomowner3"}
	owner.SetPassword("password123")
	server.db.Create(&owner)

	joiner := models.User{Username: "roomjoiner"}
	joiner.SetPassword("password123")
	server.db.Create(&joiner)
	token, _ := middleware.GenerateToken(&joiner, testJWTSecret)

	// Create public room
	publicRoom := models.Room{
		Name:     "Public Room",
		OwnerID:  owner.ID,
		IsActive: true,
	}
	server.db.Create(&publicRoom)

	// Create private room
	privateRoom := models.Room{
		Name:     "Private Room",
		OwnerID:  owner.ID,
		IsActive: true,
	}
	privateRoom.SetPassword("roompassword")
	server.db.Create(&privateRoom)

	t.Run("join public room", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/rooms/"+publicRoom.Code+"/join", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("join private room with correct password", func(t *testing.T) {
		body := `{"password":"roompassword"}`
		req := httptest.NewRequest("POST", "/rooms/"+privateRoom.Code+"/join", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("join private room with wrong password", func(t *testing.T) {
		body := `{"password":"wrongpassword"}`
		req := httptest.NewRequest("POST", "/rooms/"+privateRoom.Code+"/join", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusForbidden, w.Code)
	})

	t.Run("join non-existent room", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/rooms/NOTFOUND/join", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}
