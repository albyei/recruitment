//go:build integration

package integration

import (
	"bytes"
	"encoding/json"
	"fmt"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
	"gorm.io/gorm"

	handler "wowrack-recruitment/internal/handlers"
	"wowrack-recruitment/internal/model"
	"wowrack-recruitment/internal/repository"
	"wowrack-recruitment/internal/service/application"
)

// fakePDFContent is a minimal valid PDF header that passes http.DetectContentType()
var fakePDFContent = append([]byte("%PDF-1.4\n"), make([]byte, 20)...)

func TestPOST_JobsSlugApply_Success(t *testing.T) {
	db := GetTestDB()
	router := setupTestRouter(db)

	// Create test job
	job := CreateTestJob(t, "Software Engineer", "software-engineer-test", "published", db)
	jobID := job.ID

	// Prepare multipart form data
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	writer.WriteField("name", "Test Candidate")
	writer.WriteField("email", "test.candidate@example.com")
	writer.WriteField("phone", "08123456789")
	writer.WriteField("terms_accepted", "true")
	writer.WriteField("whatsapp_number", "08123456789")
	writer.WriteField("domicile_city", "Jakarta")
	writer.WriteField("domicile_province", "DKI Jakarta")
	writer.WriteField("university", "University of Indonesia")

	// Add dummy CV file
	part, err := writer.CreateFormFile("cv", "test_cv.pdf")
	assert.NoError(t, err)
	part.Write(fakePDFContent)
	writer.Close()

	req, err := http.NewRequest("POST", "/api/v1/jobs/software-engineer-test/apply", body)
	assert.NoError(t, err)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	fmt.Printf("Response Body: %+v\n", response)

	// Should create application successfully
	assert.Equal(t, http.StatusCreated, w.Code)

	// Verify application was created - check total applications for the job
	var applications []model.Application
	db.Where("job_id = ?", jobID).Find(&applications)

	assert.Len(t, applications, 1)
}

func TestPOST_JobsSlugApply_TermsNotAccepted(t *testing.T) {
	db := GetTestDB()
	router := setupTestRouter(db)

	_ = CreateTestJob(t, "Software Engineer", "terms-not-accepted-test", "published", db)

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// terms_accepted = false - should fail
	writer.WriteField("name", "Test Candidate")
	writer.WriteField("email", "test.candidate@example.com")
	writer.WriteField("phone", "08123456789")
	writer.WriteField("terms_accepted", "false") // Invalid!
	writer.WriteField("whatsapp_number", "08123456789")
	writer.WriteField("domicile_city", "Jakarta")
	writer.WriteField("domicile_province", "DKI Jakarta")

	part, _ := writer.CreateFormFile("cv", "test_cv.pdf")
	part.Write(fakePDFContent)
	writer.Close()

	req, _ := http.NewRequest("POST", "/api/v1/jobs/terms-not-accepted-test/apply", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return validation error
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Contains(t, response["error"], "terms must be accepted")
}

func TestPOST_JobsSlugApply_InvalidWhatsApp(t *testing.T) {
	db := GetTestDB()
	router := setupTestRouter(db)

	_ = CreateTestJob(t, "Software Engineer", "invalid-whatsapp-test", "published", db)

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// Invalid WhatsApp number format (not 08xx)
	writer.WriteField("name", "Test Candidate")
	writer.WriteField("email", "test.candidate@example.com")
	writer.WriteField("phone", "08123456789")
	writer.WriteField("terms_accepted", "true")
	writer.WriteField("whatsapp_number", "12345") // Invalid - too short and no prefix
	writer.WriteField("domicile_city", "Jakarta")
	writer.WriteField("domicile_province", "DKI Jakarta")

	part, _ := writer.CreateFormFile("cv", "test_cv.pdf")
	part.Write(fakePDFContent)
	writer.Close()

	req, _ := http.NewRequest("POST", "/api/v1/jobs/invalid-whatsapp-test/apply", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return validation error
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestPOST_JobsSlugApply_DuplicateApplication(t *testing.T) {
	db := GetTestDB()
	router := setupTestRouter(db)

	_ = CreateTestJob(t, "Software Engineer", "duplicate-test", "published", db)

	// Create first application
	body1 := &bytes.Buffer{}
	writer1 := multipart.NewWriter(body1)
	writer1.WriteField("name", "Test Candidate")
	writer1.WriteField("email", "test.candidate@example.com")
	writer1.WriteField("phone", "08123456789")
	writer1.WriteField("terms_accepted", "true")
	writer1.WriteField("whatsapp_number", "08123456789")
	writer1.WriteField("domicile_city", "Jakarta")
	writer1.WriteField("domicile_province", "DKI Jakarta")

	part1, _ := writer1.CreateFormFile("cv", "test_cv.pdf")
	part1.Write(fakePDFContent)
	writer1.Close()

	req1, _ := http.NewRequest("POST", "/api/v1/jobs/duplicate-test/apply", body1)
	req1.Header.Set("Content-Type", writer1.FormDataContentType())

	w1 := httptest.NewRecorder()
	router.ServeHTTP(w1, req1)
	assert.Equal(t, http.StatusCreated, w1.Code)

	// Try to apply again - should fail with 409
	body2 := &bytes.Buffer{}
	writer2 := multipart.NewWriter(body2)
	writer2.WriteField("name", "Test Candidate")
	writer2.WriteField("email", "test.candidate@example.com")
	writer2.WriteField("phone", "08123456789")
	writer2.WriteField("terms_accepted", "true")
	writer2.WriteField("whatsapp_number", "08123456789")
	writer2.WriteField("domicile_city", "Jakarta")
	writer2.WriteField("domicile_province", "DKI Jakarta")

	part2, _ := writer2.CreateFormFile("cv", "test_cv.pdf")
	part2.Write(fakePDFContent)
	writer2.Close()

	req2, _ := http.NewRequest("POST", "/api/v1/jobs/duplicate-test/apply", body2)
	req2.Header.Set("Content-Type", writer2.FormDataContentType())

	w2 := httptest.NewRecorder()
	router.ServeHTTP(w2, req2)

	// Should return conflict error
	assert.Equal(t, http.StatusConflict, w2.Code)

	var response2 map[string]interface{}
	json.Unmarshal(w2.Body.Bytes(), &response2)
	assert.Contains(t, response2["error"], "anda sudah melamar")
}

func TestPOST_JobsSlugApply_JobNotFound(t *testing.T) {
	db := GetTestDB()
	router := setupTestRouter(db)

	// Don't create job - should return 404
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	writer.WriteField("name", "Test Candidate")
	writer.WriteField("email", "test.candidate@example.com")
	writer.WriteField("phone", "08123456789")
	writer.WriteField("terms_accepted", "true")
	writer.WriteField("whatsapp_number", "08123456789")
	writer.WriteField("domicile_city", "Jakarta")
	writer.WriteField("domicile_province", "DKI Jakarta")

	part, _ := writer.CreateFormFile("cv", "test_cv.pdf")
	part.Write(fakePDFContent)
	writer.Close()

	req, _ := http.NewRequest("POST", "/api/v1/jobs/non-existent-job/apply", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return not found error
	assert.Equal(t, http.StatusNotFound, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Contains(t, response["error"], "tidak ditemukan")
}

func TestPOST_JobsSlugApply_JobArchived(t *testing.T) {
	db := GetTestDB()
	router := setupTestRouter(db)

	job := CreateTestJob(t, "Software Engineer", "archived-job-test", "published", db)
	job.IsArchived = true
	db.Save(&job)

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	writer.WriteField("name", "Test Candidate")
	writer.WriteField("email", "test.candidate@example.com")
	writer.WriteField("phone", "08123456789")
	writer.WriteField("terms_accepted", "true")
	writer.WriteField("whatsapp_number", "08123456789")
	writer.WriteField("domicile_city", "Jakarta")
	writer.WriteField("domicile_province", "DKI Jakarta")

	part, _ := writer.CreateFormFile("cv", "test_cv.pdf")
	part.Write(fakePDFContent)
	writer.Close()

	req, _ := http.NewRequest("POST", "/api/v1/jobs/archived-job-test/apply", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return not found because archived jobs are hidden
	assert.Equal(t, http.StatusNotFound, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Contains(t, response["error"], "tidak ditemukan")
}

func TestPOST_JobsSlugApply_MissingRequiredFields(t *testing.T) {
	db := GetTestDB()
	router := setupTestRouter(db)

	_ = CreateTestJob(t, "Software Engineer", "missing-fields-test", "published", db)

	// Missing email - should fail
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	writer.WriteField("name", "Test Candidate")
	// email not provided
	writer.WriteField("terms_accepted", "true")
	writer.WriteField("whatsapp_number", "08123456789")
	writer.WriteField("domicile_city", "Jakarta")
	writer.WriteField("domicile_province", "DKI Jakarta")

	part, _ := writer.CreateFormFile("cv", "test_cv.pdf")
	part.Write(fakePDFContent)
	writer.Close()

	req, _ := http.NewRequest("POST", "/api/v1/jobs/missing-fields-test/apply", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return validation error
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestPOST_JobsSlugApply_InvalidFileType(t *testing.T) {
	db := GetTestDB()
	router := setupTestRouter(db)

	_ = CreateTestJob(t, "Software Engineer", "invalid-file-type-test", "published", db)

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	writer.WriteField("name", "Test Candidate")
	writer.WriteField("email", "test.candidate@example.com")
	writer.WriteField("phone", "08123456789")
	writer.WriteField("terms_accepted", "true")
	writer.WriteField("whatsapp_number", "08123456789")
	writer.WriteField("domicile_city", "Jakarta")
	writer.WriteField("domicile_province", "DKI Jakarta")

	// Upload .exe file - should fail
	part, _ := writer.CreateFormFile("cv", "malicious.exe")
	part.Write([]byte("dummy exe content"))
	writer.Close()

	req, _ := http.NewRequest("POST", "/api/v1/jobs/invalid-file-type-test/apply", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return validation error
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Contains(t, response["error"], "invalid file extension")
}

func TestPOST_JobsSlugApply_FileTooLarge(t *testing.T) {
	db := GetTestDB()
	router := setupTestRouter(db)

	_ = CreateTestJob(t, "Software Engineer", "file-too-large-test", "published", db)

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	writer.WriteField("name", "Test Candidate")
	writer.WriteField("email", "test.candidate@example.com")
	writer.WriteField("phone", "08123456789")
	writer.WriteField("terms_accepted", "true")
	writer.WriteField("whatsapp_number", "08123456789")
	writer.WriteField("domicile_city", "Jakarta")
	writer.WriteField("domicile_province", "DKI Jakarta")

	// Upload file larger than 5MB - should fail
	part, _ := writer.CreateFormFile("cv", "large.pdf")
	largeData := make([]byte, 6*1024*1024) // 6MB
	for i := range largeData {
		largeData[i] = 'A'
	}
	part.Write(largeData)
	writer.Close()

	req, _ := http.NewRequest("POST", "/api/v1/jobs/file-too-large-test/apply", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return validation error
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Contains(t, response["error"], "invalid file type")
}

// setupTestRouter creates a minimal gin router for testing
func setupTestRouter(db *gorm.DB) *gin.Engine {
	r := gin.Default()

	logger := zap.NewNop()
	userRepo := repository.NewRepository(db)
	jobRepo := repository.NewJobRepository()
	
	appService := application.NewApplicationService(logger, jobRepo, userRepo)
	appHandler := handler.NewApplicationHandler(appService)

	r.POST("/api/v1/jobs/:slug/apply", appHandler.Apply)

	return r
}
