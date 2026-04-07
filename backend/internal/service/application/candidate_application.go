package application

import (
	"context"
	"errors"
	"fmt"
	"mime/multipart"
	"time"

	"wowrack-recruitment/internal/dto"
	"wowrack-recruitment/internal/model"
	"wowrack-recruitment/internal/pkg/storage"
	"wowrack-recruitment/internal/repository"
	"wowrack-recruitment/internal/util"

	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type applicationService struct {
	jobRepo    repository.JobRepository
	repo       repository.Repository
	userRepo   repository.Repository
	emailSvc   EmailService
	meetingSvc MeetingService
	storageSvc storage.StorageService
	aiSvc      AIScoringService
	logger     *zap.Logger
}

func NewApplicationService(logger *zap.Logger, jobRepo repository.JobRepository, repo repository.Repository) ApplicationService {
	emailSvc := NewEmailService(repo)
	meetingSvc, err := NewMeetingService()
	if err != nil {
		logger.Warn("Failed to initialize Microsoft Graph", zap.Error(err))
		meetingSvc = nil
	}

	storageSvc := storage.NewMinIOClient() // Dari pkg/storage
	aiSvc := NewAIScoringService()

	return &applicationService{
		jobRepo:    jobRepo,
		repo:       repo,
		userRepo:   repo,
		emailSvc:   emailSvc,
		meetingSvc: meetingSvc,
		storageSvc: storageSvc,
		aiSvc:      aiSvc,
		logger:     logger,
	}
}

func (s *applicationService) Apply(ctx context.Context, req dto.ApplyJobRequest, jobSlug string, cvFile *multipart.FileHeader) (*dto.ApplicationResponse, error) {
	if err := s.validateApplyRequest(req, cvFile); err != nil {
		s.logger.Error("Invalid apply request", zap.Error(err), zap.String("email", req.Email))
		return nil, fmt.Errorf("validation: %w", err)
	}

	job, err := s.jobRepo.FindBySlug(jobSlug)
	if err != nil {
		s.logger.Error("Failed to find job by slug", zap.Error(err), zap.String("slug", jobSlug))
		return nil, fmt.Errorf("find job: %w", errors.New("lowongan tidak ditemukan atau belum dipublish"))
	}
	if job.Status != model.StatusPublished || job.IsArchived {
		s.logger.Warn("Job not available for applications", zap.Uint("job_id", job.ID), zap.String("slug", jobSlug), zap.Bool("is_archived", job.IsArchived), zap.String("status", string(job.Status)))
		return nil, fmt.Errorf("job not available: %w", errors.New("lowongan tidak ditemukan, sudah ditutup, atau di-arsip"))
	}

	// Upload CV before transaction
	cvFilename, cvURL, err := s.uploadAndGetCVURL(ctx, cvFile)
	if err != nil {
		s.logger.Error("Failed to upload CV", zap.Error(err), zap.String("email", req.Email))
		return nil, fmt.Errorf("upload CV: %w", err)
	}

	var app *model.Application
	var isNewCandidate bool
	var newCandidatePassword string
	err = s.repo.GetDB().WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		candidate, isNew, password, err := s.getOrCreateCandidateTx(ctx, tx, req, job.ID)
		if err != nil {
			return fmt.Errorf("get/create candidate: %w", err)
		}
		isNewCandidate = isNew
		newCandidatePassword = password

		app = &model.Application{
			JobID:       job.ID,
			CandidateID: candidate.ID,
			CVFilename:  cvFilename,
			CVURL:       cvURL,
			AIScore:     0,
			Status:      model.AppApplied,
			AppliedAt:   time.Now(),

			// MVP Form Fields
			TermsAccepted:    req.TermsAccepted,
			WhatsappNumber:   req.WhatsAppNumber,
			DomicileCity:     req.DomicileCity,
			DomicileProvince: req.DomicileProvince,
		}

		// Parse and set optional MVP fields
		if req.LastWorkRole != "" {
			app.LastWorkRole = &req.LastWorkRole
		}
		if req.LastWorkCompany != "" {
			app.LastWorkCompany = &req.LastWorkCompany
		}
		if req.LastWorkFrom != "" {
			if parsed, err := time.Parse("2006-01-02", req.LastWorkFrom); err == nil {
				app.LastWorkFrom = &parsed
			}
		}
		if req.LastWorkTo != "" {
			if parsed, err := time.Parse("2006-01-02", req.LastWorkTo); err == nil {
				app.LastWorkTo = &parsed
			}
		}
		if req.University != "" {
			app.University = &req.University
		}

		// Create the application record
		if err := tx.Create(app).Error; err != nil {
			return fmt.Errorf("create application: %w", err)
		}

		// Atomic increment of ApplicationCount
		if err := tx.Model(&model.Job{}).Where("id = ?", job.ID).
			Update("application_count", gorm.Expr("application_count + 1")).Error; err != nil {
			return fmt.Errorf("increment application count: %w", err)
		}

		return nil
	})

	if err != nil {
		// Transaction failed - cleanup CV
		s.logger.Error("Transaction failed, cleaning up CV", zap.Error(err), zap.String("cv_filename", cvFilename))
		if delErr := s.storageSvc.DeleteCV(ctx, cvFilename); delErr != nil {
			s.logger.Error("Failed to cleanup CV after transaction rollback", zap.Error(delErr), zap.String("cv_filename", cvFilename))
		}
		return nil, fmt.Errorf("transaction failed: %w", err)
	}

	// AI Scoring - done asynchronously to avoid blocking the response and to keep transaction clean
	go func() {
		defer func() {
			if r := recover(); r != nil {
				s.logger.Error("Panic in AI scoring goroutine", zap.Any("panic", r), zap.Uint("app_id", app.ID))
			}
		}()

		// Get JD URL if needed
		jdURLForAI, err := s.getJDURL(ctx, job.FileURL)
		if err != nil {
			s.logger.Warn("Failed to get JD URL for async AI scoring", zap.Error(err), zap.Uint("app_id", app.ID))
			return
		}

		score, matchedSkills, missingSkills, explanation, err := s.scoreWithAI(ctx, cvURL, jdURLForAI)
		if err != nil {
			s.logger.Error("Failed to score with AI asynchronously", zap.Error(err), zap.Uint("app_id", app.ID))
			return
		}

		// Update application with AI score
		var appToUpdate model.Application
		if fetchErr := s.repo.GetDB().WithContext(ctx).First(&appToUpdate, app.ID).Error; fetchErr != nil {
			s.logger.Error("Failed to fetch application for AI update", zap.Error(fetchErr), zap.Uint("app_id", app.ID))
			return
		}
		appToUpdate.AIScore = score
		appToUpdate.MatchedSkills = matchedSkills
		appToUpdate.MissingSkills = missingSkills
		appToUpdate.AIExplanation = explanation
		if updateErr := s.repo.GetDB().WithContext(ctx).Save(&appToUpdate).Error; updateErr != nil {
			s.logger.Error("Failed to update AI details asynchronously", zap.Error(updateErr), zap.Uint("app_id", app.ID))
		}
	}()

	// Send HR notification asynchronously
	go func() {
		defer func() {
			if r := recover(); r != nil {
				s.logger.Error("Panic in HR notification goroutine", zap.Any("panic", r), zap.Uint("app_id", app.ID))
			}
		}()
		if err := s.emailSvc.SendNewApplicationHRNotification(app); err != nil {
			s.logger.Error("Failed to send HR notification", zap.Error(err), zap.Uint("app_id", app.ID))
		}
	}()

	// Send welcome email after transaction commit if candidate is new
	if isNewCandidate && newCandidatePassword != "" {
		go func() {
			defer func() {
				if r := recover(); r != nil {
					s.logger.Error("Panic in welcome email goroutine", zap.Any("panic", r), zap.String("email", req.Email))
				}
			}()
			body := fmt.Sprintf(`
				<h2>Selamat! Lamaran Anda ke Wowrack Diterima</h2>
				<p>Halo <strong>%s</strong>,</p>
				<p>Terima kasih telah melamar posisi <strong>%s</strong>.</p>
				<p>Akun Anda telah dibuat otomatis:</p>
				<ul>
					<li>Email: <strong>%s</strong></li>
					<li>Password: <strong>%s</strong></li>
				</ul>
				<p>Login di: https://recruitment.wowrack.com/login</p>
				<p>— Tim Talent Acquisition<br>Albyei Corp</p>
			`, req.Name, job.Title, req.Email, newCandidatePassword)
			if err := util.SendEmail(req.Email, "Lamaran Diterima - Wowrack", body); err != nil {
				s.logger.Error("Failed to send welcome email", zap.Error(err), zap.String("email", req.Email))
			}
		}()
	}

	// Response uses default values - AI score will be updated asynchronously
	return &dto.ApplicationResponse{
		ID:            app.ID,
		JobTitle:      job.Title,
		AIScore:       0, // Will be updated by async AI scoring
		Status:        "applied",
		CVURL:         cvURL,
		AppliedAt:     app.AppliedAt.Format("02 Jan 2006 15:04"),
		MatchedSkills: []string{},                   // Will be updated by async AI scoring
		MissingSkills: []string{},                   // Will be updated by async AI scoring
		Explanation:   "Skor AI sedang dihitung...", // Will be updated by async AI scoring
		Message:       "Lamaran berhasil! Skor kecocokan AI sedang dihitung dan akan segera muncul.",
	}, nil
}

func (s *applicationService) validateApplyRequest(req dto.ApplyJobRequest, cvFile *multipart.FileHeader) error {
	if req.Name == "" || req.Email == "" || req.Phone == "" {
		return errors.New("nama, email, dan phone wajib diisi")
	}
	if cvFile == nil {
		return errors.New("CV wajib diupload")
	}

	// Validate MVP fields
	if !req.TermsAccepted {
		return errors.New("terms must be accepted")
	}
	if req.WhatsAppNumber == "" {
		return errors.New("whatsapp_number wajib diisi")
	}
	if !util.ValidateWhatsApp(req.WhatsAppNumber) {
		return errors.New("format whatsapp_number tidak valid (contoh: 081234567890)")
	}
	if req.DomicileCity == "" {
		return errors.New("domicile_city wajib diisi")
	}
	if req.DomicileProvince == "" {
		return errors.New("domicile_province wajib diisi")
	}

	// Validate CV file using file validation utility
	if err := util.ValidateFile(cvFile, util.FileTypeCV); err != nil {
		return fmt.Errorf("CV file validation failed: %w", err)
	}

	return nil
}

func (s *applicationService) getOrCreateCandidateTx(ctx context.Context, tx *gorm.DB, req dto.ApplyJobRequest, jobID uint) (*model.User, bool, string, error) {
	var existingUser model.User
	if err := tx.WithContext(ctx).Where("email = ?", req.Email).First(&existingUser).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Create new candidate
			password := util.GenerateRandomPassword()
			hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
			if err != nil {
				return nil, false, "", fmt.Errorf("hash password: %w", err)
			}

			candidate := &model.User{
				Name:     req.Name,
				Email:    req.Email,
				Password: string(hashed),
				Phone:    req.Phone,
				Address:  req.Address,
				LinkedIn: req.LinkedIn,
				Role:     "candidate",
			}
			if err := tx.Create(candidate).Error; err != nil {
				return nil, false, "", fmt.Errorf("create candidate: %w", err)
			}

			// Email akan dikirim setelah transaction commit (di Apply function)
			return candidate, true, password, nil
		}
		return nil, false, "", fmt.Errorf("find by email: %w", err)
	}

	// Check if already applied
	var count int64
	if err := tx.WithContext(ctx).Model(&model.Application{}).Where("job_id = ? AND candidate_id = ?", jobID, existingUser.ID).Count(&count).Error; err != nil {
		return nil, false, "", fmt.Errorf("check existing application: %w", err)
	}
	if count > 0 {
		return nil, false, "", fmt.Errorf("duplicate application: %w", errors.New("anda sudah melamar lowongan ini"))
	}

	return &existingUser, false, "", nil
}

func (s *applicationService) uploadAndGetCVURL(ctx context.Context, cvFile *multipart.FileHeader) (string, string, error) {
	filename, cvURL, err := s.storageSvc.UploadCV(ctx, cvFile)
	if err != nil {
		return "", "", fmt.Errorf("storage upload: %w", err)
	}
	return filename, cvURL, nil
}

func (s *applicationService) getJDURL(ctx context.Context, jobFileURL string) (string, error) {
	if jobFileURL == "" {
		return "", nil
	}
	url, err := s.storageSvc.GetPresignedJDURL(ctx, jobFileURL)
	if err != nil {
		return "", fmt.Errorf("get presigned JD URL: %w", err)
	}
	return url, nil
}

func (s *applicationService) scoreWithAI(ctx context.Context, cvURL, jdURL string) (int, []string, []string, string, error) {
	if jdURL == "" {
		return 0, nil, nil, "", nil
	}
	return s.aiSvc.ScoreCV(cvURL, jdURL) // Context bisa dipass jika AI svc support
}

func (s *applicationService) GetApplicationsByCandidate(ctx context.Context, candidateID uint) ([]dto.CandidateApplicationResponse, error) {
	var apps []model.Application
	if err := s.repo.GetDB().WithContext(ctx).Preload("Job").Where("candidate_id = ?", candidateID).Find(&apps).Error; err != nil {
		s.logger.Error("Failed to get applications by candidate", zap.Error(err), zap.Uint("candidate_id", candidateID))
		return nil, fmt.Errorf("find applications: %w", err)
	}

	res := make([]dto.CandidateApplicationResponse, len(apps))
	for i, app := range apps {
		canEdit := app.Status == model.AppApplied || app.Status == model.AppScreening
		canWithdraw := app.Status != model.AppHired && app.Status != model.AppRejected

		res[i] = dto.CandidateApplicationResponse{
			ID:            app.ID,
			JobID:         app.JobID,
			JobTitle:      app.Job.Title,
			Slug:          app.Job.Slug,
			Status:        string(app.Status),
			AIScore:       app.AIScore,
			CVURL:         app.CVURL,
			AppliedAt:     app.AppliedAt.Format("02 Jan 2006"),
			CanEdit:       canEdit,
			CanWithdraw:   canWithdraw,
			MatchedSkills: app.MatchedSkills,
			MissingSkills: app.MissingSkills,
			Explanation:   app.AIExplanation,
		}
	}
	return res, nil
}

func (s *applicationService) WithdrawApplication(ctx context.Context, appID, candidateID uint) error {
	return s.repo.GetDB().WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var app model.Application
		if err := tx.First(&app, "id = ? AND candidate_id = ?", appID, candidateID).Error; err != nil {
			s.logger.Error("Failed to find application for withdraw", zap.Error(err), zap.Uint("app_id", appID), zap.Uint("candidate_id", candidateID))
			return fmt.Errorf("find application: %w", errors.New("lamaran tidak ditemukan atau bukan milik Anda"))
		}

		if app.Status == model.AppHired || app.Status == model.AppRejected {
			s.logger.Warn("Cannot withdraw hired/rejected application", zap.Uint("app_id", appID), zap.String("status", string(app.Status)))
			return fmt.Errorf("invalid status: %w", errors.New("lamaran yang sudah hired/rejected tidak bisa ditarik"))
		}

		if err := tx.Unscoped().Delete(&app).Error; err != nil {
			s.logger.Error("Failed to delete application", zap.Error(err), zap.Uint("app_id", appID))
			return fmt.Errorf("delete application: %w", err)
		}

		// Atomic decrement of ApplicationCount
		if err := tx.Model(&model.Job{}).Where("id = ?", app.JobID).
			Update("application_count", gorm.Expr("CASE WHEN application_count > 0 THEN application_count - 1 ELSE 0 END")).Error; err != nil {
			return fmt.Errorf("decrement application count: %w", err)
		}

		// Delete CV outside transaction after successful DB commit
		if app.CVFilename != "" {
			if err := s.storageSvc.DeleteCV(ctx, app.CVFilename); err != nil {
				s.logger.Error("Failed to delete CV during withdraw", zap.Error(err), zap.String("filename", app.CVFilename))
				// Non-fatal, transaction already committed
			}
		}

		return nil
	})
}

func (s *applicationService) EditApplication(ctx context.Context, appID, candidateID uint, req dto.EditApplicationRequest, cvFile *multipart.FileHeader) (*dto.CandidateApplicationResponse, error) {
	var app model.Application
	if err := s.repo.GetDB().WithContext(ctx).Preload("Job").First(&app, "id = ? AND candidate_id = ?", appID, candidateID).Error; err != nil {
		s.logger.Error("Failed to find application for edit", zap.Error(err), zap.Uint("app_id", appID), zap.Uint("candidate_id", candidateID))
		return nil, fmt.Errorf("find application: %w", errors.New("lamaran tidak ditemukan atau bukan milik Anda"))
	}

	if app.Status != model.AppApplied && app.Status != model.AppScreening {
		s.logger.Warn("Cannot edit application in current status", zap.Uint("app_id", appID), zap.String("status", string(app.Status)))
		return nil, fmt.Errorf("invalid status: %w", errors.New("lamaran hanya bisa diedit saat status applied atau screening"))
	}

	if err := s.updateCandidate(ctx, candidateID, req); err != nil {
		s.logger.Error("Failed to update candidate details", zap.Error(err), zap.Uint("candidate_id", candidateID))
		return nil, fmt.Errorf("update candidate: %w", err)
	}

	cvChanged := cvFile != nil
	if cvChanged {
		// Validate CV file using file validation utility
		if err := util.ValidateFile(cvFile, util.FileTypeCV); err != nil {
			return nil, fmt.Errorf("CV file validation failed: %w", err)
		}

		if app.CVFilename != "" {
			if err := s.storageSvc.DeleteCV(ctx, app.CVFilename); err != nil {
				s.logger.Error("Failed to delete old CV", zap.Error(err), zap.String("filename", app.CVFilename))
				// Non-fatal
			}
		}

		cvFilename, cvURL, err := s.uploadAndGetCVURL(ctx, cvFile)
		if err != nil {
			s.logger.Error("Failed to upload new CV", zap.Error(err), zap.Uint("app_id", appID))
			return nil, fmt.Errorf("upload CV: %w", err)
		}
		app.CVFilename = cvFilename
		app.CVURL = cvURL

		jdURL, err := s.getJDURL(ctx, app.Job.FileURL)
		if err != nil {
			s.logger.Warn("Failed to generate JD URL for edit", zap.Error(err), zap.Uint("job_id", app.JobID))
		}

		score, matched, missing, expl, err := s.scoreWithAI(ctx, cvURL, jdURL)
		if err != nil {
			s.logger.Error("Failed to re-score AI during edit", zap.Error(err), zap.Uint("app_id", appID))
			// Lanjut dengan skor lama
		} else {
			app.AIScore = score
			app.MatchedSkills = matched
			app.MissingSkills = missing
			app.AIExplanation = expl
		}
	}

	if err := s.repo.GetDB().WithContext(ctx).Save(&app).Error; err != nil {
		s.logger.Error("Failed to save edited application", zap.Error(err), zap.Uint("app_id", appID))
		return nil, fmt.Errorf("save application: %w", err)
	}

	return &dto.CandidateApplicationResponse{
		ID:            app.ID,
		JobID:         app.JobID,
		JobTitle:      app.Job.Title,
		Slug:          app.Job.Slug,
		Status:        string(app.Status),
		AIScore:       app.AIScore,
		CVURL:         app.CVURL,
		AppliedAt:     app.AppliedAt.Format("02 Jan 2006"),
		CanEdit:       true,
		CanWithdraw:   true,
		MatchedSkills: app.MatchedSkills,
		MissingSkills: app.MissingSkills,
		Explanation:   app.AIExplanation,
		Message:       fmt.Sprintf("Lamaran berhasil diupdate! Skor kecocokan AI baru: %d%%", app.AIScore),
	}, nil
}

func (s *applicationService) updateCandidate(ctx context.Context, candidateID uint, req dto.EditApplicationRequest) error {
	var user model.User
	if err := s.repo.GetDB().WithContext(ctx).First(&user, candidateID).Error; err != nil {
		return fmt.Errorf("find user: %w", errors.New("user tidak ditemukan"))
	}

	updateMap := make(map[string]interface{})
	if req.Name != "" {
		updateMap["Name"] = req.Name
	}
	if req.Phone != "" {
		updateMap["Phone"] = req.Phone
	}
	if req.Address != "" {
		updateMap["Address"] = req.Address
	}
	if req.LinkedIn != "" {
		updateMap["LinkedIn"] = req.LinkedIn
	}

	if len(updateMap) > 0 {
		if err := s.repo.GetDB().WithContext(ctx).Model(&user).Updates(updateMap).Error; err != nil {
			return fmt.Errorf("update user: %w", err)
		}
	}
	return nil
}
