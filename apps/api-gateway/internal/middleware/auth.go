package middleware

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"

	"github.com/yourusername/cowatch/api-gateway/internal/api"
	"github.com/yourusername/cowatch/api-gateway/internal/models"
)

const (
	UserContextKey = "user"
	TokenExpiry    = 24 * time.Hour * 7 // 7 days
)

type Claims struct {
	UserID   string `json:"userId"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// AuthMiddleware creates a middleware that validates JWT tokens
func AuthMiddleware(db *gorm.DB, jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			respondError(c, http.StatusUnauthorized, "UNAUTHORIZED", "未登录")
			return
		}

		// Extract token from "Bearer <token>"
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			respondError(c, http.StatusUnauthorized, "INVALID_TOKEN", "无效的认证令牌")
			return
		}

		tokenString := parts[1]
		claims := &Claims{}

		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			respondError(c, http.StatusUnauthorized, "INVALID_TOKEN", "无效的认证令牌")
			return
		}

		// Load user from database
		var user models.User
		if err := db.First(&user, "id = ?", claims.UserID).Error; err != nil {
			respondError(c, http.StatusUnauthorized, "USER_NOT_FOUND", "用户不存在")
			return
		}

		// Set user in context
		c.Set(UserContextKey, &user)
		c.Next()
	}
}

// OptionalAuthMiddleware creates a middleware that validates JWT tokens if present
// but allows requests without authentication to pass through
func OptionalAuthMiddleware(db *gorm.DB, jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.Next()
			return
		}

		tokenString := parts[1]
		claims := &Claims{}

		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			c.Next()
			return
		}

		var user models.User
		if err := db.First(&user, "id = ?", claims.UserID).Error; err == nil {
			c.Set(UserContextKey, &user)
		}

		c.Next()
	}
}

// GetUser retrieves the authenticated user from context
func GetUser(c *gin.Context) (*models.User, bool) {
	user, exists := c.Get(UserContextKey)
	if !exists {
		return nil, false
	}
	return user.(*models.User), true
}

// GenerateToken creates a JWT token for a user
func GenerateToken(user *models.User, jwtSecret string) (string, error) {
	claims := &Claims{
		UserID:   user.ID,
		Username: user.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(TokenExpiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(jwtSecret))
}

func respondError(c *gin.Context, status int, code, message string) {
	c.AbortWithStatusJSON(status, api.Error{
		Code:    code,
		Message: message,
	})
}
