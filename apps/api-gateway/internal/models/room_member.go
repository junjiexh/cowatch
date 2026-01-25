package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RoomMember struct {
	ID                    string    `gorm:"type:uuid;primaryKey" json:"id"`
	RoomID                string    `gorm:"type:uuid;not null;uniqueIndex:idx_room_user" json:"roomId"`
	Room                  *Room     `gorm:"foreignKey:RoomID;constraint:OnDelete:CASCADE" json:"room,omitempty"`
	UserID                string    `gorm:"type:uuid;not null;uniqueIndex:idx_room_user" json:"userId"`
	User                  *User     `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
	HasControlPermission  bool      `gorm:"default:false" json:"hasControlPermission"`
	LastVisitedAt         time.Time `gorm:"index" json:"lastVisitedAt"`
	LastWatchedVideoTitle *string   `gorm:"size:255" json:"lastWatchedVideoTitle,omitempty"`
	CreatedAt             time.Time `json:"createdAt"`
}

func (rm *RoomMember) BeforeCreate(tx *gorm.DB) error {
	if rm.ID == "" {
		rm.ID = uuid.New().String()
	}
	if rm.LastVisitedAt.IsZero() {
		rm.LastVisitedAt = time.Now()
	}
	return nil
}

// TableName sets the table name with unique constraint
func (RoomMember) TableName() string {
	return "room_members"
}
