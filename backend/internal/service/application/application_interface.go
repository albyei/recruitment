package application

import (
	"context"
	"mime/multipart"

	"wowrack-recruitment/internal/dto"
)

type ApplicationService interface {
	Apply(ctx context.Context, req dto.ApplyJobRequest, jobSlug string, cvFile *multipart.FileHeader) (*dto.ApplicationResponse, error)
	GetApplicationsByCandidate(ctx context.Context, candidateID uint) ([]dto.CandidateApplicationResponse, error)
	WithdrawApplication(ctx context.Context, appID, candidateID uint) error
	EditApplication(ctx context.Context, appID, candidateID uint, req dto.EditApplicationRequest, cvFile *multipart.FileHeader) (*dto.CandidateApplicationResponse, error)
	GetAllApplications(ctx context.Context, page, limit int) ([]dto.HRApplicationResponse, int64, error)
	GetApplicationsByJob(ctx context.Context, jobID uint, page, limit int) ([]dto.HRApplicationResponse, int64, error)
	GetApplicationByID(ctx context.Context, appID uint) (*dto.HRApplicationResponse, error)
	UpdateApplicationStatus(ctx context.Context, appID uint, req dto.UpdateStatusRequest, notes string) error
}