//go:build integration

package integration

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
	"gorm.io/gorm"

	handler "wowrack-recruitment/internal/handlers"
	"wowrack-recruitment/internal/middleware"
	"wowrack-recruitment/internal/model"
	"wowrack-recruitment/internal/repository"
	"wowrack-recruitment/internal/service"
	"wowrack-recruitment/internal/service/application"
)

func TestGET_HrApplications_WithAuth(t *testing.T) {
	db := GetTestDB()
	router := setupHRRouter(db)

	// Create HR user and login
	hrUser := CreateTestUser(t, "hr@wowrack.com", "hr", db)
	token := GenerateTestToken(t, hrUser)

	// Create test applications
	for i := 0; i < 3; i++ {
		app := &model.Application{
			CandidateID: hrUser.ID,
			JobID:  uint(i + 1),
			Status:  model.AppApplied,
		}
		db.Create(&app)
	}

	// Make request with token
	reqBody, _ := json.Marshal(map[string]interface{}{})
	req, _ := http.NewRequest("GET", "/api/v1/hr/applications", bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return 200 with applications list
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	applications, ok := response["applications"].([]interface{})
	assert.True(t, ok)
	assert.Len(t, applications, 3)
}

func TestGET_HrApplications_NoAuth(t *testing.T) {
	db := GetTestDB()
	router := setupHRRouter(db)

	// Create test applications
	hrUser := CreateTestUser(t, "hr@wowrack.com", "hr", db)
	for i := 0; i < 3; i++ {
		app := &model.Application{
			CandidateID: hrUser.ID,
			JobID:  uint(i + 1),
			Status:  model.AppApplied,
		}
		db.Create(&app)
	}

	// Request without token
	req, _ := http.NewRequest("GET", "/api/v1/hr/applications", nil)
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return 401 unauthorized
	AssertErrorResponse(t, w, http.StatusUnauthorized, "unauthorized")
}

func TestGET_HrApplications_WrongRole(t *testing.T) {
	db := GetTestDB()
	router := setupHRRouter(db)

	// Create test applications
	hrUser := CreateTestUser(t, "hr@wowrack.com", "hr", db)
	for i := 0; i < 3; i++ {
		app := &model.Application{
			CandidateID: hrUser.ID,
			JobID:  uint(i + 1),
			Status:  model.AppApplied,
		}
		db.Create(&app)
	}

	// Create candidate user (wrong role)
	candidate := CreateTestUser(t, "candidate@wowrack.com", "candidate", db)
	token := GenerateTestToken(t, candidate)

	// Request with candidate token
	reqBody, _ := json.Marshal(map[string]interface{}{})
	req, _ := http.NewRequest("GET", "/api/v1/hr/applications", bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return 403 forbidden
	AssertErrorResponse(t, w, http.StatusForbidden, "forbidden")
}

func TestGET_HrApplications_FilterByStatus(t *testing.T) {
	db := GetTestDB()
	router := setupHRRouter(db)

	// Create HR user
	hrUser := CreateTestUser(t, "hr@wowrack.com", "hr", db)
	token := GenerateTestToken(t, hrUser)

	// Create test applications with different statuses
	for i := 0; i < 3; i++ {
		var status model.ApplicationStatus
		if i == 1 {
			status = model.AppScreening
		} else if i == 2 {
			status = model.AppRejected
		} else {
			status = model.AppApplied
		}
		app := &model.Application{
			CandidateID: hrUser.ID,
			JobID:  uint(i + 1),
			Status:  status,
		}
		db.Create(&app)
	}

	// Request with status filter
	req, _ := http.NewRequest("GET", "/api/v1/hr/applications?status=selected", nil)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return 200 with filtered results
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	applications, ok := response["applications"].([]interface{})
	assert.True(t, ok)
	assert.Len(t, applications, 1)
}

func TestGET_HrApplications_Pagination(t *testing.T) {
	db := GetTestDB()
	router := setupHRRouter(db)

	// Create HR user
	hrUser := CreateTestUser(t, "hr@wowrack.com", "hr", db)
	token := GenerateTestToken(t, hrUser)

	// Create 15 test applications
	for i := 0; i < 15; i++ {
		app := &model.Application{
			CandidateID: hrUser.ID,
			JobID:  uint(i + 1),
			Status:  model.AppApplied,
		}
		db.Create(&app)
	}

	// Request first page with limit of 10
	req1, _ := http.NewRequest("GET", "/api/v1/hr/applications?page=1&limit=10", nil)
	req1.Header.Set("Content-Type", "application/json")
	req1.Header.Set("Authorization", "Bearer "+token)

	w1 := httptest.NewRecorder()
	router.ServeHTTP(w1, req1)

	// Should return 200 with 10 applications
	assert.Equal(t, http.StatusOK, w1.Code)

	var response1 map[string]interface{}
	json.Unmarshal(w1.Body.Bytes(), &response1)
	applications1, ok := response1["applications"].([]interface{})
	assert.True(t, ok)
	assert.Len(t, applications1, 10)

	// Request second page with limit of 10
	req2, _ := http.NewRequest("GET", "/api/v1/hr/applications?page=2&limit=10", nil)
	req2.Header.Set("Content-Type", "application/json")
	req2.Header.Set("Authorization", "Bearer "+token)

	w2 := httptest.NewRecorder()
	router.ServeHTTP(w2, req2)

	// Should return 200 with 5 applications
	assert.Equal(t, http.StatusOK, w2.Code)

	var response2 map[string]interface{}
	json.Unmarshal(w2.Body.Bytes(), &response2)
	applications2, ok := response2["applications"].([]interface{})
	assert.True(t, ok)
	assert.Len(t, applications2, 5)
}

func TestGET_HrActiveVacancies_Success(t *testing.T) {
	db := GetTestDB()
	router := setupHRRouter(db)

	// Create test job
	_ = CreateTestJob(t, "Software Engineer", "active-job", "published", db)

	// Create HR user
	hrUser := CreateTestUser(t, "hr@wowrack.com", "hr", db)
	token := GenerateTestToken(t, hrUser)

	// Request with token
	req, _ := http.NewRequest("GET", "/api/v1/hr/active-vacancies", nil)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return 200 with vacancies list
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	vacancies, ok := response["vacancies"].([]interface{})
	assert.True(t, ok)
	assert.Len(t, vacancies, 1)
}

func TestGET_HrActiveVacancies_OnlyPublished(t *testing.T) {
	db := GetTestDB()
	router := setupHRRouter(db)

	// Create published job
	_ = CreateTestJob(t, "Software Engineer", "published-job", "published", db)

	// Create archived job (should not appear in results)
	archivedJob := CreateTestJob(t, "Archived Job", "archived-job", "published", db)
	archivedJob.IsArchived = true
	db.Save(&archivedJob)

	// Create HR user
	hrUser := CreateTestUser(t, "hr@wowrack.com", "hr", db)
	token := GenerateTestToken(t, hrUser)

	// Request with token
	req, _ := http.NewRequest("GET", "/api/v1/hr/active-vacancies", nil)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return 200 with only published jobs
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	vacancies, ok := response["vacancies"].([]interface{})
	assert.True(t, ok)
	assert.Len(t, vacancies, 1)
}

func TestPATCH_HrApplications_UpdateStatus(t *testing.T) {
	db := GetTestDB()
	router := setupHRRouter(db)

	// Create HR user
	hrUser := CreateTestUser(t, "hr@wowrack.com", "hr", db)
	token := GenerateTestToken(t, hrUser)

	// Create test application
	_ = CreateTestApplication(t, 1, hrUser.ID, model.AppApplied, db)

	// Prepare status update request
	updateReq := map[string]string{
		"status": string(model.AppScreening),
	}
	reqBody, _ := json.Marshal(updateReq)
	req, _ := http.NewRequest("PATCH", "/api/v1/hr/applications/1/status", bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return 200 with success message
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "message", response["message"])
}

func TestPATCH_HrApplications_InvalidStatus(t *testing.T) {
	db := GetTestDB()
	router := setupHRRouter(db)

	// Create HR user
	hrUser := CreateTestUser(t, "hr@wowrack.com", "hr", db)
	token := GenerateTestToken(t, hrUser)

	// Create test application
	_ = CreateTestApplication(t, 1, hrUser.ID, model.AppApplied, db)

	// Prepare invalid status update request
	updateReq := map[string]string{
		"status": "invalid_status",
	}
	reqBody, _ := json.Marshal(updateReq)
	req, _ := http.NewRequest("PATCH", "/api/v1/hr/applications/1/status", bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return 400 validation error
	AssertErrorResponse(t, w, http.StatusBadRequest, "validation_failed")
}

// setupHRRouter creates a minimal gin router for testing
func setupHRRouter(db *gorm.DB) *gin.Engine {
	r := gin.Default()

	logger := zap.NewNop()
	userRepo := repository.NewRepository(db)
	jobRepo := repository.NewJobRepository()
	jobService := service.NewJobService(jobRepo)
	appService := application.NewApplicationService(logger, jobRepo, userRepo)
	hrHandler := handler.NewHRApplicationHandler(appService, jobService)

	// Attach necessary middlewares for auth & roles
	r.Use(middleware.AuthMiddleware())

	hr := r.Group("/api/v1/hr")
	hr.Use(middleware.HasRole("hr"))
	{
		hr.GET("/applications", hrHandler.GetAllApplications)
		hr.GET("/applications/:id", hrHandler.GetApplicationByID)
		hr.GET("/jobs/:id/applications", hrHandler.GetApplicationsByJob)
		hr.PATCH("/applications/:id/status", hrHandler.UpdateStatus)

		hr.GET("/active-vacancies", hrHandler.GetActiveVacancies)
		hr.GET("/active-vacancies/:id", hrHandler.GetActiveVacancyByID)
	}

	return r
}
