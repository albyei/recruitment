package service

import (
	"errors"

	"wowrack-recruitment/internal/dto"
	"wowrack-recruitment/internal/model"
	"wowrack-recruitment/internal/repository"

	"github.com/go-playground/validator/v10"
)

// INTERFACE HARUS SAMA DENGAN YANG DI HANDLER
type DepartmentService interface {
	Create(req dto.CreateDepartmentRequest) (*dto.DepartmentResponse, error)
	Update(id uint, req dto.UpdateDepartmentRequest) (*dto.DepartmentResponse, error)
	Delete(id uint) error
	GetByID(id uint) (*dto.DepartmentResponse, error)
	GetAll() ([]dto.DepartmentResponse, error)
}

type departmentService struct {
	repo repository.DepartmentRepository
}

func NewDepartmentService(repo repository.DepartmentRepository) DepartmentService {
	return &departmentService{repo: repo}
}

func (s *departmentService) Create(req dto.CreateDepartmentRequest) (*dto.DepartmentResponse, error) {
	if err := validator.New().Struct(req); err != nil {
		return nil, err
	}

	if s.repo.NameExists(req.Name, 0) {
		return nil, errors.New("nama department sudah digunakan")
	}

	dept := &model.Department{Name: req.Name}
	if err := s.repo.Create(dept); err != nil {
		return nil, err
	}

	return &dto.DepartmentResponse{
		ID:        dept.ID,
		Name:      dept.Name,
		CreatedAt: dept.CreatedAt,
		UpdatedAt: dept.UpdatedAt,
	}, nil
}

func (s *departmentService) Update(id uint, req dto.UpdateDepartmentRequest) (*dto.DepartmentResponse, error) {
	if err := validator.New().Struct(req); err != nil {
		return nil, err
	}

	dept, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("department tidak ditemukan")
	}

	if req.Name != nil {
		if s.repo.NameExists(*req.Name, id) {
			return nil, errors.New("nama department sudah digunakan")
		}
		dept.Name = *req.Name
	}

	if err := s.repo.Update(dept); err != nil {
		return nil, err
	}

	return &dto.DepartmentResponse{
		ID:        dept.ID,
		Name:      dept.Name,
		CreatedAt: dept.CreatedAt,
		UpdatedAt: dept.UpdatedAt,
	}, nil
}

func (s *departmentService) Delete(id uint) error {
	if _, err := s.repo.FindByID(id); err != nil {
		return errors.New("department tidak ditemukan")
	}
	return s.repo.Delete(id)
}

func (s *departmentService) GetByID(id uint) (*dto.DepartmentResponse, error) {
	dept, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("department tidak ditemukan")
	}
	return &dto.DepartmentResponse{
		ID:        dept.ID,
		Name:      dept.Name,
		CreatedAt: dept.CreatedAt,
		UpdatedAt: dept.UpdatedAt,
	}, nil
}

func (s *departmentService) GetAll() ([]dto.DepartmentResponse, error) {
	depts, err := s.repo.FindAll()
	if err != nil {
		return nil, err
	}
	result := make([]dto.DepartmentResponse, len(depts))
	for i, d := range depts {
		result[i] = dto.DepartmentResponse{
			ID:        d.ID,
			Name:      d.Name,
			CreatedAt: d.CreatedAt,
			UpdatedAt: d.UpdatedAt,
		}
	}
	return result, nil
}