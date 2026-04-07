package repository

import (
	"wowrack-recruitment/internal/model"

	"gorm.io/gorm"
)

type Repository interface {
	Create(user *model.User) (*model.User, error)
	FindByEmail(email string) (*model.User, error)
	Update(user *model.User) (*model.User, error)
	FindByID(id uint) (*model.User, error)
	FindAllWithPagination(page, limit int) ([]model.User, int64, error)
	Delete(user *model.User) error
	GetDB() *gorm.DB
	
}

type repository struct {
	db *gorm.DB
}


func NewRepository(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) FindByEmail(email string) (*model.User, error) {
	var user model.User
	err := r.db.Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *repository) Create(user *model.User) (*model.User, error) {
	return user, r.db.Create(user).Error
}

func (r *repository) FindByID(id uint) (*model.User, error) {
	var user model.User
	err := r.db.First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func(r *repository) Update(user *model.User) (*model.User, error) {
	err := r.db.Save(&user).Error
	return user, err
}

func (r *repository) Delete (user *model.User) error {
	return r.db.Delete(&user).Error
}

func (r *repository) FindAll() ([]model.User, error) {
	var users []model.User
	err := r.db.Find(&users).Error
	return users, err
}

func (r *repository) GetDB() *gorm.DB {
	return r.db
}

func (r *repository) FindAllWithPagination(page, limit int) ([]model.User, int64, error) {
	var users []model.User
	var total int64

	// Count total
	if err := r.db.Model(&model.User{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * limit
	if err := r.db.Order("created_at DESC").Offset(offset).Limit(limit).Find(&users).Error; err != nil {
		return nil, 0, err
	}
	return users, total, nil
}