package model

import (
	"time"

	"gorm.io/gorm"
)

type JobStatus string

const (
	StatusDraft           JobStatus = "draft"
	StatusPendingApproval JobStatus = "pending_approval"
	StatusApproved        JobStatus = "approved"
	StatusPublished       JobStatus = "published"
	StatusClosed          JobStatus = "closed"
	StatusCancelled       JobStatus = "cancelled"
	StatusRejected        JobStatus = "rejected"
)

type Priority string

const (
	PriorityLow    Priority = "low"
	PriorityMedium Priority = "medium"
	PriorityHigh   Priority = "high"
	PriorityUrgent Priority = "urgent"
)

type Job struct {
	ID              uint           `gorm:"primaryKey" json:"id"`
	Title           string         `gorm:"type:varchar(200);not null" json:"title"`
	Slug            string         `gorm:"type:varchar(250);uniqueIndex;not null" json:"slug"`

	DepartmentID    uint           `gorm:"not null" json:"department_id"`
	Department      Department     `gorm:"foreignKey:DepartmentID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"department"`

	Location        string         `gorm:"type:varchar(100)" json:"location,omitempty"`
	EmploymentType  string         `gorm:"type:varchar(30)" json:"employment_type,omitempty"` // full-time, internship, contract, dll

	SalaryRange     string         `gorm:"type:varchar(100)" json:"salary_range,omitempty"`

	Description     string         `gorm:"type:text;not null" json:"description"`
	Requirements    string         `gorm:"type:text" json:"requirements,omitempty"`
	Benefits        string         `gorm:"type:text" json:"benefits,omitempty"`

	QuantityNeeded  int            `gorm:"default:1" json:"quantity_needed"`
	Priority        Priority       `gorm:"type:varchar(20);default:'medium'" json:"priority"`

	Status          JobStatus      `gorm:"type:varchar(30);default:'draft'" json:"status"`

	OpenedAt        *time.Time     `json:"opened_at,omitempty"`
	ClosedAt        *time.Time     `json:"closed_at,omitempty"`

	CreatedByID     uint           `gorm:"not null" json:"created_by_id"`
	CreatedBy       User           `gorm:"foreignKey:CreatedByID" json:"created_by"`

	ApprovedByID    *uint          `json:"approved_by_id,omitempty"`
	ApprovedBy      *User          `gorm:"foreignKey:ApprovedByID" json:"approved_by,omitempty"`

	RejectReason   *string    `gorm:"type:text" json:"reject_reason,omitempty"`
	RejectedByID   *uint      `json:"rejected_by_id,omitempty"`
	RejectedBy     *User      `gorm:"foreignKey:RejectedByID" json:"rejected_by,omitempty"`
	RejectedAt     *time.Time `json:"rejected_at,omitempty"`

	FileURL         string         `gorm:"type:varchar(500)" json:"file_url,omitempty"` // presigned URL dari MinIO

	// MVP Form Fields
	DateNeeded      *time.Time    `json:"date_needed,omitempty"`
	SpecialNeeds    *string       `gorm:"type:text" json:"special_needs,omitempty"`
	IsArchived      bool          `gorm:"default:false" json:"is_archived"`

	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
	ApplicationCount uint `gorm:"default:0" json:"application_count"`
}