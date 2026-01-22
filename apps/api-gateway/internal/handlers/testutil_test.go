package handlers

import (
	"testing"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/yourusername/cowatch/api-gateway/internal/models"
)

const testJWTSecret = "test-secret-key"

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to connect to test database: %v", err)
	}

	// AutoMigrate models
	if err := db.AutoMigrate(
		&models.User{},
		&models.Room{},
		&models.RoomMember{},
	); err != nil {
		t.Fatalf("Failed to migrate test database: %v", err)
	}

	return db
}

func setupTestServer(t *testing.T) (*Server, *gin.Engine) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	server := NewServer(db, testJWTSecret)
	router := gin.New()
	return server, router
}
