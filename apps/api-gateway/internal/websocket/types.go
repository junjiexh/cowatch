// Package websocket provides WebSocket event type definitions
// Based on api-specs/websocket.md
package websocket

import "time"

// WSMessage is the base WebSocket message structure
type WSMessage struct {
	Type      string      `json:"type"`
	Payload   interface{} `json:"payload"`
	Timestamp int64       `json:"timestamp"`
}

// NewMessage creates a new WebSocket message with current timestamp
func NewMessage(eventType string, payload interface{}) *WSMessage {
	return &WSMessage{
		Type:      eventType,
		Payload:   payload,
		Timestamp: time.Now().UnixMilli(),
	}
}

// ============ Client Events (客户端发送事件) ============

// VideoControlPayload is an empty payload for video play/pause events
type VideoControlPayload struct{}

// VideoSeekPayload represents a video seek event payload
type VideoSeekPayload struct {
	CurrentTime float64 `json:"currentTime"`
}

// VideoSyncPayload represents a video sync event payload
type VideoSyncPayload struct {
	CurrentTime  float64 `json:"currentTime"`
	IsPlaying    bool    `json:"isPlaying"`
	PlaybackRate float64 `json:"playbackRate"`
}

// ChatMessagePayload represents a chat message event payload
type ChatMessagePayload struct {
	Message string `json:"message"`
}

// VideoChangePayload represents a video change event payload
type VideoChangePayload struct {
	VideoID string `json:"videoId"`
}

// Client event type constants
const (
	EventVideoPlay   = "video:play"
	EventVideoPause  = "video:pause"
	EventVideoSeek   = "video:seek"
	EventVideoSync   = "video:sync"
	EventChatMessage = "chat:message"
	EventVideoChange = "video:change"
)

// ============ Server Events (服务端推送事件) ============

// User represents a user in the system
type User struct {
	ID        string `json:"id"`
	Username  string `json:"username"`
	AvatarURL string `json:"avatarUrl,omitempty"`
}

// UserJoinedPayload represents a user joined event payload
type UserJoinedPayload struct {
	User      User `json:"user"`
	UserCount int  `json:"userCount"`
}

// UserLeftPayload represents a user left event payload
type UserLeftPayload struct {
	UserID    string `json:"userId"`
	Username  string `json:"username"`
	UserCount int    `json:"userCount"`
}

// VideoStatePayload represents a video state event payload
type VideoStatePayload struct {
	CurrentTime  float64 `json:"currentTime"`
	IsPlaying    bool    `json:"isPlaying"`
	PlaybackRate float64 `json:"playbackRate"`
	TriggeredBy  string  `json:"triggeredBy"`
}

// ChatMessageBroadcastPayload represents a chat message broadcast event payload
type ChatMessageBroadcastPayload struct {
	User      User   `json:"user"`
	Message   string `json:"message"`
	Timestamp int64  `json:"timestamp"`
}

// VideoSource represents a video source (matching OpenAPI schema)
type VideoSource struct {
	ID        string  `json:"id"`
	Type      string  `json:"type"`
	URL       string  `json:"url"`
	Title     *string `json:"title,omitempty"`
	Duration  *int    `json:"duration,omitempty"`
	Thumbnail *string `json:"thumbnail,omitempty"`
	StreamURL *string `json:"streamUrl,omitempty"`
}

// VideoChangedPayload represents a video changed event payload
type VideoChangedPayload struct {
	Video     VideoSource `json:"video"`
	ChangedBy string      `json:"changedBy"`
}

// ErrorPayload represents an error event payload
type ErrorPayload struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// Server event type constants
const (
	EventUserJoined  = "user:joined"
	EventUserLeft    = "user:left"
	EventVideoState  = "video:state"
	EventChatBcast   = "chat:message"
	EventVideoChanged = "video:changed"
	EventError       = "error"
)

// ============ Helper Functions ============

// NewUserJoinedEvent creates a new user joined event
func NewUserJoinedEvent(user User, userCount int) *WSMessage {
	return NewMessage(EventUserJoined, UserJoinedPayload{
		User:      user,
		UserCount: userCount,
	})
}

// NewUserLeftEvent creates a new user left event
func NewUserLeftEvent(userID, username string, userCount int) *WSMessage {
	return NewMessage(EventUserLeft, UserLeftPayload{
		UserID:    userID,
		Username:  username,
		UserCount: userCount,
	})
}

// NewVideoStateEvent creates a new video state event
func NewVideoStateEvent(currentTime float64, isPlaying bool, playbackRate float64, triggeredBy string) *WSMessage {
	return NewMessage(EventVideoState, VideoStatePayload{
		CurrentTime:  currentTime,
		IsPlaying:    isPlaying,
		PlaybackRate: playbackRate,
		TriggeredBy:  triggeredBy,
	})
}

// NewChatMessageEvent creates a new chat message broadcast event
func NewChatMessageEvent(user User, message string) *WSMessage {
	return NewMessage(EventChatBcast, ChatMessageBroadcastPayload{
		User:      user,
		Message:   message,
		Timestamp: time.Now().UnixMilli(),
	})
}

// NewVideoChangedEvent creates a new video changed event
func NewVideoChangedEvent(video VideoSource, changedBy string) *WSMessage {
	return NewMessage(EventVideoChanged, VideoChangedPayload{
		Video:     video,
		ChangedBy: changedBy,
	})
}

// NewErrorEvent creates a new error event
func NewErrorEvent(code, message string) *WSMessage {
	return NewMessage(EventError, ErrorPayload{
		Code:    code,
		Message: message,
	})
}

// ============ Permission Constants ============

// ControlPermissionEvents are events that require host or special permissions
var ControlPermissionEvents = map[string]bool{
	EventVideoPlay:   true,
	EventVideoPause:  true,
	EventVideoSeek:   true,
	EventVideoChange: true,
}

// RequiresPermission checks if an event type requires special permissions
func RequiresPermission(eventType string) bool {
	return ControlPermissionEvents[eventType]
}
