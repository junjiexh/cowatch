package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/yourusername/cowatch/api-gateway/internal/api"
	"github.com/yourusername/cowatch/api-gateway/internal/middleware"
	"github.com/yourusername/cowatch/api-gateway/internal/models"
)

func TestPostAuthRegister(t *testing.T) {
	server, router := setupTestServer(t)
	router.POST("/auth/register", server.PostAuthRegister)

	t.Run("successful registration", func(t *testing.T) {
		body := `{"username":"testuser","password":"password123"}`
		req := httptest.NewRequest("POST", "/auth/register", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)

		var response api.AuthResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)
		assert.Equal(t, "testuser", response.User.Username)
		assert.NotEmpty(t, response.Token)
		assert.NotEmpty(t, response.User.Id)
	})

	t.Run("duplicate username", func(t *testing.T) {
		body := `{"username":"testuser","password":"password456"}`
		req := httptest.NewRequest("POST", "/auth/register", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusConflict, w.Code)

		var errResp api.Error
		err := json.Unmarshal(w.Body.Bytes(), &errResp)
		require.NoError(t, err)
		assert.Equal(t, "USERNAME_EXISTS", errResp.Code)
	})

	t.Run("invalid username length", func(t *testing.T) {
		body := `{"username":"a","password":"password123"}`
		req := httptest.NewRequest("POST", "/auth/register", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("invalid password length", func(t *testing.T) {
		body := `{"username":"validuser","password":"12345"}`
		req := httptest.NewRequest("POST", "/auth/register", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestPostAuthLogin(t *testing.T) {
	server, router := setupTestServer(t)
	router.POST("/auth/login", server.PostAuthLogin)

	// Create a test user first
	user := models.User{Username: "loginuser"}
	user.SetPassword("password123")
	server.db.Create(&user)

	t.Run("successful login", func(t *testing.T) {
		body := `{"username":"loginuser","password":"password123"}`
		req := httptest.NewRequest("POST", "/auth/login", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response api.AuthResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)
		assert.Equal(t, "loginuser", response.User.Username)
		assert.NotEmpty(t, response.Token)
	})

	t.Run("wrong password", func(t *testing.T) {
		body := `{"username":"loginuser","password":"wrongpassword"}`
		req := httptest.NewRequest("POST", "/auth/login", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("non-existent user", func(t *testing.T) {
		body := `{"username":"nonexistent","password":"password123"}`
		req := httptest.NewRequest("POST", "/auth/login", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})
}

func TestGetAuthMe(t *testing.T) {
	server, router := setupTestServer(t)
	router.GET("/auth/me", middleware.AuthMiddleware(server.db, testJWTSecret), server.GetAuthMe)

	// Create a test user
	user := models.User{Username: "meuser"}
	user.SetPassword("password123")
	server.db.Create(&user)

	t.Run("authenticated user", func(t *testing.T) {
		token, _ := middleware.GenerateToken(&user, testJWTSecret)

		req := httptest.NewRequest("GET", "/auth/me", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response api.User
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)
		assert.Equal(t, "meuser", response.Username)
	})

	t.Run("unauthenticated user", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/auth/me", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})
}

func TestPostAuthLogout(t *testing.T) {
	server, router := setupTestServer(t)
	router.POST("/auth/logout", server.PostAuthLogout)

	t.Run("logout returns no content", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/auth/logout", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNoContent, w.Code)
	})
}
