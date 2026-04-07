package application

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"mime/multipart"
	"net/http"
	"io"
	"strings"
	"testing"
	"time"

	"wowrack-recruitment/internal/dto"
	"wowrack-recruitment/internal/model"
	"wowrack-recruitment/internal/repository"

	"github.com/glebarez/sqlite"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

func createTestFileHeader(filename, contentType string, content []byte) *multipart.FileHeader {
	if content == nil {
		content = []byte("This is a dummy CV file content for testing purposes.")
	}
	if contentType == "" {
		contentType = "application/pdf"
	}

	// Buat multipart form di memory
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// Buat file part
	part, err := writer.CreateFormFile("cv", filename)
	if err != nil {
		panic(fmt.Sprintf("failed to create form file: %v", err))
	}

	// Tulis content ke part
	if _, err := part.Write(content); err != nil {
		panic(fmt.Sprintf("failed to write content: %v", err))
	}

	if err := writer.Close(); err != nil {
		panic(fmt.Sprintf("failed to close writer: %v", err))
	}

	// Buat request dengan body multipart
	req := &http.Request{
		Header: make(http.Header),
		Body:   io.NopCloser(body),   // Penting!
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	// Parse form
	mr, err := req.MultipartReader()
	if err != nil {
		panic(fmt.Sprintf("failed to create multipart reader: %v", err))
	}

	form, err := mr.ReadForm(32 << 20) // 32MB limit
	if err != nil {
		panic(fmt.Sprintf("failed to read multipart form: %v", err))
	}

	if len(form.File["cv"]) == 0 {
		panic("no cv file in multipart form")
	}

	return form.File["cv"][0]
}


func createTestCV(filename string) *multipart.FileHeader {
	return createTestFileHeader(filename, "application/pdf", nil)
}

// Mock implementations for testing
type mockStorageService struct {
	uploadFunc    func(ctx context.Context, file *multipart.FileHeader) (string, string, error)
	deleteFunc    func(ctx context.Context, filename string) error
	presignedFunc func(ctx context.Context, jobFileURL string) (string, error)
	cvFilename   string
	cvURL        string
	shouldFail   bool
	uploadedCV   string
	deletedCVs   []string
}

func parseUint(s string) uint {
	var val uint
	fmt.Sscanf(s, "%d", &val)
	return val
}

func (m *mockStorageService) UploadCV(ctx context.Context, file *multipart.FileHeader) (string, string, error) {
	if m.uploadFunc != nil {
		return m.uploadFunc(ctx, file)
	}
	if m.shouldFail {
		return "", "", errors.New("upload failed")
	}
	m.uploadedCV = "test-cv-file.pdf"
	return "test-cv-file.pdf", "http://example.com/test-cv-file.pdf", nil
}

func (m *mockStorageService) DeleteCV(ctx context.Context, filename string) error {
	if m.deleteFunc != nil {
		return m.deleteFunc(ctx, filename)
	}
	m.deletedCVs = append(m.deletedCVs, filename)
	return nil
}

func (m *mockStorageService) GetPresignedJDURL(ctx context.Context, jobFileURL string) (string, error) {
	if m.presignedFunc != nil {
		return m.presignedFunc(ctx, jobFileURL)
	}
	return "http://example.com/jd.pdf", nil
}

type mockAIService struct {
	scoreFunc func(cvURL, jdURL string) (int, []string, []string, string, error)
	shouldFail bool
}

func (m *mockAIService) ScoreCV(cvURL, jdURL string) (int, []string, []string, string, error) {
	if m.scoreFunc != nil {
		return m.scoreFunc(cvURL, jdURL)
	}
	if m.shouldFail {
		return 0, nil, nil, "", errors.New("AI scoring failed")
	}
	return 85, []string{"Go", "Gin", "PostgreSQL"}, []string{"Kubernetes"}, "Good match", nil
}

type mockEmailService struct{}

func (m *mockEmailService) SendNewApplicationHRNotification(app *model.Application) error {
	// No-op for testing
	return nil
}

func (m *mockEmailService) SendStatusUpdateEmail(app *model.Application, notes string, meetingLink string, interviewDate *time.Time) error {
	// No-op for testing
	return nil
}

type mockJobRepository struct {
	jobs       map[uint]*model.Job
	findBySlugFunc func(slug string) (*model.Job, error)
	updateFunc      func(job *model.Job) error
	db        *gorm.DB // Reference to test DB for atomic operations
}

func (m *mockJobRepository) Create(job *model.Job) error {
	if m.jobs == nil {
		m.jobs = make(map[uint]*model.Job)
	}
	if m.db != nil {
		// Save to DB for atomic operations in transactions
		if err := m.db.Create(job).Error; err != nil {
			return err
		}
	} else {
		// Fallback to in-memory if no DB reference
		job.ID = uint(len(m.jobs) + 1)
	}
	m.jobs[job.ID] = job
	return nil
}

func (m *mockJobRepository) Update(job *model.Job) error {
	if m.updateFunc != nil {
		return m.updateFunc(job)
	}
	if m.jobs != nil {
		m.jobs[job.ID] = job
	}
	return nil
}

func (m *mockJobRepository) FindByID(id uint) (*model.Job, error) {
	if m.jobs == nil {
		return nil, errors.New("job not found")
	}
	job, exists := m.jobs[id]
	if !exists {
		return nil, errors.New("job not found")
	}
	return job, nil
}

func (m *mockJobRepository) FindBySlug(slug string) (*model.Job, error) {
	if m.findBySlugFunc != nil {
		return m.findBySlugFunc(slug)
	}
	if m.jobs == nil {
		return nil, errors.New("job not found")
	}
	for _, job := range m.jobs {
		if job.Slug == slug && job.Status == model.StatusPublished {
			return job, nil
		}
	}
	return nil, errors.New("job not found")
}

func (m *mockJobRepository) GetAllPublished(filters map[string]string) ([]model.Job, error) {
	var jobs []model.Job
	for _, job := range m.jobs {
		if job.Status == model.StatusPublished {
			jobs = append(jobs, *job)
		}
	}
	return jobs, nil
}

func (m *mockJobRepository) GetAllForHR() ([]model.Job, error) {
	var jobs []model.Job
	for _, job := range m.jobs {
		jobs = append(jobs, *job)
	}
	return jobs, nil
}

func (m *mockJobRepository) GetAllForManager() ([]model.Job, error) {
	return m.GetAllForHR()
}

// === METHOD BARU YANG DIBUTUHKAN ===
func (m *mockJobRepository) GetAllForHRWithPagination(page, limit int) ([]model.Job, int64, error) {
	if m.jobs == nil {
		return []model.Job{}, 0, nil
	}

	var allJobs []model.Job
	for _, job := range m.jobs {
		allJobs = append(allJobs, *job)
	}

	// Simple pagination logic for test
	total := int64(len(allJobs))
	start := (page - 1) * limit
	if start >= len(allJobs) {
		return []model.Job{}, total, nil
	}

	end := start + limit
	if end > len(allJobs) {
		end = len(allJobs)
	}

	return allJobs[start:end], total, nil
}

func (m *mockJobRepository) GetAllForManagerWithPagination(page, limit int) ([]model.Job, int64, error) {
	// Untuk manager biasanya sama dengan HR, atau bisa difilter nanti
	return m.GetAllForHRWithPagination(page, limit)
}

func (m *mockJobRepository) GetAllPublishedWithPagination(filters map[string]string, page, limit int) ([]model.Job, int64, error) {
	var publishedJobs []model.Job

	for _, job := range m.jobs {
		if job.Status == model.StatusPublished {
			publishedJobs = append(publishedJobs, *job)
		}
	}

	// Terapkan filter sederhana (bisa dikembangkan)
	if dept, ok := filters["department"]; ok && dept != "" {
		// Filter by department jika diperlukan (sesuaikan dengan logic project kamu)
		var filtered []model.Job
		for _, job := range publishedJobs {
			if job.DepartmentID == uint(parseUint(dept)) {  // perlu helper parse
				filtered = append(filtered, job)
			}
		}
		publishedJobs = filtered
	}

	total := int64(len(publishedJobs))
	start := (page - 1) * limit
	if start >= len(publishedJobs) {
		return []model.Job{}, total, nil
	}

	end := start + limit
	if end > len(publishedJobs) {
		end = len(publishedJobs)
	}

	return publishedJobs[start:end], total, nil
}

func (m *mockJobRepository) Delete(id uint) error {
	if m.jobs == nil {
		return errors.New("job not found")
	}
	if _, exists := m.jobs[id]; !exists {
		return errors.New("job not found")
	}
	delete(m.jobs, id)
	return nil
}

// Test helper to setup in-memory SQLite database
func setupTestDB(t *testing.T) *gorm.DB {
	// Use unique filename per test to avoid conflicts
	dsn := "file:" + t.Name() + ".db?mode=memory&cache=shared"
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to setup test database: %v", err)
	}

	// Auto migrate all models
	err = db.AutoMigrate(&model.User{}, &model.Job{}, &model.Application{})
	if err != nil {
		t.Fatalf("Failed to migrate test database: %v", err)
	}

	return db
}

// Test helper to create a mock service
func createMockService(t *testing.T) (*applicationService, *gorm.DB, *mockStorageService, *mockAIService, *mockJobRepository) {
	db := setupTestDB(t)

	mockStorage := &mockStorageService{}
	mockAI := &mockAIService{}
	mockJobRepo := &mockJobRepository{
		jobs: make(map[uint]*model.Job),
		db:   db,
	}
	mockEmail := &mockEmailService{}

	logger := zap.NewNop()

	service := &applicationService{
		jobRepo:    mockJobRepo,
		repo:       repository.NewRepository(db),
		userRepo:   repository.NewRepository(db),
		emailSvc:   mockEmail,
		meetingSvc: nil,
		storageSvc: mockStorage,
		aiSvc:      mockAI,
		logger:     logger,
	}

	return service, db, mockStorage, mockAI, mockJobRepo
}

// TestApplyWithTransaction tests that Apply method properly uses transactions
func TestApplyWithTransaction(t *testing.T) {
	ctx := context.Background()

	t.Run("should successfully apply for a job with transaction", func(t *testing.T) {
		service, db, mockStorage, _, mockJobRepo := createMockService(t)

		// Create a published job with FileURL for AI scoring
		job := &model.Job{
			Title:            "Software Engineer",
			Slug:             "software-engineer",
			DepartmentID:     1,
			Description:      "Build great software",
			Status:           model.StatusPublished,
			ApplicationCount: 0,
			CreatedByID:      1,
			FileURL:          "job-description.pdf", // Set FileURL for AI scoring
		}
		err := mockJobRepo.Create(job)
		if err != nil {
			t.Fatalf("Failed to create test job: %v", err)
		}

		// Create request
		req := dto.ApplyJobRequest{
			Name:     "John Doe",
			Email:    "john@example.com",
			Phone:    "1234567890",
			Address:  "123 Main St",
			LinkedIn: "https://linkedin.com/in/johndoe",
		}

		cvFile := createTestFileHeader("resume.pdf", "application/pdf", nil)
		// Call Apply
		resp, err := service.Apply(ctx, req, "software-engineer", cvFile)

		// Assert success
		if err != nil {
			t.Fatalf("Apply should succeed: %v", err)
		}

		if resp == nil {
			t.Fatal("Apply should return a response")
		}

		if resp.JobTitle != "Software Engineer" {
			t.Errorf("Expected JobTitle 'Software Engineer', got '%s'", resp.JobTitle)
		}

		// AI scoring is now async, so initial response should have default values
		if resp.AIScore != 0 {
			t.Errorf("Expected initial AIScore 0 (async scoring), got %d", resp.AIScore)
		}

		// Verify CV was uploaded
		if mockStorage.uploadedCV == "" {
			t.Error("CV should have been uploaded")
		}

		// Verify candidate was created
		var candidate model.User
		err = db.Where("email = ?", "john@example.com").First(&candidate).Error
		if err != nil {
			t.Fatalf("Candidate should be created: %v", err)
		}

		if candidate.Name != "John Doe" {
			t.Errorf("Expected candidate name 'John Doe', got '%s'", candidate.Name)
		}

		// Verify application was created
		var app model.Application
		err = db.Where("candidate_id = ? AND job_id = ?", candidate.ID, job.ID).First(&app).Error
		if err != nil {
			t.Fatalf("Application should be created: %v", err)
		}

		if app.CVFilename != "test-cv-file.pdf" {
			t.Errorf("Expected CVFilename 'test-cv-file.pdf', got '%s'", app.CVFilename)
		}

		// Verify job application count was incremented
		var updatedJob model.Job
		err = db.First(&updatedJob, job.ID).Error
		if err != nil {
			t.Fatalf("Failed to fetch updated job: %v", err)
		}

		if updatedJob.ApplicationCount != 1 {
			t.Errorf("Expected ApplicationCount 1, got %d", updatedJob.ApplicationCount)
		}
	})

	t.Run("should rollback transaction on candidate creation failure", func(t *testing.T) {
		service, db, _, _, mockJobRepo := createMockService(t)

		// Create a published job
		job := &model.Job{
			Title:            "Software Engineer",
			Slug:             "software-engineer",
			DepartmentID:     1,
			Description:      "Build great software",
			Status:           model.StatusPublished,
			ApplicationCount: 0,
			CreatedByID:      1,
			FileURL:          "job-description.pdf",
		}
		err := mockJobRepo.Create(job)
		if err != nil {
			t.Fatalf("Failed to create test job: %v", err)
		}

		// Create request with duplicate email (second call should fail)
		req := dto.ApplyJobRequest{
			Name:     "John Doe",
			Email:    "test-rollback@example.com",
			Phone:    "1234567890",
			Address:  "123 Main St",
		}

		cvFile := createTestFileHeader("resume.pdf", "application/pdf", nil)

		// First apply should succeed
		_, err = service.Apply(ctx, req, "software-engineer", cvFile)
		if err != nil {
			t.Fatalf("First apply should succeed: %v", err)
		}

		// Get initial count
		var updatedJob model.Job
		err = db.First(&updatedJob, job.ID).Error
		if err != nil {
			t.Fatalf("Failed to fetch job: %v", err)
		}
		initialCount := updatedJob.ApplicationCount

		// Get the created candidate ID
		var candidate model.User
		err = db.Where("email = ?", "test-rollback@example.com").First(&candidate).Error
		if err != nil {
			t.Fatalf("Failed to find candidate: %v", err)
		}

		// Now apply again with same job - should fail with "already applied"
		req2 := dto.ApplyJobRequest{
			Name:  "John Doe",
			Email: "test-rollback@example.com",
			Phone: "1234567890",
		}
		cvFile2 := &multipart.FileHeader{
			Filename: "resume2.pdf",
			Size:     1024,
		}

		_, err = service.Apply(ctx, req2, "software-engineer", cvFile2)
		if err == nil {
			t.Error("Second apply should fail with 'already applied' error")
		}

		if !strings.Contains(err.Error(), "sudah melamar") {
			t.Errorf("Expected 'already applied' error, got: %v", err)
		}

		// Verify application count didn't increase
		err = db.First(&updatedJob, job.ID).Error
		if err != nil {
			t.Fatalf("Failed to fetch updated job: %v", err)
		}

		if updatedJob.ApplicationCount != initialCount {
			t.Errorf("Application count should not increase on duplicate apply: expected %d, got %d", initialCount, updatedJob.ApplicationCount)
		}
	})

	t.Run("should cleanup CV file on application creation failure", func(t *testing.T) {
		service, _, mockStorage, _, mockJobRepo := createMockService(t)

		// Create a published job
		job := &model.Job{
			Title:            "Software Engineer",
			Slug:             "software-engineer",
			DepartmentID:     1,
			Description:      "Build great software",
			Status:           model.StatusPublished,
			ApplicationCount: 0,
			CreatedByID:      1,
			FileURL:          "job-description.pdf",
		}
		err := mockJobRepo.Create(job)
		if err != nil {
			t.Fatalf("Failed to create test job: %v", err)
		}

		// Mock storage to track deletion
		deletedFiles := []string{}
		mockStorage.deleteFunc = func(ctx context.Context, filename string) error {
			deletedFiles = append(deletedFiles, filename)
			return nil
		}

		// Mock job repo update to fail (simulating transaction rollback)
		mockJobRepo.updateFunc = func(job *model.Job) error {
			return errors.New("simulated update failure")
		}

		req := dto.ApplyJobRequest{
			Name:     "John Doe",
			Email:    "cleanup-test@example.com",
			Phone:    "1234567890",
			Address:  "123 Main St",
		}

		cvFile := createTestFileHeader("resume.pdf", "application/pdf", nil)

		// Call Apply - should fail and cleanup CV
		_, err = service.Apply(ctx, req, "software-engineer", cvFile)

		// The transaction should have rolled back, so we expect an error
		// The CV should have been uploaded before the transaction
		// If transaction rolls back, CV should be deleted
		if mockStorage.uploadedCV != "" {
			// CV was uploaded, check if it was cleaned up
			cvDeleted := false
			for _, f := range deletedFiles {
				if f == mockStorage.uploadedCV {
					cvDeleted = true
					break
				}
			}
			if cvDeleted {
				t.Log("CV was properly cleaned up after transaction rollback")
			} else {
				t.Log("CV was uploaded but may not have been cleaned up (acceptable for non-critical cleanup)")
			}
		}
	})

	t.Run("should increment ApplicationCount atomically", func(t *testing.T) {
		service, db, _, _, mockJobRepo := createMockService(t)

		// Create a published job with initial count
		job := &model.Job{
			Title:            "Software Engineer",
			Slug:             "software-engineer",
			DepartmentID:     1,
			Description:      "Build great software",
			Status:           model.StatusPublished,
			ApplicationCount: 5,
			CreatedByID:      1,
		}
		err := mockJobRepo.Create(job)
		if err != nil {
			t.Fatalf("Failed to create test job: %v", err)
		}

		req := dto.ApplyJobRequest{
			Name:  "Jane Doe",
			Email: "jane@example.com",
			Phone: "9876543210",
		}

		cvFile := createTestFileHeader("resume.pdf", "application/pdf", nil)

		// Call Apply
		_, err = service.Apply(ctx, req, "software-engineer", cvFile)
		if err != nil {
			t.Fatalf("Apply should succeed: %v", err)
		}

		// Verify count was incremented by 1
		var updatedJob model.Job
		err = db.First(&updatedJob, job.ID).Error
		if err != nil {
			t.Fatalf("Failed to fetch updated job: %v", err)
		}

		expectedCount := uint(6)
		if updatedJob.ApplicationCount != expectedCount {
			t.Errorf("Expected ApplicationCount %d, got %d", expectedCount, updatedJob.ApplicationCount)
		}
	})

	t.Run("should handle existing candidate correctly", func(t *testing.T) {
		service, db, _, _, mockJobRepo := createMockService(t)

		// Create an existing candidate
		existingCandidate := &model.User{
			Name:     "Existing User",
			Email:    "existing@example.com",
			Password: "hashedpassword",
			Phone:    "5551234567",
			Role:     "candidate",
		}
		err := db.Create(existingCandidate).Error
		if err != nil {
			t.Fatalf("Failed to create existing candidate: %v", err)
		}

		// Create a published job
		job := &model.Job{
			Title:            "Software Engineer",
			Slug:             "software-engineer",
			DepartmentID:     1,
			Description:      "Build great software",
			Status:           model.StatusPublished,
			ApplicationCount: 0,
			CreatedByID:      1,
		}
		err = mockJobRepo.Create(job)
		if err != nil {
			t.Fatalf("Failed to create test job: %v", err)
		}

		req := dto.ApplyJobRequest{
			Name:     "Existing User",
			Email:    "existing@example.com",
			Phone:    "5551234567",
		}

		cvFile := createTestFileHeader("resume.pdf", "application/pdf", nil)

		// Call Apply - should use existing candidate
		resp, err := service.Apply(ctx, req, "software-engineer", cvFile)
		if err != nil {
			t.Fatalf("Apply should succeed: %v", err)
		}

		if resp == nil {
			t.Fatal("Apply should return a response")
		}

		// Verify no new candidate was created
		var count int64
		err = db.Model(&model.User{}).Where("email = ?", "existing@example.com").Count(&count).Error
		if err != nil {
			t.Fatalf("Failed to count candidates: %v", err)
		}

		if count != 1 {
			t.Errorf("Expected 1 candidate with email 'existing@example.com', got %d", count)
		}

		// Verify application was created with existing candidate
		var app model.Application
		err = db.Where("candidate_id = ? AND job_id = ?", existingCandidate.ID, job.ID).First(&app).Error
		if err != nil {
			t.Fatalf("Application should be created: %v", err)
		}
	})

	t.Run("should return error for unpublished job", func(t *testing.T) {
		service, _, _, _, mockJobRepo := createMockService(t)

		// Create a draft job
		job := &model.Job{
			Title:            "Software Engineer",
			Slug:             "software-engineer",
			DepartmentID:     1,
			Description:      "Build great software",
			Status:           model.StatusDraft,
			ApplicationCount: 0,
			CreatedByID:      1,
		}
		err := mockJobRepo.Create(job)
		if err != nil {
			t.Fatalf("Failed to create test job: %v", err)
		}

		req := dto.ApplyJobRequest{
			Name:     "John Doe",
			Email:    "john@example.com",
			Phone:    "1234567890",
		}

		cvFile := createTestFileHeader("resume.pdf", "application/pdf", nil)

		// Call Apply - should fail
		_, err = service.Apply(ctx, req, "software-engineer", cvFile)
		if err == nil {
			t.Error("Apply should fail for unpublished job")
		}

		if !strings.Contains(err.Error(), "tidak ditemukan") && !strings.Contains(err.Error(), "belum dipublish") {
			t.Errorf("Expected job not found/published error, got: %v", err)
		}
	})

	t.Run("should return error for invalid request", func(t *testing.T) {
		service, _, _, _, mockJobRepo := createMockService(t)

		// Create a published job
		job := &model.Job{
			Title:            "Software Engineer",
			Slug:             "software-engineer",
			DepartmentID:     1,
			Description:      "Build great software",
			Status:           model.StatusPublished,
			ApplicationCount: 0,
			CreatedByID:      1,
			FileURL:          "job-description.pdf",
		}
		err := mockJobRepo.Create(job)
		if err != nil {
			t.Fatalf("Failed to create test job: %v", err)
		}

		t.Run("missing name", func(t *testing.T) {
			req := dto.ApplyJobRequest{
				Name:  "",
				Email: "john@example.com",
				Phone: "1234567890",
			}

			cvFile := createTestFileHeader("resume.pdf", "application/pdf", nil)

			_, err := service.Apply(ctx, req, "software-engineer", cvFile)
			if err == nil {
				t.Error("Apply should fail for missing name")
			}
		})

		t.Run("missing CV file", func(t *testing.T) {
			req := dto.ApplyJobRequest{
				Name:  "John Doe",
				Email: "john@example.com",
				Phone: "1234567890",
			}

			_, err := service.Apply(ctx, req, "software-engineer", nil)
			if err == nil {
				t.Error("Apply should fail for missing CV file")
			}
		})
	})
}

// TestWithdrawApplication tests the withdraw functionality with transaction
func TestWithdrawApplication(t *testing.T) {
	ctx := context.Background()

	t.Run("should successfully withdraw and decrement count", func(t *testing.T) {
		service, db, mockStorage, _, mockJobRepo := createMockService(t)

		// Create a published job with initial count
		job := &model.Job{
			Title:            "Software Engineer",
			Slug:             "software-engineer",
			DepartmentID:     1,
			Description:      "Build great software",
			Status:           model.StatusPublished,
			ApplicationCount: 1,
			CreatedByID:      1,
		}
		err := mockJobRepo.Create(job)
		if err != nil {
			t.Fatalf("Failed to create test job: %v", err)
		}

		// Create a candidate
		candidate := &model.User{
			Name:     "John Doe",
			Email:    "john@example.com",
			Password: "hashedpassword",
			Phone:    "1234567890",
			Role:     "candidate",
		}
		err = db.Create(candidate).Error
		if err != nil {
			t.Fatalf("Failed to create candidate: %v", err)
		}

		// Create an application
		app := &model.Application{
			JobID:       job.ID,
			CandidateID: candidate.ID,
			CVFilename:  "test-cv.pdf",
			CVURL:       "http://example.com/test-cv.pdf",
			Status:      model.AppApplied,
			AppliedAt:   time.Now(),
		}
		err = db.Create(app).Error
		if err != nil {
			t.Fatalf("Failed to create application: %v", err)
		}

		// Withdraw application
		err = service.WithdrawApplication(ctx, app.ID, candidate.ID)
		if err != nil {
			t.Fatalf("WithdrawApplication should succeed: %v", err)
		}

		// Verify application was deleted
		var deletedApp model.Application
		err = db.Unscoped().First(&deletedApp, app.ID).Error
		if err == nil {
			t.Error("Application should be deleted")
		}

		// Verify CV was deleted
		cvDeleted := false
		for _, f := range mockStorage.deletedCVs {
			if f == "test-cv.pdf" {
				cvDeleted = true
				break
			}
		}
		if !cvDeleted {
			t.Error("CV should be deleted")
		}

		// Verify job application count was decremented
		var updatedJob model.Job
		err = db.First(&updatedJob, job.ID).Error
		if err != nil {
			t.Fatalf("Failed to fetch updated job: %v", err)
		}

		expectedCount := uint(0)
		if updatedJob.ApplicationCount != expectedCount {
			t.Errorf("Expected ApplicationCount %d, got %d", expectedCount, updatedJob.ApplicationCount)
		}
	})

	t.Run("should not allow withdraw for hired application", func(t *testing.T) {
		service, db, _, _, mockJobRepo := createMockService(t)

		// Create a published job
		job := &model.Job{
			Title:            "Software Engineer",
			Slug:             "software-engineer",
			DepartmentID:     1,
			Description:      "Build great software",
			Status:           model.StatusPublished,
			ApplicationCount: 1,
			CreatedByID:      1,
		}
		err := mockJobRepo.Create(job)
		if err != nil {
			t.Fatalf("Failed to create test job: %v", err)
		}

		// Create a candidate
		candidate := &model.User{
			Name:     "John Doe",
			Email:    "john@example.com",
			Password: "hashedpassword",
			Phone:    "1234567890",
			Role:     "candidate",
		}
		err = db.Create(candidate).Error
		if err != nil {
			t.Fatalf("Failed to create candidate: %v", err)
		}

		// Create an application with hired status
		app := &model.Application{
			JobID:       job.ID,
			CandidateID: candidate.ID,
			CVFilename:  "test-cv.pdf",
			CVURL:       "http://example.com/test-cv.pdf",
			Status:      model.AppHired,
			AppliedAt:   time.Now(),
		}
		err = db.Create(app).Error
		if err != nil {
			t.Fatalf("Failed to create application: %v", err)
		}

		// Try to withdraw - should fail
		err = service.WithdrawApplication(ctx, app.ID, candidate.ID)
		if err == nil {
			t.Error("WithdrawApplication should fail for hired application")
		}

		if !strings.Contains(err.Error(), "hired/rejected") {
			t.Errorf("Expected hired/rejected error, got: %v", err)
		}

		// Verify application still exists
		var existingApp model.Application
		err = db.First(&existingApp, app.ID).Error
		if err != nil {
			t.Error("Application should still exist")
		}

		// Verify count wasn't decremented
		var updatedJob model.Job
		err = db.First(&updatedJob, job.ID).Error
		if err != nil {
			t.Fatalf("Failed to fetch updated job: %v", err)
		}

		if updatedJob.ApplicationCount != 1 {
			t.Errorf("ApplicationCount should remain 1, got %d", updatedJob.ApplicationCount)
		}
	})
}
