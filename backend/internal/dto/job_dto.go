package dto

import (
	"time"
)

type UserResponse struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
	Role string `json:"role"`
}


type CreateJobRequest struct {
	Title          string  `json:"title" form:"title" validate:"required,min=10,max=200"`
	Description    string  `json:"description" form:"description" validate:"required,min=50"`
	Requirements   string  `json:"requirements,omitempty" form:"requirements"`
	Benefits       string  `json:"benefits,omitempty" form:"benefits"`
	Location       string  `json:"location,omitempty" form:"location"`
	EmploymentType string  `json:"employment_type,omitempty" form:"employment_type" validate:"omitempty,oneof=full-time internship contract freelance"`
	SalaryRange    string  `json:"salary_range,omitempty" form:"salary_range"`
	DepartmentID   uint    `json:"department_id" form:"department_id" validate:"required"`
	QuantityNeeded int     `json:"quantity_needed,omitempty" form:"quantity_needed" validate:"omitempty,min=1"`
	Priority       string  `json:"priority,omitempty" form:"priority" validate:"omitempty,oneof=low medium high urgent"`
}

type UpdateJobRequest struct {
	Title          *string `json:"title,omitempty" form:"title" validate:"omitempty,min=10,max=200"`
	Description    *string `json:"description,omitempty" form:"description" validate:"omitempty,min=50"`
	Requirements   *string `json:"requirements,omitempty" form:"requirements"`
	Benefits       *string `json:"benefits,omitempty" form:"benefits"`
	Location       *string `json:"location,omitempty" form:"location"`
	EmploymentType *string `json:"employment_type,omitempty" form:"employment_type" validate:"omitempty,oneof=full-time internship contract freelance"`
	SalaryRange    *string `json:"salary_range,omitempty" form:"salary_range"`
	DepartmentID   *uint   `json:"department_id,omitempty" form:"department_id"`
	QuantityNeeded *int    `json:"quantity_needed,omitempty" form:"quantity_needed" validate:"omitempty,min=1"`
	Priority       *string `json:"priority,omitempty" form:"priority" validate:"omitempty,oneof=low medium high urgent"`
}

type JobResponse struct {
	ID             uint       `json:"id"`
	Title          string     `json:"title"`
	Slug           string     `json:"slug"`
	Description    string     `json:"description"`
	Requirements   string     `json:"requirements,omitempty"`
	Benefits       string     `json:"benefits,omitempty"`
	Location       string     `json:"location,omitempty"`
	EmploymentType string     `json:"employment_type,omitempty"`
	SalaryRange    string     `json:"salary_range,omitempty"`
	Department     DepartmentResponse `json:"department"`
	QuantityNeeded int        `json:"quantity_needed"`
	Priority       string     `json:"priority"`
	Status         string     `json:"status"`
	OpenedAt       *time.Time `json:"opened_at,omitempty"`
	ClosedAt       *time.Time `json:"closed_at,omitempty"`
	CreatedBy      UserResponse `json:"created_by"`
	ApprovedBy     *UserResponse `json:"approved_by,omitempty"`
	RejectReason   *string    `json:"reject_reason,omitempty"`
	RejectedAt     *time.Time `json:"rejected_at,omitempty"`
	RejectedBy     *UserResponse `json:"rejected_by,omitempty"`
	FileURL        string     `json:"file_url,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
}

type JobListResponse struct {
	ID             uint   `json:"id"`
	Title          string `json:"title"`
	Slug           string `json:"slug"`
	Location       string `json:"location,omitempty"`
	EmploymentType string `json:"employment_type,omitempty"`
	SalaryRange    string `json:"salary_range,omitempty"`
	Department     string `json:"department"`
	Priority       string `json:"priority"`
	QuantityNeeded int    `json:"quantity_needed"`
	PublishedAt    *time.Time `json:"published_at,omitempty"`
}

type RejectJobRequest struct {
	Reason string `json:"reason" validate:"required,min=10,max=1000"`
}