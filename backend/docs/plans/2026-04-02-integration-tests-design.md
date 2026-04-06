# Integration Tests & Final Polish Design

**Date:** 2026-04-02
**Status:** Design Complete
**Approach:** Testcontainers/Docker

---

## Context

Tasks 27-30 complete the MVP implementation by adding:
1. Integration tests for candidate apply flow (Task 27)
2. Integration tests for HR workflow (Task 28)
3. Test coverage verification (Task 29)
4. Final code review and cleanup (Task 30)

Integration tests use testcontainers to spin up isolated PostgreSQL instances for testing, ensuring database parity with production while maintaining test isolation.

---

## 1. Architecture

```
tests/integration/
├── setup.go                    # TestMain with testcontainers lifecycle
├── helpers.go                  # Common test utilities (HTTP, auth, seeding)
├── candidate_apply_test.go       # Task 27: Candidate flow tests
└── hr_workflow_test.go          # Task 28: HR workflow tests

└── integration/
    ├── db_setup.go              # Database initialization helpers
    ├── http_client.go           # HTTP request wrappers
    └── fixtures.go              # Test data seeding functions
```

**Test Lifecycle:**
```
TestMain(m)
    │
    ├─ Start PostgreSQL container (testcontainers)
    ├─ Get connection string from container
    ├─ Connect to test database (GORM)
    ├─ Run migrations
    │
    ├─ m.Run()  → Execute test suite
    │   ├─ Test 1: Setup → Request → Assert → Teardown
    │   ├─ Test 2: Setup → Request → Assert → Teardown
    │   └─ ...
    │
    ├─ Close database connection
    └─ Terminate container (cleanup)
```

---

## 2. Test Infrastructure Components

### 2.1 TestMain Setup (`tests/integration/setup.go`)

**Purpose:** Manages PostgreSQL container lifecycle for all integration tests.

**Responsibilities:**
- Start PostgreSQL container using testcontainers
- Configure GORM connection to test database
- Run migrations on test database
- Provide `GetTestDB()` helper for tests
- Clean up containers after test suite

**Key Functions:**
- `TestMain(m *testing.M)` - Main entry point
- `GetTestDB() *gorm.DB` - Returns test DB instance

### 2.2 HTTP Client Helper (`tests/integration/helpers.go`)

**Purpose:** Provides reusable HTTP request functions for integration tests.

**Responsibilities:**
- Create HTTP requests with proper headers
- Handle JSON serialization/deserialization
- Support JWT token authentication
- Provide response assertion helpers

**Key Functions:**
- `MakeRequest(method, url, body, token)` - Makes HTTP request
- `AssertErrorResponse(t, resp, code, error)` - Validates error responses
- `GenerateTestToken(user, roles)` - Creates JWT for test users

### 2.3 Test Fixtures (`tests/integration/fixtures.go`)

**Purpose:** Provides test data creation helpers.

**Responsibilities:**
- Create test users with specific roles
- Create test jobs with various states
- Seed test applications
- Cleanup functions for test isolation

**Key Functions:**
- `CreateTestUser(t, email, roles)` - Creates test user
- `CreateTestJob(t, status)` - Creates test job
- `CreateTestApplication(t, jobID, userID)` - Creates test application
- `CleanupTestData(db)` - Cleans up after test

---

## 3. Integration Test Structure

### 3.1 Candidate Apply Flow Tests (`candidate_apply_test.go`)

**Purpose:** Test complete application submission flow from candidate perspective.

**Test Cases:**

| Test | Scenario | Expected Status |
|-------|-------------|----------------|
| `TestPOST_JobsSlugApply_Success` | Valid application | 201 Created |
| `TestPOST_JobsSlugApply_TermsNotAccepted` | terms_accepted=false | 400 validation_failed |
| `TestPOST_JobsSlugApply_InvalidWhatsApp` | Invalid phone format | 400 validation_failed |
| `TestPOST_JobsSlugApply_DuplicateApplication` | Apply twice to same job | 409 already_applied |
| `TestPOST_JobsSlugApply_JobNotFound` | Non-existent job slug | 404 not_found |
| `TestPOST_JobsSlugApply_JobArchived` | Apply to archived job | 400 job_closed |
| `TestPOST_JobsSlugApply_InvalidFileType` | Upload .exe file | 400 validation_failed |
| `TestPOST_JobsSlugApply_FileTooLarge` | CV > 5MB | 400 validation_failed |
| `TestPOST_JobsSlugApply_MissingFields` | Missing required field | 400 validation_failed |

### 3.2 HR Workflow Tests (`hr_workflow_test.go`)

**Purpose:** Test HR management flow including authentication, authorization, and operations.

**Test Cases:**

| Test | Scenario | Expected Status |
|-------|-------------|----------------|
| `TestGET_HrApplications_WithAuth` | Valid HR token | 200 OK |
| `TestGET_HrApplications_NoAuth` | Missing token | 401 Unauthorized |
| `TestGET_HrApplications_WrongRole` | Candidate token | 403 Forbidden |
| `TestGET_HrApplications_Pagination` | Page/limit params | 200 with pagination |
| `TestGET_HrApplications_FilterByStatus` | Status query param | 200 filtered results |
| `TestPATCH_HrApplications_UpdateStatus` | Valid status update | 200 OK |
| `TestPATCH_HrApplications_InvalidStatus` | Invalid status string | 400 validation_failed |
| `TestGET_HrActiveVacancies_Success` | HR requests active jobs | 200 OK |
| `TestGET_HrActiveVacancies_OnlyPublished` | Filter by published/archived | 200 filtered results |

---

## 4. Error Handling in Tests

### Test Error Response Format

```go
type TestError struct {
    Error   string `json:"error"`
    Message string `json:"message,omitempty"`
    Field   string `json:"field,omitempty"`
}
```

### Error Assertions

Tests verify error responses match expected format:

```go
func AssertErrorResponse(t *testing.T, resp *http.Response, expectedCode int, expectedError string) {
    assert.Equal(t, expectedCode, resp.StatusCode)

    var errResp map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&errResp)

    assert.Contains(t, errResp, "error")
    assert.Equal(t, expectedError, errResp["error"])
}
```

---

## 5. Dependencies

### Go Modules to Add

```go
require (
    // Existing
    github.com/gin-gonic/gin
    gorm.io/gorm
    gorm.io/driver/postgres

    // New for testcontainers
    github.com/testcontainers/testcontainers-go v0.29.0
    github.com/testcontainers/testcontainers-go/modules/postgres v0.29.0
)
```

### System Requirements

- Docker installed and running
- PostgreSQL 16 image accessible (testcontainers handles this)
- Go 1.21+

---

## 6. Build Tags

### Purpose

Separate integration tests from unit tests to avoid:
- Running integration tests during normal `go test ./...`
- Requiring testcontainers for unit test execution
- Slowing down CI/CD pipelines

### Usage

```bash
# Unit tests only (default)
go test ./...

# Integration tests only
go test ./tests/integration/... -tags=integration -v

# All tests (unit + integration)
go test ./... -tags=integration -v
```

### File Tags

Each integration test file will include:
```go
//go:build integration
// +build integration
package integration
```

---

## 7. Test Coverage (Task 29)

### Coverage Targets

From original design document:

| Component | Target | Priority |
|-----------|---------|----------|
| Application service | 80% | High |
| Middleware (auth, role) | 80% | High |
| Handlers (HR, admin) | 70% | Medium |
| Repository layer | 70% | Medium |
| Overall MVP | **65%** | Minimum |

### Coverage Commands

```bash
# Generate coverage report
go test ./... -coverprofile=coverage.out -tags=integration

# View coverage percentage
go tool cover -func=coverage.out | grep total

# Generate HTML report
go tool cover -html=coverage.out -o coverage.html

# View HTML report (browser)
open coverage.html
```

### Coverage Report Template

```markdown
# Test Coverage Report

## Current Coverage: XX%

## Coverage by Module

| Module | Coverage | Status |
|--------|----------|--------|
| application/ | XX% | ✅/❌ |
| middleware/ | XX% | ✅/❌ |
| handlers/ | XX% | ✅/❌ |
| repository/ | XX% | ✅/❌ |

## Target: 65% minimum for MVP
```

---

## 8. Final Code Review (Task 30)

### TODO Comments Found

| File | Line | TODO | Priority |
|-------|-------|-------|----------|
| `internal/handlers/hr_application_handler.go` | 123 | Add GetApplicationByID to service | Low |
| `internal/middleware/auth.go` | 66,72,78,84 | Remove after migrating to HasRole | Medium |
| `internal/util/jwt.go` | 59 | Remove after migrating to roles array | Medium |

### Code Quality Checks

```bash
# Run linter
golangci-lint run ./...

# Run go vet
go vet ./...

# Run go mod tidy
go mod tidy

# Build production binary
go build -o bin/api ./cmd/api

# Test production binary
./bin/api --help
```

---

## 9. Implementation Order

1. **Task 27** - Create `candidate_apply_test.go` with test cases
2. **Task 28** - Create `hr_workflow_test.go` with test cases
3. **Task 29** - Add test dependencies, run coverage, generate reports
4. **Task 30** - Address TODOs, run linters, final build verification

---

## Summary

This design implements **Tasks 27-30** using **Testcontainers/Docker** approach:

1. **Testcontainers** for isolated PostgreSQL instances
2. **TestMain** for automatic container lifecycle management
3. **Build tags** to separate integration from unit tests
4. **Comprehensive test coverage** including happy path and error cases
5. **Coverage reporting** with 65% minimum target
6. **Final code review** addressing TODO comments and quality checks

**Key Files:**
- `tests/integration/setup.go` - Container lifecycle
- `tests/integration/helpers.go` - HTTP helpers
- `tests/integration/candidate_apply_test.go` - Candidate tests
- `tests/integration/hr_workflow_test.go` - HR tests
- Coverage reports and documentation
