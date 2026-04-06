package dto

import "time"

type CreateDepartmentRequest struct {
	Name string `json:"name" validate:"required,min=2,max=100"`
}

type UpdateDepartmentRequest struct {
	Name *string `json:"name" validate:"omitempty,min=2,max=100"`
}

type DepartmentResponse struct {
	ID        uint      `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}