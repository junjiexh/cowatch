// Package websocket provides WebSocket connection handling
package websocket

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/gorilla/websocket"
	"gorm.io/gorm"

	"github.com/yourusername/cowatch/api-gateway/internal/api"
)

// Client represents a WebSocket client connection
type Client struct {
	ID                   string
	RoomID               string
	RoomCode             string
	UserID               string
	Username             string
	AvatarURL            string
	IsHost               bool
	HasControlPermission bool
	Conn                 *websocket.Conn
	Send                 chan *WSMessage
	Hub                  *Hub
	DB                   *gorm.DB
}

// Hub maintains active clients and broadcasts messages
type Hub struct {
	// Registered clients by room ID
	rooms map[string]map[*Client]bool

	// Register requests from clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Broadcast messages to all clients in a room
	broadcast chan *BroadcastMessage

	mu sync.RWMutex
}

// BroadcastMessage represents a message to broadcast to a room
type BroadcastMessage struct {
	RoomID  string
	Message *WSMessage
	Exclude *Client // Optional: exclude this client from broadcast
}

// NewHub creates a new WebSocket hub
func NewHub() *Hub {
	return &Hub{
		rooms:      make(map[string]map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan *BroadcastMessage),
	}
}

// Run starts the hub's main loop
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.registerClient(client)

		case client := <-h.unregister:
			h.unregisterClient(client)

		case message := <-h.broadcast:
			h.broadcastToRoom(message)
		}
	}
}

func (h *Hub) registerClient(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.rooms[client.RoomID] == nil {
		h.rooms[client.RoomID] = make(map[*Client]bool)
	}
	h.rooms[client.RoomID][client] = true

	// Notify other clients that a user joined
	userCount := len(h.rooms[client.RoomID])
	joinEvent := NewUserJoinedEvent(
		api.User{
			Id:        client.UserID,
			Username:  client.Username,
			AvatarUrl: &client.AvatarURL,
		},
		userCount,
	)

	// Broadcast to all clients in the room
	go func() {
		h.broadcast <- &BroadcastMessage{
			RoomID:  client.RoomID,
			Message: joinEvent,
		}
	}()

	log.Printf("[WebSocket] Client %s joined room %s (total: %d)", client.ID, client.RoomID, userCount)
}

func (h *Hub) unregisterClient(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if clients, ok := h.rooms[client.RoomID]; ok {
		if _, exists := clients[client]; exists {
			delete(clients, client)
			close(client.Send)

			userCount := len(clients)
			if userCount == 0 {
				delete(h.rooms, client.RoomID)
			}

			// Notify other clients that a user left
			leftEvent := NewUserLeftEvent(client.UserID, client.Username, userCount)
			go func() {
				h.broadcast <- &BroadcastMessage{
					RoomID:  client.RoomID,
					Message: leftEvent,
				}
			}()

			log.Printf("[WebSocket] Client %s left room %s (remaining: %d)", client.ID, client.RoomID, userCount)
		}
	}
}

func (h *Hub) broadcastToRoom(msg *BroadcastMessage) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if clients, ok := h.rooms[msg.RoomID]; ok {
		for client := range clients {
			// Skip excluded client if specified
			if msg.Exclude != nil && client == msg.Exclude {
				continue
			}

			select {
			case client.Send <- msg.Message:
			default:
				// Client's send channel is full, disconnect
				close(client.Send)
				delete(clients, client)
			}
		}
	}
}

// GetOnlineUserIDs returns all online user IDs in a room
func (h *Hub) GetOnlineUserIDs(roomID string) []string {
	h.mu.RLock()
	defer h.mu.RUnlock()

	var userIDs []string
	if clients, ok := h.rooms[roomID]; ok {
		for client := range clients {
			userIDs = append(userIDs, client.UserID)
		}
	}
	return userIDs
}

// GetClientCount returns the number of clients in a room
func (h *Hub) GetClientCount(roomID string) int {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if clients, ok := h.rooms[roomID]; ok {
		return len(clients)
	}
	return 0
}

// ReadPump pumps messages from the WebSocket connection to the hub
func (c *Client) ReadPump() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
	}()

	for {
		var msg WSMessage
		err := c.Conn.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[WebSocket] Error reading message: %v", err)
			}
			break
		}

		// Handle the message
		c.handleMessage(&msg)
	}
}

// WritePump pumps messages from the hub to the WebSocket connection
func (c *Client) WritePump() {
	defer func() {
		c.Conn.Close()
	}()

	for message := range c.Send {
		err := c.Conn.WriteJSON(message)
		if err != nil {
			log.Printf("[WebSocket] Error writing message: %v", err)
			return
		}
	}
}

// handleMessage processes incoming client messages
func (c *Client) handleMessage(msg *WSMessage) {
	// Check permissions for control events
	if RequiresPermission(msg.Type) {
		if !c.hasControlPermission() {
			c.sendError("UNAUTHORIZED", "你没有权限执行此操作")
			return
		}
	}

	switch msg.Type {
	case EventVideoPlay, EventVideoPause:
		c.broadcastVideoControl(msg)

	case EventVideoSeek:
		c.handleVideoSeek(msg)

	case EventVideoSync:
		c.handleVideoSync(msg)

	case EventChatMessage:
		c.handleChatMessage(msg)

	case EventVideoChange:
		c.handleVideoChange(msg)

	default:
		c.sendError("UNKNOWN_EVENT", "未知的事件类型")
	}
}

func (c *Client) broadcastVideoControl(msg *WSMessage) {
	isPlaying := msg.Type == EventVideoPlay

	stateEvent := NewVideoStateEvent(0, isPlaying, 1.0, c.UserID)

	c.Hub.broadcast <- &BroadcastMessage{
		RoomID:  c.RoomID,
		Message: stateEvent,
	}
}

func (c *Client) handleVideoSeek(msg *WSMessage) {
	var payload VideoSeekPayload
	if err := c.parsePayload(msg.Payload, &payload); err != nil {
		c.sendError("INVALID_PAYLOAD", "无效的消息内容")
		return
	}

	stateEvent := NewVideoStateEvent(payload.CurrentTime, false, 1.0, c.UserID)

	c.Hub.broadcast <- &BroadcastMessage{
		RoomID:  c.RoomID,
		Message: stateEvent,
	}
}

func (c *Client) handleVideoSync(msg *WSMessage) {
	var payload VideoSyncPayload
	if err := c.parsePayload(msg.Payload, &payload); err != nil {
		c.sendError("INVALID_PAYLOAD", "无效的消息内容")
		return
	}

	stateEvent := NewVideoStateEvent(
		payload.CurrentTime,
		payload.IsPlaying,
		payload.PlaybackRate,
		c.UserID,
	)

	c.Hub.broadcast <- &BroadcastMessage{
		RoomID:  c.RoomID,
		Message: stateEvent,
		Exclude: c, // Don't send back to sender
	}
}

func (c *Client) handleChatMessage(msg *WSMessage) {
	var payload ChatMessagePayload
	if err := c.parsePayload(msg.Payload, &payload); err != nil {
		c.sendError("INVALID_PAYLOAD", "无效的消息内容")
		return
	}

	chatEvent := NewChatMessageEvent(
		api.User{
			Id:       c.UserID,
			Username: c.Username,
		},
		payload.Message,
	)

	c.Hub.broadcast <- &BroadcastMessage{
		RoomID:  c.RoomID,
		Message: chatEvent,
	}
}

func (c *Client) handleVideoChange(msg *WSMessage) {
	var payload VideoChangePayload
	if err := c.parsePayload(msg.Payload, &payload); err != nil {
		c.sendError("INVALID_PAYLOAD", "无效的消息内容")
		return
	}

	// TODO: Fetch video details from database
	// For now, create a placeholder video source
	video := api.VideoSource{
		Id:   payload.VideoID,
		Type: api.VideoSourceTypeBilibili,
		Url:  "https://example.com/video",
	}

	changeEvent := NewVideoChangedEvent(video, c.UserID)

	c.Hub.broadcast <- &BroadcastMessage{
		RoomID:  c.RoomID,
		Message: changeEvent,
	}
}

func (c *Client) sendError(code, message string) {
	errorEvent := NewErrorEvent(code, message)
	select {
	case c.Send <- errorEvent:
	default:
		log.Printf("[WebSocket] Failed to send error to client %s", c.ID)
	}
}

func (c *Client) parsePayload(payload interface{}, target interface{}) error {
	// Convert payload to JSON and back to parse into target struct
	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, target)
}

func (c *Client) hasControlPermission() bool {
	return c.IsHost || c.HasControlPermission
}
