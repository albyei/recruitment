package repository

import (
	"wowrack-recruitment/internal/config"
	"wowrack-recruitment/internal/model"
)

type JobRepository interface {
	Create(job *model.Job) error
	Update(job *model.Job) error
	FindByID(id uint) (*model.Job, error)
	FindBySlug(slug string) (*model.Job, error)
	GetAllPublished(filters map[string]string) ([]model.Job, error)
	GetAllPublishedWithPagination(filters map[string]string, page, limit int) ([]model.Job, int64, error)
	GetAllForHR() ([]model.Job, error)
	GetAllForHRWithPagination(page, limit int) ([]model.Job, int64, error)
	GetAllForManager() ([]model.Job, error)
	GetAllForManagerWithPagination(page, limit int) ([]model.Job, int64, error)
	Delete(id uint) error
}

type jobRepository struct{}

func NewJobRepository() JobRepository {
	return &jobRepository{}
}

func (r *jobRepository) Create(job *model.Job) error {
	return config.DB.Create(job).Error
}

func (r *jobRepository) Update(job *model.Job) error {
	return config.DB.Save(job).Error
}

func (r *jobRepository) FindByID(id uint) (*model.Job, error) {
	var job model.Job
	err := config.DB.Preload("Department").Preload("CreatedBy").Preload("ApprovedBy").First(&job, id).Error
	return &job, err
}

func (r *jobRepository) FindBySlug(slug string) (*model.Job, error) {
	var job model.Job
	err := config.DB.Preload("Department").Preload("CreatedBy").Preload("ApprovedBy").
		Where("slug = ? AND status = ?", slug, model.StatusPublished).First(&job).Error
	return &job, err
}

func (r *jobRepository) GetAllPublished(filters map[string]string) ([]model.Job, error) {
	var jobs []model.Job
	query := config.DB.Preload("Department").
		Where("status = ?", model.StatusPublished).
		Order("opened_at DESC")

	if v := filters["department"]; v != "" {
		query = query.Joins("JOIN departments d ON d.id = jobs.department_id").
			Where("d.name ILIKE ?", "%"+v+"%")
	}
	if v := filters["location"]; v != "" {
		query = query.Where("location ILIKE ?", "%"+v+"%")
	}
	if v := filters["type"]; v != "" {
		query = query.Where("employment_type = ?", v)
	}
	if v := filters["priority"]; v != "" {
		query = query.Where("priority = ?", v)
	}

	err := query.Find(&jobs).Error
	return jobs, err
}

func (r *jobRepository) GetAllForHR() ([]model.Job, error) {
	var jobs []model.Job
	err := config.DB.Preload("Department").Preload("CreatedBy").Preload("ApprovedBy").
		Order("created_at DESC").Find(&jobs).Error
	return jobs, err
}
func (r *jobRepository) GetAllForManager() ([]model.Job, error) {
	var jobs []model.Job
	err := config.DB.Preload("Department").Preload("CreatedBy").Preload("ApprovedBy").
		Order("created_at DESC").Find(&jobs).Error
	return jobs, err
}

func (r *jobRepository) Delete(id uint) error {
	return config.DB.Delete(&model.Job{}, id).Error
}

func (r *jobRepository) GetAllPublishedWithPagination(filters map[string]string, page, limit int) ([]model.Job, int64, error) {
	var jobs []model.Job
	var total int64

	query := config.DB.Preload("Department").
		Where("status = ?", model.StatusPublished).
		Order("opened_at DESC")

	if v := filters["department"]; v != "" {
		query = query.Joins("JOIN departments d ON d.id = jobs.department_id").
			Where("d.name ILIKE ?", "%"+v+"%")
	}
	if v := filters["location"]; v != "" {
		query = query.Where("location ILIKE ?", "%"+v+"%")
	}
	if v := filters["type"]; v != "" {
		query = query.Where("employment_type = ?", v)
	}
	if v := filters["priority"]; v != "" {
		query = query.Where("priority = ?", v)
	}

	// Count total
	if err := query.Model(&model.Job{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * limit
	if err := query.Offset(offset).Limit(limit).Find(&jobs).Error; err != nil {
		return nil, 0, err
	}
	return jobs, total, nil
}

func (r *jobRepository) GetAllForHRWithPagination(page, limit int) ([]model.Job, int64, error) {
	var jobs []model.Job
	var total int64

	query := config.DB.Preload("Department").Preload("CreatedBy").Preload("ApprovedBy").
		Order("created_at DESC")

	// Count total
	if err := query.Model(&model.Job{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * limit
	if err := query.Offset(offset).Limit(limit).Find(&jobs).Error; err != nil {
		return nil, 0, err
	}
	return jobs, total, nil
}

func (r *jobRepository) GetAllForManagerWithPagination(page, limit int) ([]model.Job, int64, error) {
	var jobs []model.Job
	var total int64

	query := config.DB.Preload("Department").Preload("CreatedBy").Preload("ApprovedBy").
		Order("created_at DESC")

	// Count total
	if err := query.Model(&model.Job{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * limit
	if err := query.Offset(offset).Limit(limit).Find(&jobs).Error; err != nil {
		return nil, 0, err
	}
	return jobs, total, nil
}