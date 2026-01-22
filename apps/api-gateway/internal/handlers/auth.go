package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/cowatch/api-gateway/internal/api"
	"github.com/yourusername/cowatch/api-gateway/internal/middleware"
	"github.com/yourusername/cowatch/api-gateway/internal/models"
)

// PostAuthRegister handles user registration
// POST /auth/register
func (s *Server) PostAuthRegister(c *gin.Context) {
	var req api.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数错误")
		return
	}

	// Validate input
	if len(req.Username) < 2 || len(req.Username) > 20 {
		respondError(c, http.StatusBadRequest, "INVALID_USERNAME", "用户名长度必须在2-20个字符之间")
		return
	}
	if len(req.Password) < 6 || len(req.Password) > 100 {
		respondError(c, http.StatusBadRequest, "INVALID_PASSWORD", "密码长度必须在6-100个字符之间")
		return
	}

	// Check if username already exists
	var existingUser models.User
	if err := s.db.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		respondError(c, http.StatusConflict, "USERNAME_EXISTS", "用户名已存在")
		return
	}

	// Create user
	user := models.User{
		Username: req.Username,
	}
	if err := user.SetPassword(req.Password); err != nil {
		respondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "服务器内部错误")
		return
	}

	if err := s.db.Create(&user).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "创建用户失败")
		return
	}

	// Generate JWT token
	token, err := middleware.GenerateToken(&user, s.jwtSecret)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "生成令牌失败")
		return
	}

	c.JSON(http.StatusCreated, api.AuthResponse{
		User: api.User{
			Id:        user.ID,
			Username:  user.Username,
			AvatarUrl: user.AvatarURL,
		},
		Token: token,
	})
}

// PostAuthLogin handles user login
// POST /auth/login
func (s *Server) PostAuthLogin(c *gin.Context) {
	var req api.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数错误")
		return
	}

	// Find user by username
	var user models.User
	if err := s.db.Where("username = ?", req.Username).First(&user).Error; err != nil {
		respondError(c, http.StatusUnauthorized, "INVALID_CREDENTIALS", "用户名或密码错误")
		return
	}

	// Verify password
	if !user.CheckPassword(req.Password) {
		respondError(c, http.StatusUnauthorized, "INVALID_CREDENTIALS", "用户名或密码错误")
		return
	}

	// Generate JWT token
	token, err := middleware.GenerateToken(&user, s.jwtSecret)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "生成令牌失败")
		return
	}

	c.JSON(http.StatusOK, api.AuthResponse{
		User: api.User{
			Id:        user.ID,
			Username:  user.Username,
			AvatarUrl: user.AvatarURL,
		},
		Token: token,
	})
}

// PostAuthLogout handles user logout
// POST /auth/logout
func (s *Server) PostAuthLogout(c *gin.Context) {
	// For JWT-based auth, logout is handled client-side by removing the token
	// Server-side, we just return success
	c.Status(http.StatusNoContent)
}

// GetAuthMe returns the current authenticated user
// GET /auth/me
func (s *Server) GetAuthMe(c *gin.Context) {
	user, ok := middleware.GetUser(c)
	if !ok {
		respondError(c, http.StatusUnauthorized, "UNAUTHORIZED", "未登录")
		return
	}

	c.JSON(http.StatusOK, api.User{
		Id:        user.ID,
		Username:  user.Username,
		AvatarUrl: user.AvatarURL,
	})
}

func respondError(c *gin.Context, status int, code, message string) {
	c.JSON(status, api.Error{
		Code:    code,
		Message: message,
	})
}
