package models

import (
	"crypto/rand"
	"math/big"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

const codeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

type Room struct {
	ID           string    `gorm:"type:uuid;primaryKey" json:"id"`
	Code         string    `gorm:"size:8;uniqueIndex;not null" json:"code"`
	Name         string    `gorm:"size:100;not null" json:"name"`
	OwnerID      string    `gorm:"type:uuid;not null;index" json:"ownerId"`
	Owner        *User     `gorm:"foreignKey:OwnerID" json:"owner,omitempty"`
	PasswordHash *string   `gorm:"size:255" json:"-"`
	MaxUsers     int       `gorm:"default:20" json:"maxUsers"`
	IsActive     bool      `gorm:"default:true;index" json:"isActive"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

func (r *Room) BeforeCreate(tx *gorm.DB) error {
	if r.ID == "" {
		r.ID = uuid.New().String()
	}
	if r.Code == "" {
		r.Code = generateRoomCode()
	}
	if r.MaxUsers == 0 {
		r.MaxUsers = 20
	}
	return nil
}

// generateRoomCode generates an 8-character uppercase alphanumeric code
func generateRoomCode() string {
	code := make([]byte, 8)
	for i := range code {
		n, _ := rand.Int(rand.Reader, big.NewInt(int64(len(codeChars))))
		code[i] = codeChars[n.Int64()]
	}
	return string(code)
}

// SetPassword hashes and sets the room password
func (r *Room) SetPassword(password string) error {
	if password == "" {
		r.PasswordHash = nil
		return nil
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	hashStr := string(hash)
	r.PasswordHash = &hashStr
	return nil
}

// CheckPassword verifies the provided password
func (r *Room) CheckPassword(password string) bool {
	if r.PasswordHash == nil {
		return true // No password required
	}
	err := bcrypt.CompareHashAndPassword([]byte(*r.PasswordHash), []byte(password))
	return err == nil
}

// HasPassword returns whether the room requires a password
func (r *Room) HasPassword() bool {
	return r.PasswordHash != nil
}
