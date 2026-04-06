package application

import (
	"context"
	"strings"
	"testing"

	"wowrack-recruitment/internal/dto"
	"wowrack-recruitment/internal/model"
)

// TestMVPFieldValidation tests validation for MVP form fields
func TestMVPFieldValidation(t *testing.T) {
	ctx := context.Background()

	t.Run("should fail when terms not accepted", func(t *testing.T) {
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
		}
		err := mockJobRepo.Create(job)
		if err != nil {
			t.Fatalf("Failed to create test job: %v", err)
		}

		// Request with TermsAccepted = false
		req := dto.ApplyJobRequest{
			Name:           "John Doe",
			Email:          "john@example.com",
			Phone:          "1234567890",
			TermsAccepted:  false, // Invalid!
			WhatsAppNumber:  "08123456789",
			DomicileCity:    "Jakarta",
			DomicileProvince: "DKI Jakarta",
		}

		cvFile := createTestFileHeader("resume.pdf", "application/pdf", nil)

		// Call Apply - should fail
		_, err = service.Apply(ctx, req, "software-engineer", cvFile)
		if err == nil {
			t.Error("Apply should fail when terms not accepted")
		}

		if !strings.Contains(strings.ToLower(err.Error()), "terms") {
			t.Errorf("Expected terms validation error, got: %v", err)
		}
	})

	t.Run("should fail when WhatsApp number is missing", func(t *testing.T) {
		service, _, _, _, mockJobRepo := createMockService(t)

		job := &model.Job{
			Title:            "Software Engineer",
			Slug:             "software-engineer",
			DepartmentID:     1,
			Description:      "Build great software",
			Status:           model.StatusPublished,
			ApplicationCount: 0,
			CreatedByID:      1,
		}
		err := mockJobRepo.Create(job)
		if err != nil {
			t.Fatalf("Failed to create test job: %v", err)
		}

		// Request missing WhatsAppNumber
		req := dto.ApplyJobRequest{
			Name:           "John Doe",
			Email:          "john@example.com",
			Phone:          "1234567890",
			TermsAccepted:  true,
			WhatsAppNumber:  "", // Missing!
			DomicileCity:    "Jakarta",
			DomicileProvince: "DKI Jakarta",
		}

		cvFile := createTestFileHeader("resume.pdf", "application/pdf", nil)

		_, err = service.Apply(ctx, req, "software-engineer", cvFile)
		if err == nil {
			t.Error("Apply should fail when WhatsApp number is missing")
		}

		if !strings.Contains(strings.ToLower(err.Error()), "wajib diisi") {
			t.Errorf("Expected required field error, got: %v", err)
		}
	})

	t.Run("should succeed with valid MVP fields", func(t *testing.T) {
		service, db, _, _, mockJobRepo := createMockService(t)

		job := &model.Job{
			Title:            "Software Engineer",
			Slug:             "software-engineer",
			DepartmentID:     1,
			Description:      "Build great software",
			Status:           model.StatusPublished,
			ApplicationCount: 0,
			CreatedByID:      1,
		}
		err := mockJobRepo.Create(job)
		if err != nil {
			t.Fatalf("Failed to create test job: %v", err)
		}

		// Request with all valid MVP fields
		req := dto.ApplyJobRequest{
			Name:           "Jane Doe",
			Email:          "jane@example.com",
			Phone:          "9876543210",
			TermsAccepted:  true,
			WhatsAppNumber:  "08123456789",
			DomicileCity:    "Jakarta",
			DomicileProvince: "DKI Jakarta",
			LastWorkRole:    "Software Engineer",
			LastWorkCompany: "Tech Corp",
			LastWorkFrom:    "2023-01-01",
			LastWorkTo:      "2024-01-01",
			University:      "University of Indonesia",
		}

		cvFile := createTestFileHeader("resume.pdf", "application/pdf", nil)

		// Call Apply - should succeed
		_, err = service.Apply(ctx, req, "software-engineer", cvFile)
		if err != nil {
			t.Fatalf("Apply should succeed with valid MVP fields: %v", err)
		}

		// Verify application was created with MVP fields
		var app model.Application
		err = db.Where("candidate_id > 0").Order("id DESC").First(&app).Error
		if err != nil {
			t.Fatalf("Failed to find application: %v", err)
		}

		if !app.TermsAccepted {
			t.Error("TermsAccepted should be true")
		}

		if app.WhatsappNumber != "08123456789" {
			t.Errorf("Expected WhatsappNumber '08123456789', got '%s'", app.WhatsappNumber)
		}

		if app.DomicileCity != "Jakarta" {
			t.Errorf("Expected DomicileCity 'Jakarta', got '%s'", app.DomicileCity)
		}

		if app.DomicileProvince != "DKI Jakarta" {
			t.Errorf("Expected DomicileProvince 'DKI Jakarta', got '%s'", app.DomicileProvince)
		}

		if app.LastWorkRole == nil || *app.LastWorkRole != "Software Engineer" {
			t.Error("LastWorkRole should be 'Software Engineer'")
		}

		if app.LastWorkCompany == nil || *app.LastWorkCompany != "Tech Corp" {
			t.Error("LastWorkCompany should be 'Tech Corp'")
		}

		if app.University == nil || *app.University != "University of Indonesia" {
			t.Error("University should be 'University of Indonesia'")
		}
	})

	t.Run("should handle optional MVP fields correctly", func(t *testing.T) {
		service, db, _, _, mockJobRepo := createMockService(t)

		job := &model.Job{
			Title:            "Software Engineer",
			Slug:             "software-engineer",
			DepartmentID:     1,
			Description:      "Build great software",
			Status:           model.StatusPublished,
			ApplicationCount: 0,
			CreatedByID:      1,
		}
		err := mockJobRepo.Create(job)
		if err != nil {
			t.Fatalf("Failed to create test job: %v", err)
		}

		// Request with only required MVP fields
		req := dto.ApplyJobRequest{
			Name:           "New Grad",
			Email:          "newgrad@example.com",
			Phone:          "5551234567",
			TermsAccepted:  true,
			WhatsAppNumber:  "08198765432",
			DomicileCity:    "Bandung",
			DomicileProvince: "Jawa Barat",
		}

		cvFile := createTestFileHeader("resume.pdf", "application/pdf", nil)

		// Call Apply - should succeed
		_, err = service.Apply(ctx, req, "software-engineer", cvFile)
		if err != nil {
			t.Fatalf("Apply should succeed with minimal MVP fields: %v", err)
		}

		// Verify optional fields are null/empty
		var app model.Application
		err = db.Where("candidate_id > 0").Order("id DESC").First(&app).Error
		if err != nil {
			t.Fatalf("Failed to find application: %v", err)
		}

		if app.LastWorkRole != nil {
			t.Error("LastWorkRole should be nil when not provided")
		}

		if app.LastWorkCompany != nil {
			t.Error("LastWorkCompany should be nil when not provided")
		}

		if app.University != nil {
			t.Error("University should be nil when not provided")
		}
	})
}
