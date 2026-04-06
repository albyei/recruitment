package repository

import (
	"wowrack-recruitment/internal/model"

	"gorm.io/gorm"
)

// UserRoleRepository defines operations for the user_roles junction table
type UserRoleRepository interface {
	FindByUserID(userID uint) ([]model.UserRole, error)
	Create(userRole *model.UserRole) error
	Delete(userID uint, role string) error
	DeleteAll(userID uint) error
}

type userRoleRepository struct {
	db *gorm.DB
}

// NewUserRoleRepository creates a new UserRoleRepository
func NewUserRoleRepository(db *gorm.DB) UserRoleRepository {
	return &userRoleRepository{db: db}
}

// FindByUserID returns all active roles for a user
func (r *userRoleRepository) FindByUserID(userID uint) ([]model.UserRole, error) {
	var roles []model.UserRole
	err := r.db.Where("user_id = ?", userID).Find(&roles).Error
	return roles, err
}

// Create adds a new role to a user
func (r *userRoleRepository) Create(userRole *model.UserRole) error {
	return r.db.Create(userRole).Error
}

// Delete removes a specific role from a user
func (r *userRoleRepository) Delete(userID uint, role string) error {
	return r.db.Where("user_id = ? AND role = ?", userID, role).Delete(&model.UserRole{}).Error
}

// DeleteAll removes all roles from a user
func (r *userRoleRepository) DeleteAll(userID uint) error {
	return r.db.Where("user_id = ?", userID).Delete(&model.UserRole{}).Error
}
