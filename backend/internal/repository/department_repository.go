package repository

import (
	"wowrack-recruitment/internal/config"
	"wowrack-recruitment/internal/model"
)

type DepartmentRepository interface {
	Create(dept *model.Department) error
	Update(dept *model.Department) error
	Delete(id uint) error
	FindByID(id uint) (*model.Department, error)
	FindAll() ([]model.Department, error)
	NameExists(name string, excludeID uint) bool
}

type departmentRepository struct{}

func NewDepartmentRepository() DepartmentRepository {
	return &departmentRepository{}
}

func (r *departmentRepository) Create(dept *model.Department) error {
	return config.DB.Create(dept).Error
}

func (r *departmentRepository) Update(dept *model.Department) error {
	return config.DB.Save(dept).Error
}

func (r *departmentRepository) Delete(id uint) error {
	return config.DB.Delete(&model.Department{}, id).Error
}

func (r *departmentRepository) FindByID(id uint) (*model.Department, error) {
	var dept model.Department
	err := config.DB.First(&dept, id).Error
	if err != nil {
		return nil, err
	}
	return &dept, nil
}

func (r *departmentRepository) FindAll() ([]model.Department, error) {
	var depts []model.Department
	err := config.DB.Find(&depts).Error
	return depts, err
}

// true = sudah ada
func (r *departmentRepository) NameExists(name string, excludeID uint) bool {
	var count int64
	query := config.DB.Model(&model.Department{}).Where("name = ?", name)
	if excludeID > 0 {
		query = query.Where("id != ?", excludeID)
	}
	query.Count(&count)
	return count > 0
}