package model

import "time"

type ApplicationStatus string

const (
	AppApplied                ApplicationStatus = "applied"                  // 1
	AppScreening              ApplicationStatus = "screening"                // 2 (ganti review → selected)
	AppContacted              ApplicationStatus = "contacted"                // 3
	AppHRInterview            ApplicationStatus = "hr_interview"            // 4
	AppHiringManagerInterview ApplicationStatus = "hiring_manager_interview" // 5
	AppSalaryNegotiation      ApplicationStatus = "salary_negotiation"      // 6
	AppHired                  ApplicationStatus = "hired"                    // 7 (sukses)
	AppRejected               ApplicationStatus = "rejected"                 // 8
)

type Application struct {
	ID                uint              `gorm:"primaryKey" json:"id"`
	JobID             uint              `gorm:"not null;index" json:"job_id"`
	Job               Job               `gorm:"foreignKey:JobID" json:"job,omitempty"`
	CandidateID       uint              `gorm:"not null;index" json:"candidate_id"`
	Candidate         User              `gorm:"foreignKey:CandidateID" json:"candidate,omitempty"`
	CVFilename        string            `gorm:"type:varchar(255);not null" json:"-"`           // hanya nama file
	CVURL             string            `gorm:"type:varchar(600)" json:"cv_url"`               // presigned URL
	AIScore           int               `gorm:"default:0" json:"ai_score"`                     // 0-100
	Status            ApplicationStatus `gorm:"type:varchar(50);default:'applied'" json:"status"`
	AppliedAt         time.Time         `json:"applied_at"`

	// FIELD BARU
	VisibleInPipeline bool   `gorm:"default:true" json:"visible_in_pipeline,omitempty"` // untuk hide dari Kanban saat hired/rejected
	MeetingLink       string `gorm:"type:varchar(500)" json:"meeting_link,omitempty"`   // link Teams dari Microsoft Graph

	// MVP Form Fields
	TermsAccepted     bool       `gorm:"default:false" json:"terms_accepted"`
	WhatsappNumber    string     `gorm:"type:varchar(20)" json:"whatsapp_number"`
	DomicileCity      string     `gorm:"type:varchar(100)" json:"domicile_city"`
	DomicileProvince  string     `gorm:"type:varchar(100)" json:"domicile_province"`
	LastWorkRole      *string    `gorm:"type:varchar(100)" json:"last_work_role,omitempty"`
	LastWorkCompany   *string    `gorm:"type:varchar(100)" json:"last_work_company,omitempty"`
	LastWorkFrom      *time.Time `json:"last_work_from,omitempty"`
	LastWorkTo        *time.Time `json:"last_work_to,omitempty"`
	University        *string    `gorm:"type:varchar(200)" json:"university,omitempty"`

	MatchedSkills []string `json:"matched_skills" gorm:"type:jsonb;serializer:json"`
	MissingSkills []string `json:"missing_skills" gorm:"type:jsonb;serializer:json"`
	AIExplanation string   `json:"ai_explanation" gorm:"type:text"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}