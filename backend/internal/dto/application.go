package dto

import "time"

type ApplyJobRequest struct {
	Name     string `form:"name" validate:"required,min=2,max=100"`
	Email    string `form:"email" validate:"required,email"`
	Phone    string `form:"phone" validate:"required"`
	Address  string `form:"address,omitempty"`
	LinkedIn string `form:"linkedin,omitempty" validate:"omitempty,url"`

	// MVP Form Fields
	TermsAccepted    bool   `form:"terms_accepted" validate:"required,eq=true"`
	WhatsAppNumber   string `form:"whatsapp_number" validate:"required"`
	DomicileCity     string `form:"domicile_city" validate:"required"`
	DomicileProvince string `form:"domicile_province" validate:"required"`
	LastWorkRole     string `form:"last_work_role,omitempty"`
	LastWorkCompany  string `form:"last_work_company,omitempty"`
	LastWorkFrom     string `form:"last_work_from,omitempty"`
	LastWorkTo       string `form:"last_work_to,omitempty"`
	University       string `form:"university,omitempty"`
}

type ApplicationResponse struct {
	ID        uint   `json:"id"`
	JobTitle  string `json:"job_title"`
	AIScore   int    `json:"ai_score"`
	Status    string `json:"status"`
	CVURL     string `json:"cv_url"`
	AppliedAt string `json:"applied_at"`
	Message   string `json:"message,omitempty"`
	MatchedSkills []string `json:"matched_skills,omitempty"`
	MissingSkills []string `json:"missing_skills,omitempty"`
	Explanation   string   `json:"explanation,omitempty"`
}

type CandidateApplicationResponse struct {
	ID            uint     `json:"id"`
	JobID         uint     `json:"job_id,omitempty"`     // optional di list
	JobTitle      string   `json:"job_title"`
	Slug          string   `json:"slug,omitempty"`       // hanya di list
	Status        string   `json:"status"`
	AIScore       int      `json:"ai_score"`
	CVURL         string   `json:"cv_url"`
	AppliedAt     string   `json:"applied_at"`
	CanEdit       bool     `json:"can_edit"`
	CanWithdraw   bool     `json:"can_withdraw"`
	Message       string   `json:"message,omitempty"`     // baru
	MatchedSkills []string `json:"matched_skills,omitempty"` // baru
	MissingSkills []string `json:"missing_skills,omitempty"` // baru
	Explanation   string   `json:"explanation,omitempty"`    // baru

	// MVP Form Fields
	WhatsAppNumber   string  `json:"whatsapp_number"`
	DomicileCity     string  `json:"domicile_city"`
	DomicileProvince string  `json:"domicile_province"`
	LastWorkRole     *string `json:"last_work_role,omitempty"`
	LastWorkCompany  *string `json:"last_work_company,omitempty"`
	LastWorkFrom     string  `json:"last_work_from,omitempty"`
	LastWorkTo       string  `json:"last_work_to,omitempty"`
	University       *string `json:"university,omitempty"`
}

type EditApplicationRequest struct {
	Name     string `form:"name" validate:"required"`
	Phone    string `form:"phone" validate:"required"`
	Address  string `form:"address,omitempty"`
	LinkedIn string `form:"linkedin,omitempty"`
}

type HRApplicationResponse struct {
	ID           uint   `json:"id"`
	JobID        uint   `json:"job_id"`
	JobTitle     string `json:"job_title"`
	CandidateID  uint   `json:"candidate_id"`
	CandidateName string `json:"candidate_name"`
	CandidateEmail string `json:"candidate_email"`
	CandidatePhone string `json:"candidate_phone,omitempty"`
	AIScore      int    `json:"ai_score"`
	Status       string `json:"status"`
	CVURL        string `json:"cv_url"`
	AppliedAt    string `json:"applied_at"`
}

type UpdateStatusRequest struct {
	Status           string     `json:"status" validate:"required,oneof=screening contacted hr_interview hiring_manager_interview salary_negotiation hired rejected"`
	Notes            string     `json:"notes,omitempty"`
	InterviewDate    *time.Time `json:"interview_date,omitempty"`    // wajib jika status interview
	DurationMinutes  *int       `json:"duration_minutes,omitempty"`  // wajib jika status interview, misal 60
}

// ActiveVacancyDTO represents active vacancy for HR
type ActiveVacancyDTO struct {
	ID             uint   `json:"id"`
	Title          string `json:"title"`
	Department     string `json:"department"`
	Location       string `json:"location"`
	Status         string `json:"status"`
	ApplicantCount int    `json:"applicant_count"`
	CreatedAt      string `json:"created_at"`
}

