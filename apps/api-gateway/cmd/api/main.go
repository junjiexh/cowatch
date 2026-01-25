package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/cowatch/api-gateway/internal/api"
	"github.com/yourusername/cowatch/api-gateway/internal/config"
	"github.com/yourusername/cowatch/api-gateway/internal/database"
	"github.com/yourusername/cowatch/api-gateway/internal/handlers"
	"github.com/yourusername/cowatch/api-gateway/internal/middleware"
	"github.com/yourusername/cowatch/api-gateway/internal/websocket"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Connect to database
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Create server
	server := handlers.NewServer(db, cfg.JWTSecret)

	// Create and start WebSocket hub
	wsHub := websocket.NewHub()
	go wsHub.Run()

	// Create WebSocket HTTP handler
	wsHandler := websocket.NewHTTPHandler(wsHub, db, cfg.JWTSecret)

	// Create router
	router := gin.Default()

	// CORS middleware
	router.Use(corsMiddleware())

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Create API group with /api/v1 prefix
	apiGroup := router.Group("/api/v1")

	// Routes that require authentication
	authRequired := []string{
		"/auth/me",
		"/auth/logout",
		"/rooms",          // POST only, but we apply to all and check in handler
		"/users/me/recent-rooms",
	}

	// Register handlers with auth middleware for protected routes
	api.RegisterHandlersWithOptions(apiGroup, server, api.GinServerOptions{
		Middlewares: []api.MiddlewareFunc{
			func(c *gin.Context) {
				// Skip auth for public routes
				path := c.Request.URL.Path
				method := c.Request.Method

				// Public routes (no auth required)
				publicRoutes := map[string][]string{
					"/api/v1/auth/register": {"POST"},
					"/api/v1/auth/login":    {"POST"},
					"/api/v1/rooms":         {"GET"},
				}

				// Check if route is public
				if methods, ok := publicRoutes[path]; ok {
					for _, m := range methods {
						if m == method {
							c.Next()
							return
						}
					}
				}

				// Apply auth middleware for protected routes
				for _, route := range authRequired {
					fullPath := "/api/v1" + route
					if path == fullPath || (len(path) > len(fullPath) && path[:len(fullPath)] == fullPath) {
						middleware.AuthMiddleware(db, cfg.JWTSecret)(c)
						return
					}
				}

				// Default: require auth for any unmatched route
				middleware.AuthMiddleware(db, cfg.JWTSecret)(c)
			},
		},
	})

	// WebSocket endpoint for room connections
	// URL: ws://localhost:8080/ws/rooms/{roomCode}?token=xxx
	router.GET("/ws/rooms/:roomCode", wsHandler.HandleWebSocket)

	// Start server
	log.Printf("Starting server on port %s", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
		c.Header("Access-Control-Max-Age", "86400")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
