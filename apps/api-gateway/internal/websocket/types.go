// Package websocket provides WebSocket event type definitions
// Based on api-specs/websocket.md
package websocket

import (
	"time"

	"github.com/yourusername/cowatch/api-gateway/internal/api"
)

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

// UserJoinedPayload represents a user joined event payload
type UserJoinedPayload struct {
	User      api.User `json:"user"`
	UserCount int      `json:"userCount"`
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
	User      api.User `json:"user"`
	Message   string   `json:"message"`
	Timestamp int64    `json:"timestamp"`
}

// VideoChangedPayload represents a video changed event payload
type VideoChangedPayload struct {
	Video     api.VideoSource `json:"video"`
	ChangedBy string          `json:"changedBy"`
}

// ErrorPayload represents an error event payload
type ErrorPayload struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// Server event type constants
const (
	EventRoomInit          = "room:init"
	EventUserJoined        = "user:joined"
	EventUserLeft          = "user:left"
	EventUserStatus        = "user:status"
	EventVideoState        = "video:state"
	EventChatBcast         = "chat:message"
	EventVideoChanged      = "video:changed"
	EventPermissionChanged = "permission:changed"
	EventError             = "error"
)

// ============ Room Init Payloads ============

// RoomParticipant represents a participant in the room
type RoomParticipant struct {
	ID                   string  `json:"id"`
	Username             string  `json:"username"`
	AvatarURL            *string `json:"avatarUrl,omitempty"`
	IsOnline             bool    `json:"isOnline"`
	Role                 string  `json:"role"` // "host" or "member"
	HasControlPermission bool    `json:"hasControlPermission"`
}

// Message represents a chat message in room history
type Message struct {
	ID        string   `json:"id"`
	User      api.User `json:"user"`
	Content   string   `json:"content"`
	Timestamp int64    `json:"timestamp"`
}

// VideoState represents the current video playback state
type VideoState struct {
	CurrentTime  float64 `json:"currentTime"`
	IsPlaying    bool    `json:"isPlaying"`
	PlaybackRate float64 `json:"playbackRate"`
	Volume       float64 `json:"volume"`
}

// RoomInitPayload represents the room initialization event payload
type RoomInitPayload struct {
	Participants   []RoomParticipant `json:"participants"`
	RecentMessages []Message         `json:"recentMessages"`
	VideoState     VideoState        `json:"videoState"`
}

// UserStatusPayload represents a user online/offline status change
type UserStatusPayload struct {
	UserID   string `json:"userId"`
	IsOnline bool   `json:"isOnline"`
}

// PermissionChangedPayload represents a permission change event
type PermissionChangedPayload struct {
	UserID               string `json:"userId"`
	HasControlPermission bool   `json:"hasControlPermission"`
	ChangedBy            string `json:"changedBy"`
}

// ============ Helper Functions ============

// NewUserJoinedEvent creates a new user joined event
func NewUserJoinedEvent(user api.User, userCount int) *WSMessage {
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
func NewChatMessageEvent(user api.User, message string) *WSMessage {
	return NewMessage(EventChatBcast, ChatMessageBroadcastPayload{
		User:      user,
		Message:   message,
		Timestamp: time.Now().UnixMilli(),
	})
}

// NewVideoChangedEvent creates a new video changed event
func NewVideoChangedEvent(video api.VideoSource, changedBy string) *WSMessage {
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

// NewRoomInitEvent creates a new room initialization event
func NewRoomInitEvent(participants []RoomParticipant, messages []Message, videoState VideoState) *WSMessage {
	return NewMessage(EventRoomInit, RoomInitPayload{
		Participants:   participants,
		RecentMessages: messages,
		VideoState:     videoState,
	})
}

// NewUserStatusEvent creates a new user status event
func NewUserStatusEvent(userID string, isOnline bool) *WSMessage {
	return NewMessage(EventUserStatus, UserStatusPayload{
		UserID:   userID,
		IsOnline: isOnline,
	})
}

// NewPermissionChangedEvent creates a new permission changed event
func NewPermissionChangedEvent(userID string, hasControlPermission bool, changedBy string) *WSMessage {
	return NewMessage(EventPermissionChanged, PermissionChangedPayload{
		UserID:               userID,
		HasControlPermission: hasControlPermission,
		ChangedBy:            changedBy,
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
