package service

import (
	"context"
	"errors"
	"fmt"
	"log"
	"mime/multipart"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"
	"wowrack-recruitment/internal/config"

	"wowrack-recruitment/internal/dto"
	"wowrack-recruitment/internal/model"
	"wowrack-recruitment/internal/repository"

	"github.com/go-playground/validator/v10"
	"github.com/gosimple/slug"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

var (
	onceJob    sync.Once
	bucketJobs string
)

func initMinioClientJob() {
	onceJob.Do(func() {
		endpoint := os.Getenv("S3_ENDPOINT")
		if endpoint == "" {
			endpoint = "127.0.0.1:9000" // fallback, tapi sebaiknya hapus dan wajib dari env
		}
		accessKey := os.Getenv("S3_ACCESS_KEY")
		secretKey := os.Getenv("S3_SECRET_KEY")
		useSSL := os.Getenv("S3_USE_SSL") == "true"

		var err error
		minioClient, err = minio.New(endpoint, &minio.Options{
			Creds:        credentials.NewStaticV4(accessKey, secretKey, ""),
			Secure:       useSSL,
			BucketLookup: minio.BucketLookupPath, // ← PENTING! Untuk RustFS/self-hosted
		})
		if err != nil {
			log.Fatal("RustFS gagal terkoneksi di ApplicationService: " + err.Error())
		}

		bucketJobs = os.Getenv("S3_BUCKET_JOBS")
		if bucketJobs == "" {
			bucketJobs = "jobs"
		}

		ctx := context.Background()
		exists, err := minioClient.BucketExists(ctx, bucketJobs)
		if err != nil {
			log.Fatal("Gagal cek bucket applications: " + err.Error())
		}
		if !exists {
			err = minioClient.MakeBucket(ctx, bucketJobs, minio.MakeBucketOptions{})
			if err != nil {
				log.Fatal("Gagal buat bucket applications: " + err.Error())
			}
		}
	})
}

type JobService interface {
	Create(req dto.CreateJobRequest, file *multipart.FileHeader, userID uint) (*dto.JobResponse, error)
	Update(id uint, req dto.UpdateJobRequest, file *multipart.FileHeader, userID uint) (*dto.JobResponse, error)
	SubmitForApproval(id uint, userID uint) error
	Approve(id uint, approverID uint) error
	Reject(id uint, reason string, rejecterID uint) error // BARU
	Publish(id uint, userID uint) error
	Close(id uint, userID uint) error
	GetByID(id uint) (*dto.JobResponse, error)
	GetBySlug(slug string) (*dto.JobResponse, error)
	// GetPublishedJobs(filters map[string]string) ([]dto.JobListResponse, error)
	GetPublishedJobsWithPagination(filters map[string]string, page, limit int) ([]dto.JobListResponse, int64, error)
	GetAllForHRWithPagination(page, limit int) ([]dto.JobResponse, int64, error)
	GetAllForManagerWithPagination(page, limit int) ([]dto.JobResponse, int64, error)
	// GetAllForHR(page, limit int) ([]dto.JobResponse, int64, error)
	// GetAllForManager() ([]dto.JobResponse, error)
	Delete(id uint) error
	GetActiveVacancies() ([]dto.ActiveVacancyDTO, error)
}

// func (j JobService) GetAllForManagerWithPagination(page int, limit int) (any, any, any) {
// 	panic("unimplemented")
// }

// func (j JobService) GetAllForHRWithPagination(page int, limit int) (any, any, any) {
// 	panic("unimplemented")
// }

type jobService struct {
	repo       repository.JobRepository
	minio      *minio.Client
	bucketName string
}

func NewJobService(repo repository.JobRepository) JobService {
	initMinioClientJob() // atau initMinioClientApp() kalau reuse client

	return &jobService{
		repo: repo,
	}
}

func (s *jobService) getFileURL(filename string) string {
	if filename == "" {
		return ""
	}
	reqParams := make(url.Values)
	u, _ := minioClient.PresignedGetObject(context.Background(), bucketJobs, filename, time.Hour*24*7, reqParams)
	return u.String()
}

func (s *jobService) uploadJD(file *multipart.FileHeader) (string, error) {
	if file == nil {
		return "", nil
	}
	if file.Size > 10<<20 {
		return "", errors.New("file maksimal 10MB")
	}
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".pdf" && ext != ".docx" && ext != ".doc" {
		return "", errors.New("hanya PDF atau Word")
	}

	src, err := file.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	filename := fmt.Sprintf("jd/%d%s", time.Now().UnixNano(), ext)
	_, err = minioClient.PutObject(context.Background(), bucketJobs, filename, src, file.Size, minio.PutObjectOptions{
		ContentType: file.Header.Get("Content-Type"),
	})
	if err != nil {
		return "", err
	}
	return filename, nil
}

func (s *jobService) Create(req dto.CreateJobRequest, file *multipart.FileHeader, userID uint) (*dto.JobResponse, error) {
	if err := validator.New().Struct(req); err != nil {
		return nil, err
	}

	filename, err := s.uploadJD(file)
	if err != nil {
		return nil, err
	}

	job := &model.Job{
		Title:          req.Title,
		Slug:           s.generateUniqueSlug(req.Title),
		Description:    req.Description,
		Requirements:   req.Requirements,
		Benefits:       req.Benefits,
		Location:       req.Location,
		EmploymentType: req.EmploymentType,
		SalaryRange:    req.SalaryRange,
		DepartmentID:   req.DepartmentID,
		QuantityNeeded: req.QuantityNeeded,
		Priority:       model.PriorityMedium,
		Status:         model.StatusDraft,
		CreatedByID:    userID,
		FileURL:        filename, // simpan nama file saja
	}
	if req.QuantityNeeded > 0 {
		job.QuantityNeeded = req.QuantityNeeded
	}
	if req.Priority != "" {
		job.Priority = model.Priority(req.Priority)
	}

	if err := s.repo.Create(job); err != nil {
		return nil, err
	}
	return s.GetByID(job.ID)
}

func (s *jobService) Update(id uint, req dto.UpdateJobRequest, file *multipart.FileHeader, userID uint) (*dto.JobResponse, error) {
	job, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("job tidak ditemukan")
	}

	if job.CreatedByID != userID {
		return nil, errors.New("hanya pembuat yang boleh mengedit")
	}

	if job.Status != model.StatusDraft && job.Status != model.StatusRejected {
		return nil, errors.New("job hanya bisa diedit saat draft atau rejected")
	}

	if req.Title != nil {
		job.Title = *req.Title
		job.Slug = s.generateUniqueSlug(*req.Title)
	}
	if req.Description != nil {
		job.Description = *req.Description
	}
	if req.Requirements != nil {
		job.Requirements = *req.Requirements
	}
	if req.Benefits != nil {
		job.Benefits = *req.Benefits
	}
	if req.Location != nil {
		job.Location = *req.Location
	}
	if req.EmploymentType != nil {
		job.EmploymentType = *req.EmploymentType
	}
	if req.SalaryRange != nil {
		job.SalaryRange = *req.SalaryRange
	}
	if req.DepartmentID != nil {
		job.DepartmentID = *req.DepartmentID
	}
	if req.QuantityNeeded != nil {
		job.QuantityNeeded = *req.QuantityNeeded
	}
	if req.Priority != nil {
		job.Priority = model.Priority(*req.Priority)
	}

	if file != nil {
		if job.FileURL != "" {
			minioClient.RemoveObject(context.Background(), bucketJobs, job.FileURL, minio.RemoveObjectOptions{})
		}
		newFile, err := s.uploadJD(file)
		if err != nil {
			return nil, err
		}
		job.FileURL = newFile
	}

	// Reset status kalau dari rejected
	if job.Status == model.StatusRejected {
		job.Status = model.StatusDraft
		job.RejectReason = nil
		job.RejectedByID = nil
		job.RejectedAt = nil
	}

	if err := s.repo.Update(job); err != nil {
		return nil, err
	}
	return s.GetByID(job.ID)
}

func (s *jobService) SubmitForApproval(id uint, userID uint) error {
	job, err := s.repo.FindByID(id)
	if err != nil {
		return errors.New("job tidak ditemukan")
	}
	if job.CreatedByID != userID {
		return errors.New("hanya pembuat yang boleh submit")
	}
	if job.Status != model.StatusDraft {
		return errors.New("hanya draft yang bisa disubmit")
	}

	job.Status = model.StatusPendingApproval
	return s.repo.Update(job)
}

func (s *jobService) Approve(id uint, approverID uint) error {
	job, err := s.repo.FindByID(id)
	if err != nil {
		return errors.New("job tidak ditemukan")
	}
	if job.Status != model.StatusPendingApproval {
		return errors.New("hanya pending yang bisa diapprove")
	}

	if job.DepartmentID != 0 {
		var user model.User
		config.DB.First(&user, approverID)
		if user.Role != "hr" {
			return errors.New("hanya hr yang boleh approve")
		}
		// Nanti bisa ditambah logic cek department manager
	}

	job.Status = model.StatusApproved
	job.ApprovedByID = &approverID
	return s.repo.Update(job)
}

func (s *jobService) Publish(id uint, userID uint) error {
	job, err := s.repo.FindByID(id)
	if err != nil {
		return errors.New("job tidak ditemukan")
	}
	if job.Status != model.StatusApproved {
		return errors.New("hanya approved yang bisa dipublish")
	}

	now := time.Now()
	job.Status = model.StatusPublished
	job.OpenedAt = &now
	return s.repo.Update(job)
}

func (s *jobService) Close(id uint, userID uint) error {
	job, err := s.repo.FindByID(id)
	if err != nil {
		return errors.New("job tidak ditemukan")
	}
	if job.Status != model.StatusPublished {
		return errors.New("hanya published yang bisa diclose")
	}

	now := time.Now()
	job.Status = model.StatusClosed
	job.ClosedAt = &now
	return s.repo.Update(job)
}

func (s *jobService) GetByID(id uint) (*dto.JobResponse, error) {
	job, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	return s.modelToResponse(job), nil
}

func (s *jobService) GetBySlug(slug string) (*dto.JobResponse, error) {
	job, err := s.repo.FindBySlug(slug)
	if err != nil {
		return nil, err
	}
	return s.modelToResponse(job), nil
}

func (s *jobService) GetPublishedJobsWithPagination(filters map[string]string, page, limit int) ([]dto.JobListResponse, int64, error) {
	jobs, total, err := s.repo.GetAllPublishedWithPagination(filters, page, limit)
	if err != nil {
		return nil, 0, err
	}
	res := make([]dto.JobListResponse, len(jobs))
	for i, j := range jobs {
		res[i] = dto.JobListResponse{
			ID:             j.ID,
			Title:          j.Title,
			Slug:           j.Slug,
			Location:       j.Location,
			EmploymentType: j.EmploymentType,
			SalaryRange:    j.SalaryRange,
			Department:     j.Department.Name,
			Priority:       string(j.Priority),
			QuantityNeeded: j.QuantityNeeded,
			PublishedAt:    j.OpenedAt,
		}
	}
	return res, total, nil
}

func (s *jobService) GetAllForHRWithPagination(page, limit int) ([]dto.JobResponse, int64, error) {
	jobs, total, err := s.repo.GetAllForHRWithPagination(page, limit)
	if err != nil {
		return nil, 0, err
	}
	res := make([]dto.JobResponse, len(jobs))
	for i, j := range jobs {
		res[i] = *s.modelToResponse(&j)
	}
	return res, total, nil
}
func (s *jobService) GetAllForManagerWithPagination(page, limit int) ([]dto.JobResponse, int64, error) {
	jobs, total, err := s.repo.GetAllForManagerWithPagination(page, limit)
	if err != nil {
		return nil, 0, err
	}
	res := make([]dto.JobResponse, len(jobs))
	for i, j := range jobs {
		res[i] = *s.modelToResponse(&j)
	}
	return res, total, nil
}

func (s *jobService) Delete(id uint) error {
	return s.repo.Delete(id)
}

func (s *jobService) modelToResponse(j *model.Job) *dto.JobResponse {
	resp := &dto.JobResponse{
		ID:             j.ID,
		Title:          j.Title,
		Slug:           j.Slug,
		Description:    j.Description,
		Requirements:   j.Requirements,
		Benefits:       j.Benefits,
		Location:       j.Location,
		EmploymentType: j.EmploymentType,
		SalaryRange:    j.SalaryRange,
		Department:     dto.DepartmentResponse{ID: j.Department.ID, Name: j.Department.Name},
		QuantityNeeded: j.QuantityNeeded,
		Priority:       string(j.Priority),
		Status:         string(j.Status),
		OpenedAt:       j.OpenedAt,
		ClosedAt:       j.ClosedAt,
		CreatedBy:      dto.UserResponse{ID: j.CreatedBy.ID, Name: j.CreatedBy.Name, Role: j.CreatedBy.Role},
		FileURL:        s.getFileURL(j.FileURL),
		CreatedAt:      j.CreatedAt,
		RejectReason:   j.RejectReason,
		RejectedAt:     j.RejectedAt,
	}

	if j.ApprovedBy != nil {
		resp.ApprovedBy = &dto.UserResponse{
			ID:   j.ApprovedBy.ID,
			Name: j.ApprovedBy.Name,
			Role: j.ApprovedBy.Role,
		}
	}
	if j.RejectedBy != nil {
		resp.RejectedBy = &dto.UserResponse{
			ID:   j.RejectedBy.ID,
			Name: j.RejectedBy.Name,
			Role: j.RejectedBy.Role,
		}
	}
	return resp
}

func (s *jobService) Reject(id uint, reason string, rejecterID uint) error {
	job, err := s.repo.FindByID(id)
	if err != nil {
		return errors.New("job tidak ditemukan")
	}
	if job.Status != model.StatusPendingApproval {
		return errors.New("hanya job pending approval yang bisa direject")
	}

	now := time.Now()
	job.Status = model.StatusRejected
	job.RejectReason = &reason
	job.RejectedByID = &rejecterID
	job.RejectedAt = &now

	return s.repo.Update(job)
}

func (s *jobService) generateUniqueSlug(title string) string {
	base := slug.Make(title)
	original := base
	i := 1
	for {
		if _, err := s.repo.FindBySlug(base); err != nil {
			return base
		}
		base = original + "-" + strconv.Itoa(i)
		i++
	}
}

// GetActiveVacancies retrieves all published, non-archived jobs
func (s *jobService) GetActiveVacancies() ([]dto.ActiveVacancyDTO, error) {
	jobs, err := s.repo.GetAllPublished(nil)
	if err != nil {
		return nil, err
	}

	// Filter out archived jobs and build result
	result := make([]dto.ActiveVacancyDTO, 0)
	for _, job := range jobs {
		if job.IsArchived {
			continue
		}
		result = append(result, dto.ActiveVacancyDTO{
			ID:             job.ID,
			Title:          job.Title,
			Department:     job.Department.Name,
			Location:       job.Location,
			Status:         string(job.Status),
			ApplicantCount: int(job.ApplicationCount),
			CreatedAt:      job.CreatedAt.Format("02 Jan 2006 15:04"),
		})
	}
	return result, nil
}
