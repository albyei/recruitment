//go:build integration

package integration

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"wowrack-recruitment/internal/model"
	"wowrack-recruitment/internal/util"
	"gorm.io/gorm"
)

// MakeRequest creates an HTTP request with proper headers
// It supports optional JWT token authentication
func MakeRequest(method, url string, body []byte, token string) (*http.Response, error) {
	req, err := http.NewRequest(method, url, bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	return client.Do(req)
}

// MakeRequestToRouter makes a request directly to a gin router
// Useful for testing without starting a full HTTP server
func MakeRequestToRouter(router *gin.Engine, method, url string, body []byte, token string) *httptest.ResponseRecorder {
	req, err := http.NewRequest(method, url, bytes.NewBuffer(body))
	if err != nil {
		w := httptest.NewRecorder()
		return w
	}

	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	return w
}

// AssertErrorResponse validates that response matches expected error format
func AssertErrorResponse(t testing.TB, w *httptest.ResponseRecorder, expectedCode int, expectedError string) {
	if w.Code != expectedCode {
		t.Errorf("Expected status code %d, got %d", expectedCode, w.Code)
	}

	var errResp map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &errResp); err != nil {
		t.Errorf("Failed to parse error response: %v", err)
		return
	}

	if _, ok := errResp["error"]; !ok {
		t.Errorf("Response missing 'error' field: %v", errResp)
		return
	}

	actualError, _ := errResp["error"].(string)
	if actualError != expectedError {
		t.Errorf("Expected error code '%s', got '%s'", expectedError, actualError)
	}
}

// GenerateTestToken creates a JWT token for a test user
func GenerateTestToken(t testing.TB, user *model.User) string {
	token, err := util.GenerateToken(user.ID, user.Email, []string{user.Role})
	if err != nil {
		t.Fatalf("Failed to generate test token: %v", err)
	}
	return token
}

// CreateTestUser creates a test user with specified email and role
func CreateTestUser(t testing.TB, email, role string, db *gorm.DB) *model.User {
	// For testing, generate a simple hashed password
	hashedPassword := []byte("$2a$10$N9qo8uLOickgx2ZMRzoRex9e3jFjY/")

	user := &model.User{
		Name:     "Test " + role,
		Email:    email,
		Password:  string(hashedPassword),
		Role:     role,
	}

	if err := db.Create(user).Error; err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	// For multi-role, add to user_roles table
	if role != "" {
		userRole := &model.UserRole{
			UserID: user.ID,
			Role:   role,
		}
		if err := db.Create(userRole).Error; err != nil {
			t.Fatalf("Failed to create user role: %v", err)
		}
	}

	return user
}

// CreateTestJob creates a test job with specified status
func CreateTestJob(t testing.TB, title, slug, status string, db *gorm.DB) *model.Job {
	job := &model.Job{
		Title:        title,
		Slug:         slug,
		Requirements: "Go, PostgreSQL, Docker",
		Location:     "Jakarta",
		Status:       model.JobStatus(status),
	}

	if err := db.Create(job).Error; err != nil {
		t.Fatalf("Failed to create test job: %v", err)
	}

	return job
}

// CreateTestApplication creates a test application with specified job ID, candidate ID, and status
func CreateTestApplication(t testing.TB, jobID, candidateID uint, status model.ApplicationStatus, db *gorm.DB) *model.Application {
	app := &model.Application{
		CandidateID: candidateID,
		JobID:       jobID,
		Status:      model.ApplicationStatus(status),
		AppliedAt:   time.Now(),
		CVFilename:  "test_cv.pdf",
		CVURL:       "https://example.com/test_cv.pdf",
	}

	if err := db.Create(app).Error; err != nil {
		t.Fatalf("Failed to create test application: %v", err)
	}

	return app
}

// CleanupTestData cleans up all test data
func CleanupTestData(db *gorm.DB) {
	// Clean in order to respect foreign key constraints
	db.Delete(&model.Application{})
	db.Delete(&model.Job{})
	db.Delete(&model.UserRole{})
	db.Delete(&model.User{})
}
