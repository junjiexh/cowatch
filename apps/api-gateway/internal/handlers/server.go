package handlers

import (
	"gorm.io/gorm"

	"github.com/yourusername/cowatch/api-gateway/internal/api"
)

// Server implements the api.ServerInterface
type Server struct {
	db        *gorm.DB
	jwtSecret string
}

// NewServer creates a new Server instance
func NewServer(db *gorm.DB, jwtSecret string) *Server {
	return &Server{
		db:        db,
		jwtSecret: jwtSecret,
	}
}

// Ensure Server implements ServerInterface at compile time
var _ api.ServerInterface = (*Server)(nil)
