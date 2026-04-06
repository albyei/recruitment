package application

import (
	"context"
	"errors"
	"fmt"
	"time"

	"wowrack-recruitment/internal/dto"
	"wowrack-recruitment/internal/model"

	"go.uber.org/zap"
)

func (s *applicationService) GetAllApplications(ctx context.Context, page, limit int) ([]dto.HRApplicationResponse, int64, error) {
	var apps []model.Application
	var total int64

	// Count total first
	if err := s.repo.GetDB().WithContext(ctx).
		Model(&model.Application{}).
		Where("visible_in_pipeline = ?", true).
		Count(&total).Error; err != nil {
		s.logger.Error("Failed to count all applications", zap.Error(err))
		return nil, 0, fmt.Errorf("count all applications: %w", err)
	}

	// Get paginated results
	offset := (page - 1) * limit
	if err := s.repo.GetDB().WithContext(ctx).
		Preload("Job").
		Preload("Candidate").
		Where("visible_in_pipeline = ?", true).
		Order("applied_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&apps).Error; err != nil {
		s.logger.Error("Failed to get all applications", zap.Error(err))
		return nil, 0, fmt.Errorf("find all applications: %w", err)
	}

	res := make([]dto.HRApplicationResponse, len(apps))
	for i, app := range apps {
		res[i] = dto.HRApplicationResponse{
			ID:             app.ID,
			JobID:          app.JobID,
			JobTitle:       app.Job.Title,
			CandidateID:    app.CandidateID,
			CandidateName:  app.Candidate.Name,
			CandidateEmail: app.Candidate.Email,
			CandidatePhone: app.Candidate.Phone,
			AIScore:        app.AIScore,
			Status:         string(app.Status),
			CVURL:          app.CVURL,
			AppliedAt:      app.AppliedAt.Format("02 Jan 2006 15:04"),
		}
	}
	return res, total, nil
}

func (s *applicationService) GetApplicationsByJob(ctx context.Context, jobID uint, page, limit int) ([]dto.HRApplicationResponse, int64, error) {
	var apps []model.Application
	var total int64

	// Count total first
	if err := s.repo.GetDB().WithContext(ctx).
		Model(&model.Application{}).
		Where("job_id = ?", jobID).
		Count(&total).Error; err != nil {
		s.logger.Error("Failed to count applications by job", zap.Error(err), zap.Uint("job_id", jobID))
		return nil, 0, fmt.Errorf("count applications by job: %w", err)
	}

	// Get paginated results
	offset := (page - 1) * limit
	if err := s.repo.GetDB().WithContext(ctx).
		Preload("Job").
		Preload("Candidate").
		Where("job_id = ?", jobID).
		Order("applied_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&apps).Error; err != nil {
		s.logger.Error("Failed to get applications by job", zap.Error(err), zap.Uint("job_id", jobID))
		return nil, 0, fmt.Errorf("find applications by job: %w", err)
	}

	res := make([]dto.HRApplicationResponse, len(apps))
	for i, app := range apps {
		res[i] = dto.HRApplicationResponse{
			ID:             app.ID,
			JobID:          app.JobID,
			JobTitle:       app.Job.Title,
			CandidateID:    app.CandidateID,
			CandidateName:  app.Candidate.Name,
			CandidateEmail: app.Candidate.Email,
			CandidatePhone: app.Candidate.Phone,
			AIScore:        app.AIScore,
			Status:         string(app.Status),
			CVURL:          app.CVURL,
			AppliedAt:      app.AppliedAt.Format("02 Jan 2006 15:04"),
		}
	}
	return res, total, nil
}

func (s *applicationService) GetApplicationByID(ctx context.Context, appID uint) (*dto.HRApplicationResponse, error) {
	var app model.Application

	if err := s.repo.GetDB().WithContext(ctx).
		Preload("Job").
		Preload("Candidate").
		Where("id = ?", appID).
		First(&app).Error; err != nil {
		s.logger.Error("Failed to get application by ID", zap.Error(err), zap.Uint("app_id", appID))
		return nil, fmt.Errorf("find application by ID: %w", err)
	}

	res := &dto.HRApplicationResponse{
		ID:             app.ID,
		JobID:          app.JobID,
		JobTitle:       app.Job.Title,
		CandidateID:    app.CandidateID,
		CandidateName:  app.Candidate.Name,
		CandidateEmail: app.Candidate.Email,
		CandidatePhone: app.Candidate.Phone,
		AIScore:        app.AIScore,
		Status:         string(app.Status),
		CVURL:          app.CVURL,
		AppliedAt:      app.AppliedAt.Format("02 Jan 2006 15:04"),
	}

	return res, nil
}

func (s *applicationService) UpdateApplicationStatus(ctx context.Context, appID uint, req dto.UpdateStatusRequest, notes string) error {
	var app model.Application
	if err := s.repo.GetDB().WithContext(ctx).Preload("Candidate").Preload("Job.CreatedBy").First(&app, appID).Error; err != nil {
		s.logger.Error("Failed to find application for status update", zap.Error(err), zap.Uint("app_id", appID))
		return fmt.Errorf("find application: %w", errors.New("lamaran tidak ditemukan"))
	}

	newStatus := model.ApplicationStatus(req.Status)
	oldStatus := app.Status
	app.Status = newStatus

	meetingLink := ""
	var interviewDate *time.Time
	if req.InterviewDate != nil {
		interviewDate = req.InterviewDate
	}

	if newStatus == model.AppHRInterview || newStatus == model.AppHiringManagerInterview {
		if req.InterviewDate == nil || req.DurationMinutes == nil || *req.DurationMinutes <= 0 {
			s.logger.Warn("Invalid interview params", zap.Uint("app_id", appID))
			return fmt.Errorf("invalid interview params: %w", errors.New("interview_date dan duration_minutes wajib diisi untuk tahap interview"))
		}

		if s.meetingSvc != nil {
			subject := fmt.Sprintf("Interview %s - %s", app.Candidate.Name, app.Job.Title)
			link, err := s.meetingSvc.CreateOnlineMeeting(*req.InterviewDate, *req.DurationMinutes, subject)
			if err != nil {
				s.logger.Error("Failed to create Teams meeting", zap.Error(err), zap.Uint("app_id", appID))
				// Lanjut tanpa link
			} else {
				meetingLink = link
				app.MeetingLink = link
			}
		}
	}

	if newStatus == model.AppHired || newStatus == model.AppRejected {
		app.VisibleInPipeline = false
	}

	if err := s.repo.GetDB().WithContext(ctx).Save(&app).Error; err != nil {
		s.logger.Error("Failed to save updated application status", zap.Error(err), zap.Uint("app_id", appID), zap.String("new_status", string(newStatus)))
		return fmt.Errorf("save application: %w", err)
	}

	go s.emailSvc.SendStatusUpdateEmail(&app, notes, meetingLink, interviewDate)

	if oldStatus == "" && newStatus == model.AppApplied {
		go s.emailSvc.SendNewApplicationHRNotification(&app)
	}

	return nil
}