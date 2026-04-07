package model

import (
	"time"

	"gorm.io/gorm"
)

type Role string

const (
	RoleCandidate Role = "candidate"
	RoleHiringManager   Role = "hiring_manager"
	RoleHR        Role = "hr"
	RoleAdmin     Role = "admin"
)

type Gender string

const (
	GenderMale   Gender = "male"
	GenderFemale Gender = "female"
)

// UserRole represents a many-to-many relationship between users and roles
// This allows a user to have multiple roles over time
type UserRole struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;uniqueIndex:idx_user_role" json:"user_id"`
	Role      string    `gorm:"type:varchar(20);not null;uniqueIndex:idx_user_role;index" json:"role"`
	CreatedAt time.Time `json:"created_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"type:varchar(100)" json:"name" validate:"required,min=3,max=100"`
	Email     string         `gorm:"unique;not null" json:"email" validate:"required,email"`
	Password  string         `gorm:"not null" json:"-" validate:"required,min=6"`
	Role      string         `gorm:"type:varchar(20);default:'candidate'" json:"role"` // Kept for backward compatibility
	Phone     string         `json:"phone,omitempty" validate:"omitempty,phone"`
	LinkedIn  string         `json:"linkedin,omitempty" validate:"omitempty,url"`
	Address   string         `json:"address,omitempty" validate:"omitempty,min=5,max=255"`
	Gender    string         `gorm:"type:varchar(20)" json:"gender,omitempty" validate:"omitempty,oneof=male female"`
	Photo     string         `gorm:"type:varchar(300)" json:"photo,omitempty"` // NAMA FILE SAJA!
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	ReceiveNotification bool `gorm:"default:true" json:"receive_notification,omitempty"`
	// Roles relationship - a user can have multiple roles
	Roles []UserRole `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"roles,omitempty"`
}