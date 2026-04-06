# Recruitment MVP - Vertical Slice Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a 4-week MVP of the recruitment system with multi-role authentication, candidate application flow, HR management, and active vacancies.

**Architecture:** Vertical slice approach - build complete end-to-end user journeys (Candidate → HR → Active Vacancies → Polish) using Go/Gin API, GORM, PostgreSQL, and MinIO.

**Tech Stack:** Go 1.21, Gin framework, GORM ORM, PostgreSQL, MinIO, JWT authentication, Docker.

---

## Week 1: Foundation - Multi-Role Authentication

### Task 1: Create user_roles junction table migration

**Files:**
- Create: `migrations/20260331_001_create_user_roles.up.sql`
- Create: `migrations/20260331_001_create_user_roles.down.sql`

**Step 1: Create up migration file**

Create `migrations/20260331_001_create_user_roles.up.sql`:
```sql
-- Create user_roles junction table for multi-role support
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Create index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Backfill existing users to user_roles table
INSERT INTO user_roles (user_id, role, created_at)
SELECT id, role, created_at FROM users WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;
```

**Step 2: Create down migration file**

Create `migrations/20260331_001_create_user_roles.down.sql`:
```sql
-- Drop user_roles table
DROP INDEX IF EXISTS idx_user_roles_role;
DROP INDEX IF EXISTS idx_user_roles_user_id;
DROP TABLE IF EXISTS user_roles;
```

**Step 3: Run up migration**

Run: `go run cmd/migrate/main.go up`
Expected: "Migration 20260331_001_create_user_roles executed successfully"

**Step 4: Verify migration**

Run: `psql $DATABASE_URL -c "\d user_roles"`
Expected: Table exists with columns: id, user_id, role, created_at

**Step 5: Commit**

```bash
git add migrations/20260331_001_create_user_roles.up.sql migrations/20260331_001_create_user_roles.down.sql
git commit -m "feat(migration): add user_roles junction table for multi-role support"
```

---

### Task 2: Update User model for multi-role

**Files:**
- Modify: `internal/models/user.go`

**Step 1: Read current user model**

Run: `cat internal/models/user.go`
Expected: See current User struct with single role field

**Step 2: Add UserRole model and update User struct**

Modify `internal/models/user.go`:
```go
package models

import (
	"time"

	"gorm.io/gorm"
)

// UserRole represents the junction table for user roles
type UserRole struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;index" json:"user_id"`
	Role      string    `gorm:"not null;size:20;index" json:"role"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	User      *User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// User represents a user in the system
type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Email     string         `gorm:"uniqueIndex;size:255;not null" json:"email"`
	Password  string         `gorm:"size:255;not null" json:"-"`
	Name      string         `gorm:"size:255" json:"name"`
	Role      string         `gorm:"size:20" json:"role"` // Keep for backwards compatibility during migration
	IsActive  bool           `gorm:"default:true" json:"is_active"`
	Roles     []UserRole     `gorm:"foreignKey:UserID" json:"roles,omitempty"`
	CreatedAt time.Time      `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time      `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}
```

**Step 3: Run build to verify**

Run: `go build ./...`
Expected: No errors

**Step 4: Commit**

```bash
git add internal/models/user.go
git commit -m "feat(model): update User model for multi-role support"
```

---

### Task 3: Add application form fields migration

**Files:**
- Create: `migrations/20260331_002_add_application_fields.up.sql`
- Create: `migrations/20260331_002_add_application_fields.down.sql`

**Step 1: Create up migration file**

Create `migrations/20260331_002_add_application_fields.up.sql`:
```sql
-- Add new fields to applications table for MVP
ALTER TABLE applications ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS domicile_city VARCHAR(100);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS domicile_province VARCHAR(100);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS last_work_role VARCHAR(100);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS last_work_company VARCHAR(100);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS last_work_from DATE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS last_work_to DATE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS university VARCHAR(200);
```

**Step 2: Create down migration file**

Create `migrations/20260331_002_add_application_fields.down.sql`:
```sql
-- Rollback application fields
ALTER TABLE applications DROP COLUMN IF EXISTS terms_accepted;
ALTER TABLE applications DROP COLUMN IF EXISTS whatsapp_number;
ALTER TABLE applications DROP COLUMN IF EXISTS domicile_city;
ALTER TABLE applications DROP COLUMN IF EXISTS domicile_province;
ALTER TABLE applications DROP COLUMN IF EXISTS last_work_role;
ALTER TABLE applications DROP COLUMN IF EXISTS last_work_company;
ALTER TABLE applications DROP COLUMN IF EXISTS last_work_from;
ALTER TABLE applications DROP COLUMN IF EXISTS last_work_to;
ALTER TABLE applications DROP COLUMN IF EXISTS university;
```

**Step 3: Run up migration**

Run: `go run cmd/migrate/main.go up`
Expected: "Migration 20260331_002_add_application_fields executed successfully"

**Step 4: Verify migration**

Run: `psql $DATABASE_URL -c "\d applications" | grep -E "(terms_accepted|whatsapp|domicile|last_work|university)"`
Expected: All new columns exist

**Step 5: Commit**

```bash
git add migrations/20260331_002_add_application_fields.up.sql migrations/20260331_002_add_application_fields.down.sql
git commit -m "feat(migration): add application form fields for MVP"
```

---

### Task 4: Add job fields migration

**Files:**
- Create: `migrations/20260331_003_add_job_fields.up.sql`
- Create: `migrations/20260331_003_add_job_fields.down.sql`

**Step 1: Create up migration file**

Create `migrations/20260331_003_add_job_fields.up.sql`:
```sql
-- Add new fields to jobs table for MVP
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS date_needed DATE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS special_needs TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS benefits TEXT;

-- Add index for archived jobs query
CREATE INDEX IF NOT EXISTS idx_jobs_archived ON jobs(is_archived) WHERE is_archived = false;
```

**Step 2: Create down migration file**

Create `migrations/20260331_003_add_job_fields.down.sql`:
```sql
-- Rollback job fields
DROP INDEX IF EXISTS idx_jobs_archived;
ALTER TABLE jobs DROP COLUMN IF EXISTS benefits;
ALTER TABLE jobs DROP COLUMN IF EXISTS is_archived;
ALTER TABLE jobs DROP COLUMN IF EXISTS special_needs;
ALTER TABLE jobs DROP COLUMN IF EXISTS date_needed;
```

**Step 3: Run up migration**

Run: `go run cmd/migrate/main.go up`
Expected: "Migration 20260331_003_add_job_fields executed successfully"

**Step 4: Verify migration**

Run: `psql $DATABASE_URL -c "\d jobs" | grep -E "(date_needed|special_needs|is_archived|benefits)"`
Expected: All new columns exist

**Step 5: Commit**

```bash
git add migrations/20260331_003_add_job_fields.up.sql migrations/20260331_003_add_job_fields.down.sql
git commit -m "feat(migration): add job fields for MVP"
```

---

### Task 5: Update Application model with new fields

**Files:**
- Modify: `internal/models/application.go`

**Step 1: Read current application model**

Run: `cat internal/models/application.go`
Expected: See current Application struct

**Step 2: Add new fields to Application struct**

Modify `internal/models/application.go`:
```go
// Application represents a job application
type Application struct {
	ID               uint      `gorm:"primaryKey" json:"id"`
	UserID           uint      `gorm:"not null;index" json:"user_id"`
	JobID            uint      `gorm:"not null;index" json:"job_id"`
	Status           string    `gorm:"size:50;default:'applied'" json:"status"`
	AIAnalysisScore  *int      `json:"ai_analysis_score,omitempty"` // Hidden from candidates

	// New MVP fields
	TermsAccepted    bool      `gorm:"default:false" json:"terms_accepted"`
	WhatsAppNumber   string    `gorm:"size:20" json:"whatsapp_number"`
	DomicileCity     string    `gorm:"size:100" json:"domicile_city"`
	DomicileProvince string    `gorm:"size:100" json:"domicile_province"`
	LastWorkRole     string    `gorm:"size:100" json:"last_work_role,omitempty"`
	LastWorkCompany  string    `gorm:"size:100" json:"last_work_company,omitempty"`
	LastWorkFrom     *time.Time `json:"last_work_from,omitempty"`
	LastWorkTo       *time.Time `json:"last_work_to,omitempty"`
	University       string    `gorm:"size:200" json:"university,omitempty"`

	// Existing fields (keep these)
	CVPath           string    `gorm:"size:500" json:"cv_path"`
	PhotoPath        string    `gorm:"size:500" json:"photo_path"`
	Notes            string    `gorm:"type:text" json:"notes,omitempty"`
	CreatedAt        time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt        time.Time `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	// Relations
	User             *User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Job              *Job      `gorm:"foreignKey:JobID" json:"job,omitempty"`
}
```

**Step 3: Run build to verify**

Run: `go build ./...`
Expected: No errors

**Step 4: Commit**

```bash
git add internal/models/application.go
git commit -m "feat(model): add MVP fields to Application model"
```

---

### Task 6: Update Job model with new fields

**Files:**
- Modify: `internal/models/job.go`

**Step 1: Read current job model**

Run: `cat internal/models/job.go`
Expected: See current Job struct

**Step 2: Add new fields to Job struct**

Modify `internal/models/job.go`:
```go
// Job represents a job opening
type Job struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	Title           string    `gorm:"size:255;not null" json:"title"`
	Description     string    `gorm:"type:text;not null" json:"description"`
	Requirements    string    `gorm:"type:text" json:"requirements,omitempty"`
	DepartmentID    uint      `gorm:"not null;index" json:"department_id"`
	Location        string    `gorm:"size:255" json:"location"`
	SalaryMin       float64   `gorm:"type:decimal(12,2)" json:"salary_min"`
	SalaryMax       float64   `gorm:"type:decimal(12,2)" json:"salary_max"`
	Status          string    `gorm:"size:50;default:'draft'" json:"status"` // draft, published, closed
	Slug            string    `gorm:"size:100;uniqueIndex;not null" json:"slug"`
	Deadline        *time.Time `json:"deadline,omitempty"`

	// New MVP fields
	DateNeeded      *time.Time `json:"date_needed,omitempty"`
	SpecialNeeds    string     `gorm:"type:text" json:"special_needs,omitempty"`
	IsArchived      bool       `gorm:"default:false" json:"is_archived"`
	Benefits        string     `gorm:"type:text" json:"benefits,omitempty"`

	CreatedAt       time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt       time.Time `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	// Relations
	Department      *Department `gorm:"foreignKey:DepartmentID" json:"department,omitempty"`
	Applications    []Application `gorm:"foreignKey:JobID" json:"applications,omitempty"`
}
```

**Step 3: Run build to verify**

Run: `go build ./...`
Expected: No errors

**Step 4: Commit**

```bash
git add internal/models/job.go
git commit -m "feat(model): add MVP fields to Job model"
```

---

### Task 7: Update JWT Claims to support roles array

**Files:**
- Modify: `internal/util/jwt.go`

**Step 1: Read current JWT utility**

Run: `cat internal/util/jwt.go`
Expected: See current JWT implementation

**Step 2: Update Claims struct and GenerateToken function**

Modify `internal/util/jwt.go`:
```go
package util

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Claims represents JWT claims with multi-role support
type Claims struct {
	UserID uint     `json:"user_id"`
	Email  string   `json:"email"`
	Roles  []string `json:"roles"` // Changed from single role to array
	jwt.RegisteredClaims
}

// GenerateToken generates a JWT token for a user
func GenerateToken(userID uint, email string, roles []string, secret string) (string, error) {
	claims := Claims{
		UserID: userID,
		Email:  email,
		Roles:  roles,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "wowrack-recruitment",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// ValidateToken validates a JWT token and returns the claims
func ValidateToken(tokenString, secret string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}
```

**Step 3: Run build to verify**

Run: `go build ./...`
Expected: No errors

**Step 4: Commit**

```bash
git add internal/util/jwt.go
git commit -m "feat(jwt): update claims to support multi-role array"
```

---

### Task 8: Update AuthService to use multi-role

**Files:**
- Modify: `internal/service/auth_service.go`

**Step 1: Read current auth service**

Run: `cat internal/service/auth_service.go`
Expected: See current auth service implementation

**Step 2: Update Login function to fetch and return roles**

Modify `internal/service/auth_service.go`:
```go
package service

import (
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"
	"wowrack-recruitment/internal/models"
	"wowrack-recruitment/internal/repository"
	"wowrack-recruitment/internal/util"
)

// AuthService handles authentication operations
type AuthService struct {
	userRepo       repository.UserRepository
	userRoleRepo   repository.UserRoleRepository
	jwtSecret      string
}

// NewAuthService creates a new AuthService
func NewAuthService(userRepo repository.UserRepository, userRoleRepo repository.UserRoleRepository, jwtSecret string) *AuthService {
	return &AuthService{
		userRepo:     userRepo,
		userRoleRepo: userRoleRepo,
		jwtSecret:    jwtSecret,
	}
}

// LoginRequest represents login request
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse represents login response
type LoginResponse struct {
	Token string       `json:"token"`
	User  LoginUserDTO `json:"user"`
}

// LoginUserDTO represents user data in login response
type LoginUserDTO struct {
	ID    uint     `json:"id"`
	Email string   `json:"email"`
	Name  string   `json:"name"`
	Roles []string `json:"roles"`
}

// Login authenticates a user and returns a token
func (s *AuthService) Login(req LoginRequest) (*LoginResponse, error) {
	user, err := s.userRepo.FindByEmail(req.Email)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	if !user.IsActive {
		return nil, errors.New("account is inactive")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	// Fetch user roles from user_roles table
	roles, err := s.userRoleRepo.FindByUserID(user.ID)
	if err != nil {
		return nil, errors.New("failed to fetch user roles")
	}

	if len(roles) == 0 {
		return nil, errors.New("user has no assigned roles")
	}

	roleNames := make([]string, len(roles))
	for i, r := range roles {
		roleNames[i] = r.Role
	}

	token, err := util.GenerateToken(user.ID, user.Email, roleNames, s.jwtSecret)
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	return &LoginResponse{
		Token: token,
		User: LoginUserDTO{
			ID:    user.ID,
			Email: user.Email,
			Name:  user.Name,
			Roles: roleNames,
		},
	}, nil
}

// GetUserFromClaims extracts user from JWT claims
func (s *AuthService) GetUserFromClaims(claims *util.Claims) (*models.User, error) {
	return s.userRepo.FindByID(claims.UserID)
}
```

**Step 3: Create UserRoleRepository interface and implementation**

**Step 3a: Add to repository interface**

Create or modify `internal/repository/user_role_repository.go`:
```go
package repository

import (
	"wowrack-recruitment/internal/models"

	"gorm.io/gorm"
)

// UserRoleRepository defines operations for user roles
type UserRoleRepository interface {
	FindByUserID(userID uint) ([]models.UserRole, error)
	Create(userRole *models.UserRole) error
	Delete(userID uint, role string) error
	DeleteAll(userID uint) error
}

// userRoleRepository implements UserRoleRepository
type userRoleRepository struct {
	db *gorm.DB
}

// NewUserRoleRepository creates a new UserRoleRepository
func NewUserRoleRepository(db *gorm.DB) UserRoleRepository {
	return &userRoleRepository{db: db}
}

// FindByUserID finds all roles for a user
func (r *userRoleRepository) FindByUserID(userID uint) ([]models.UserRole, error) {
	var roles []models.UserRole
	err := r.db.Where("user_id = ?", userID).Find(&roles).Error
	return roles, err
}

// Create creates a new user role
func (r *userRoleRepository) Create(userRole *models.UserRole) error {
	return r.db.Create(userRole).Error
}

// Delete removes a specific role from a user
func (r *userRoleRepository) Delete(userID uint, role string) error {
	return r.db.Where("user_id = ? AND role = ?", userID, role).Delete(&models.UserRole{}).Error
}

// DeleteAll removes all roles from a user
func (r *userRoleRepository) DeleteAll(userID uint) error {
	return r.db.Where("user_id = ?", userID).Delete(&models.UserRole{}).Error
}
```

**Step 4: Run build to verify**

Run: `go build ./...`
Expected: No errors

**Step 5: Commit**

```bash
git add internal/service/auth_service.go internal/repository/user_role_repository.go
git commit -m "feat(auth): update service to use multi-role from user_roles table"
```

---

### Task 9: Create Auth middleware with multi-role support

**Files:**
- Create: `internal/middleware/auth.go`

**Step 1: Create Auth middleware**

Create `internal/middleware/auth.go`:
```go
package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"wowrack-recruitment/internal/util"
)

// AuthMiddleware validates JWT token and sets user context
func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing authorization header"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := util.ValidateToken(tokenString, jwtSecret)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			c.Abort()
			return
		}

		// Set claims in context
		c.Set("user_id", claims.UserID)
		c.Set("email", claims.Email)
		c.Set("roles", claims.Roles)

		c.Next()
	}
}

// GetUserID extracts user ID from context
func GetUserID(c *gin.Context) uint {
	if userID, exists := c.Get("user_id"); exists {
		return userID.(uint)
	}
	return 0
}

// GetEmail extracts email from context
func GetEmail(c *gin.Context) string {
	if email, exists := c.Get("email"); exists {
		return email.(string)
	}
	return ""
}

// GetRoles extracts roles from context
func GetRoles(c *gin.Context) []string {
	if roles, exists := c.Get("roles"); exists {
		return roles.([]string)
	}
	return []string{}
}
```

**Step 2: Create Role middleware**

Create `internal/middleware/role.go`:
```go
package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// HasRole checks if user has the specific role
func HasRole(role string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roles := GetRoles(c)
		for _, r := range roles {
			if r == role {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden", "message": "role '" + role + "' required"})
		c.Abort()
	}
}

// HasAnyRole checks if user has any of the specified roles
func HasAnyRole(allowedRoles []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roles := GetRoles(c)
		for _, userRole := range roles {
			for _, allowedRole := range allowedRoles {
				if userRole == allowedRole {
					c.Next()
					return
				}
			}
		}

		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden", "message": "one of the following roles required: " + strings.Join(allowedRoles, ", ")})
		c.Abort()
	}
}

// HasAllRoles checks if user has all of the specified roles
func HasAllRoles(requiredRoles []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roles := GetRoles(c)
		roleMap := make(map[string]bool)
		for _, r := range roles {
			roleMap[r] = true
		}

		for _, required := range requiredRoles {
			if !roleMap[required] {
				c.JSON(http.StatusForbidden, gin.H{"error": "forbidden", "message": "all of the following roles required: " + strings.Join(requiredRoles, ", ")})
				c.Abort()
				return
			}
		}

		c.Next()
	}
}
```

**Step 3: Run build to verify**

Run: `go build ./...`
Expected: No errors

**Step 4: Commit**

```bash
git add internal/middleware/auth.go internal/middleware/role.go
git commit -m "feat(middleware): add Auth and Role middleware with multi-role support"
```

---

### Task 10: Update main.go to use new middleware

**Files:**
- Modify: `cmd/api/main.go`

**Step 1: Read current main.go**

Run: `cat cmd/api/main.go`
Expected: See current API setup

**Step 2: Update middleware setup**

Modify `cmd/api/main.go`:
```go
// After existing imports, add:
import (
	"wowrack-recruitment/internal/middleware"
)

// In setupRoutes or similar function, add:
api.Use(middleware.AuthMiddleware(os.Getenv("JWT_SECRET")))

// Update HR routes to use role middleware
hr := api.Group("/hr")
hr.Use(middleware.HasRole("hr"))
{
	hr.GET("/applications", hrHandler.ListApplications)
	hr.GET("/applications/:id", hrHandler.GetApplication)
	hr.PATCH("/applications/:id/status", hrHandler.UpdateStatus)
	hr.GET("/active-vacancies", hrHandler.GetActiveVacancies)
}

// Update admin routes to use role middleware
admin := api.Group("/admin")
admin.Use(middleware.HasRole("admin"))
{
	admin.GET("/users/:id/roles", adminHandler.GetUserRoles)
	admin.POST("/users/:id/roles", adminHandler.AddUserRole)
	admin.DELETE("/users/:id/roles/:role", adminHandler.RemoveUserRole)
}
```

**Step 3: Run build to verify**

Run: `go build ./cmd/api`
Expected: No errors

**Step 4: Commit**

```bash
git add cmd/api/main.go
git commit -m "feat(api): integrate multi-role middleware into routes"
```

---

## Week 1 (Part 2): Candidate Application Flow

### Task 11: Create Application DTO with new fields

**Files:**
- Create: `internal/dto/application.go`

**Step 1: Create application DTO file**

Create `internal/dto/application.go`:
```go
package dto

import "time"

// CreateApplicationDTO represents request to create an application
type CreateApplicationDTO struct {
	TermsAccepted    bool   `json:"terms_accepted" binding:"required"`
	WhatsAppNumber   string `json:"whatsapp_number" binding:"required"`
	DomicileCity     string `json:"domicile_city" binding:"required"`
	DomicileProvince string `json:"domicile_province" binding:"required"`
	LastWorkRole     string `json:"last_work_role,omitempty"`
	LastWorkCompany  string `json:"last_work_company,omitempty"`
	LastWorkFrom     string `json:"last_work_from,omitempty"`
	LastWorkTo       string `json:"last_work_to,omitempty"`
	University       string `json:"university,omitempty"`
	Notes            string `json:"notes,omitempty"`
}

// UpdateStatusDTO represents request to update application status
type UpdateStatusDTO struct {
	Status string `json:"status" binding:"required"`
}

// ApplicationResponseDTO represents application response
type ApplicationResponseDTO struct {
	ID               uint       `json:"id"`
	UserID           uint       `json:"user_id"`
	JobID            uint       `json:"job_id"`
	Status           string     `json:"status"`
	TermsAccepted    bool       `json:"terms_accepted"`
	WhatsAppNumber   string     `json:"whatsapp_number"`
	DomicileCity     string     `json:"domicile_city"`
	DomicileProvince string     `json:"domicile_province"`
	LastWorkRole     string     `json:"last_work_role,omitempty"`
	LastWorkCompany  string     `json:"last_work_company,omitempty"`
	LastWorkFrom     *time.Time `json:"last_work_from,omitempty"`
	LastWorkTo       *time.Time `json:"last_work_to,omitempty"`
	University       string     `json:"university,omitempty"`
	Notes            string     `json:"notes,omitempty"`
	CVPath           string     `json:"cv_path"`
	PhotoPath        string     `json:"photo_path"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

// JobResponseDTO represents job response for candidates (AI score hidden)
type JobResponseDTO struct {
	ID              uint       `json:"id"`
	Title           string     `json:"title"`
	Description     string     `json:"description"`
	Requirements    string     `json:"requirements,omitempty"`
	Location        string     `json:"location"`
	SalaryMin       float64    `json:"salary_min"`
	SalaryMax       float64    `json:"salary_max"`
	Department      string     `json:"department"`
	Slug            string     `json:"slug"`
	Deadline        *time.Time `json:"deadline,omitempty"`
	DateNeeded      *time.Time `json:"date_needed,omitempty"`
	SpecialNeeds    string     `json:"special_needs,omitempty"`
	Benefits        string     `json:"benefits,omitempty"`
	ApplicantCount  int        `json:"applicant_count"`
	CreatedAt       time.Time  `json:"created_at"`
}

// ActiveVacancyDTO represents active vacancy for HR
type ActiveVacancyDTO struct {
	ID              uint       `json:"id"`
	Title           string     `json:"title"`
	Department      string     `json:"department"`
	Location        string     `json:"location"`
	Status          string     `json:"status"`
	ApplicantCount  int        `json:"applicant_count"`
	CreatedAt       time.Time  `json:"created_at"`
}
```

**Step 2: Run build to verify**

Run: `go build ./...`
Expected: No errors

**Step 3: Commit**

```bash
git add internal/dto/application.go
git commit -m "feat(dto): add application and job DTOs with MVP fields"
```

---

### Task 12: Update ApplicationRepository with new operations

**Files:**
- Modify: `internal/repository/application_repository.go`

**Step 1: Read current application repository**

Run: `cat internal/repository/application_repository.go`
Expected: See current application repository methods

**Step 2: Add new methods for MVP features**

Modify `internal/repository/application_repository.go`:
```go
package repository

import (
	"wowrack-recruitment/internal/models"

	"gorm.io/gorm"
)

// ApplicationRepository defines operations for applications
type ApplicationRepository interface {
	Create(app *models.Application) error
	FindByID(id uint) (*models.Application, error)
	FindByJobID(jobID uint) ([]models.Application, error)
	FindByUserID(userID uint) ([]models.Application, error)
	FindByStatus(status string) ([]models.Application, error)
	FindByJobIDAndUserID(jobID, userID uint) (*models.Application, error)
	Update(app *models.Application) error
	UpdateStatus(id uint, status string) error
	Delete(id uint) error
	CountByJobID(jobID uint) (int64, error)
}

type applicationRepository struct {
	db *gorm.DB
}

// NewApplicationRepository creates a new ApplicationRepository
func NewApplicationRepository(db *gorm.DB) ApplicationRepository {
	return &applicationRepository{db: db}
}

// Create creates a new application
func (r *applicationRepository) Create(app *models.Application) error {
	return r.db.Create(app).Error
}

// FindByID finds an application by ID
func (r *applicationRepository) FindByID(id uint) (*models.Application, error) {
	var app models.Application
	err := r.db.Preload("User").Preload("Job").First(&app, id).Error
	return &app, err
}

// FindByJobID finds all applications for a job
func (r *applicationRepository) FindByJobID(jobID uint) ([]models.Application, error) {
	var apps []models.Application
	err := r.db.Preload("User").Where("job_id = ?", jobID).Find(&apps).Error
	return apps, err
}

// FindByUserID finds all applications for a user
func (r *applicationRepository) FindByUserID(userID uint) ([]models.Application, error) {
	var apps []models.Application
	err := r.db.Preload("Job").Where("user_id = ?", userID).Find(&apps).Error
	return apps, err
}

// FindByStatus finds applications by status
func (r *applicationRepository) FindByStatus(status string) ([]models.Application, error) {
	var apps []models.Application
	err := r.db.Preload("User").Preload("Job").Where("status = ?", status).Find(&apps).Error
	return apps, err
}

// FindByJobIDAndUserID checks if user already applied
func (r *applicationRepository) FindByJobIDAndUserID(jobID, userID uint) (*models.Application, error) {
	var app models.Application
	err := r.db.Where("job_id = ? AND user_id = ?", jobID, userID).First(&app).Error
	return &app, err
}

// Update updates an application
func (r *applicationRepository) Update(app *models.Application) error {
	return r.db.Save(app).Error
}

// UpdateStatus updates only the status field
func (r *applicationRepository) UpdateStatus(id uint, status string) error {
	return r.db.Model(&models.Application{}).Where("id = ?", id).Update("status", status).Error
}

// Delete soft deletes an application
func (r *applicationRepository) Delete(id uint) error {
	return r.db.Delete(&models.Application{}, id).Error
}

// CountByJobID counts applications for a job
func (r *applicationRepository) CountByJobID(jobID uint) (int64, error) {
	var count int64
	err := r.db.Model(&models.Application{}).Where("job_id = ?", jobID).Count(&count).Error
	return count, err
}
```

**Step 3: Run build to verify**

Run: `go build ./...`
Expected: No errors

**Step 4: Commit**

```bash
git add internal/repository/application_repository.go
git commit -m "feat(repository): add application repository methods for MVP"
```

---

### Task 13: Write test for ApplicationService.Create with validation

**Files:**
- Create: `internal/service/application/application_service_test.go`

**Step 1: Write failing test**

Create `internal/service/application/application_service_test.go`:
```go
package application

import (
	"errors"
	"testing"

	"wowrack-recruitment/internal/dto"
	"wowrack-recruitment/internal/models"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"gorm.io/gorm"
)

// Mock repositories
type MockJobRepository struct {
	mock.Mock
}

func (m *MockJobRepository) FindBySlug(slug string) (*models.Job, error) {
	args := m.Called(slug)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Job), nil
}

type MockApplicationRepository struct {
	mock.Mock
}

func (m *MockApplicationRepository) FindByJobIDAndUserID(jobID, userID uint) (*models.Application, error) {
	args := m.Called(jobID, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Application), nil
}

func (m *MockApplicationRepository) Create(app *models.Application) error {
	args := m.Called(app)
	return args.Error(0)
}

type MockFileStorage struct {
	mock.Mock
}

func (m *MockFileStorage) UploadFile(filename string, data []byte) (string, error) {
	args := m.Called(filename, data)
	return args.String(0), args.Error(1)
}

func TestApplicationService_Create_TermsNotAccepted(t *testing.T) {
	mockJobRepo := new(MockJobRepository)
	mockAppRepo := new(MockApplicationRepository)
	mockStorage := new(MockFileStorage)

	service := NewApplicationService(mockAppRepo, mockJobRepo, mockStorage)

	dto := dto.CreateApplicationDTO{
		TermsAccepted: false, // Invalid!
		// ... other required fields
	}

	err := service.Create(dto, 1, nil, nil)
	assert.Error(t, err)
	assert.Equal(t, "terms must be accepted", err.Error())
}

func TestApplicationService_Create_AlreadyApplied(t *testing.T) {
	mockJobRepo := new(MockJobRepository)
	mockAppRepo := new(MockApplicationRepository)
	mockStorage := new(MockFileStorage)

	service := NewApplicationService(mockAppRepo, mockJobRepo, mockStorage)

	// Setup mock to return existing application
	existingApp := &models.Application{ID: 1}
	mockJobRepo.On("FindBySlug", "test-job").Return(&models.Job{ID: 1, Status: "published"}, nil)
	mockAppRepo.On("FindByJobIDAndUserID", uint(1), uint(1)).Return(existingApp, nil)

	dto := dto.CreateApplicationDTO{
		TermsAccepted: true,
		// ... other required fields
	}

	err := service.Create(dto, 1, nil, nil, "test-job")
	assert.Error(t, err)
	assert.Equal(t, "already applied for this job", err.Error())

	mockJobRepo.AssertExpectations(t)
	mockAppRepo.AssertExpectations(t)
}

func TestApplicationService_Create_JobNotFound(t *testing.T) {
	mockJobRepo := new(MockJobRepository)
	mockAppRepo := new(MockApplicationRepository)
	mockStorage := new(MockFileStorage)

	service := NewApplicationService(mockAppRepo, mockJobRepo, mockStorage)

	mockJobRepo.On("FindBySlug", "non-existent").Return(nil, gorm.ErrRecordNotFound)

	dto := dto.CreateApplicationDTO{
		TermsAccepted: true,
		// ... other required fields
	}

	err := service.Create(dto, 1, nil, nil, "non-existent")
	assert.Error(t, err)
	assert.Equal(t, "job not found", err.Error())

	mockJobRepo.AssertExpectations(t)
}

func TestApplicationService_Create_JobArchived(t *testing.T) {
	mockJobRepo := new(MockJobRepository)
	mockAppRepo := new(MockApplicationRepository)
	mockStorage := new(MockFileStorage)

	service := NewApplicationService(mockAppRepo, mockJobRepo, mockStorage)

	archivedJob := &models.Job{ID: 1, Status: "published", IsArchived: true}
	mockJobRepo.On("FindBySlug", "archived-job").Return(archivedJob, nil)

	dto := dto.CreateApplicationDTO{
		TermsAccepted: true,
		// ... other required fields
	}

	err := service.Create(dto, 1, nil, nil, "archived-job")
	assert.Error(t, err)
	assert.Equal(t, "job is no longer accepting applications", err.Error())

	mockJobRepo.AssertExpectations(t)
}
```

**Step 2: Run test to verify it fails**

Run: `go test ./internal/service/application/... -v`
Expected: FAIL with compilation errors (service not yet implemented)

**Step 3: Commit test skeleton**

```bash
git add internal/service/application/application_service_test.go
git commit -m "test(application): add failing tests for Create validation"
```

---

### Task 14: Implement ApplicationService.Create with transaction handling

**Files:**
- Create: `internal/service/application/application_service.go`

**Step 1: Implement ApplicationService**

Create `internal/service/application/application_service.go`:
```go
package application

import (
	"errors"
	"fmt"
	"time"

	"wowrack-recruitment/internal/dto"
	"wowrack-recruitment/internal/models"
	"wowrack-recruitment/internal/repository"

	"gorm.io/gorm"
)

var (
	ErrTermsNotAccepted   = errors.New("terms must be accepted")
	ErrAlreadyApplied     = errors.New("already applied for this job")
	ErrJobNotFound        = errors.New("job not found")
	ErrJobClosed          = errors.New("job is no longer accepting applications")
	ErrInvalidDateRange   = errors.New("work end date must be after start date")
)

// ApplicationService handles application business logic
type ApplicationService struct {
	appRepo   repository.ApplicationRepository
	jobRepo   repository.JobRepository
	storage   FileStorage
	db        *gorm.DB
}

// FileStorage defines file storage operations
type FileStorage interface {
	UploadFile(filename string, data []byte) (string, error)
}

// NewApplicationService creates a new ApplicationService
func NewApplicationService(
	appRepo repository.ApplicationRepository,
	jobRepo repository.JobRepository,
	storage FileStorage,
	db *gorm.DB,
) *ApplicationService {
	return &ApplicationService{
		appRepo: appRepo,
		jobRepo: jobRepo,
		storage: storage,
		db:      db,
	}
}

// Create creates a new application with transaction handling
func (s *ApplicationService) Create(dto dto.CreateApplicationDTO, userID uint, cvData, photoData []byte, jobSlug string) error {
	// Validate terms accepted
	if !dto.TermsAccepted {
		return ErrTermsNotAccepted
	}

	// Validate date range
	if dto.LastWorkFrom != "" && dto.LastWorkTo != "" {
		from, err := time.Parse("2006-01-02", dto.LastWorkFrom)
		to, err := time.Parse("2006-01-02", dto.LastWorkTo)
		if err == nil && to.Before(from) {
			return ErrInvalidDateRange
		}
	}

	// Begin transaction
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Find job
	job, err := s.jobRepo.FindBySlug(jobSlug)
	if err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrJobNotFound
		}
		return fmt.Errorf("failed to find job: %w", err)
	}

	// Check job status
	if job.Status != "published" || job.IsArchived {
		tx.Rollback()
		return ErrJobClosed
	}

	// Check if already applied
	existing, _ := s.appRepo.FindByJobIDAndUserID(job.ID, userID)
	if existing != nil {
		tx.Rollback()
		return ErrAlreadyApplied
	}

	// Upload files
	var cvPath, photoPath string
	if len(cvData) > 0 {
		cvPath, err = s.storage.UploadFile(fmt.Sprintf("cv_%d_%s", userID, jobSlug), cvData)
		if err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to upload CV: %w", err)
		}
	}
	if len(photoData) > 0 {
		photoPath, err = s.storage.UploadFile(fmt.Sprintf("photo_%d_%s", userID, jobSlug), photoData)
		if err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to upload photo: %w", err)
		}
	}

	// Parse dates
	var lastWorkFrom, lastWorkTo *time.Time
	if dto.LastWorkFrom != "" {
		t, _ := time.Parse("2006-01-02", dto.LastWorkFrom)
		lastWorkFrom = &t
	}
	if dto.LastWorkTo != "" {
		t, _ := time.Parse("2006-01-02", dto.LastWorkTo)
		lastWorkTo = &t
	}

	// Create application
	app := &models.Application{
		UserID:           userID,
		JobID:            job.ID,
		Status:           "applied",
		TermsAccepted:    dto.TermsAccepted,
		WhatsAppNumber:   dto.WhatsAppNumber,
		DomicileCity:     dto.DomicileCity,
		DomicileProvince: dto.DomicileProvince,
		LastWorkRole:     dto.LastWorkRole,
		LastWorkCompany:  dto.LastWorkCompany,
		LastWorkFrom:     lastWorkFrom,
		LastWorkTo:       lastWorkTo,
		University:       dto.University,
		Notes:            dto.Notes,
		CVPath:           cvPath,
		PhotoPath:        photoPath,
	}

	if err := tx.Create(app).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to create application: %w", err)
	}

	// Increment job applicant count
	if err := tx.Model(&models.Job{}).Where("id = ?", job.ID).UpdateColumn("applicant_count", gorm.Expr("applicant_count + 1")).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to update job count: %w", err)
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// GetByID retrieves an application by ID
func (s *ApplicationService) GetByID(id uint) (*dto.ApplicationResponseDTO, error) {
	app, err := s.appRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("application not found")
		}
		return nil, err
	}

	return s.toResponseDTO(app), nil
}

// ListByStatus retrieves applications by status
func (s *ApplicationService) ListByStatus(status string) ([]dto.ApplicationResponseDTO, error) {
	apps, err := s.appRepo.FindByStatus(status)
	if err != nil {
		return nil, err
	}

	result := make([]dto.ApplicationResponseDTO, len(apps))
	for i, app := range apps {
		result[i] = *s.toResponseDTO(&app)
	}
	return result, nil
}

// UpdateStatus updates application status
func (s *ApplicationService) UpdateStatus(id uint, status string) error {
	validStatuses := map[string]bool{
		"applied":     true,
		"selected":    true,
		"interviewed": true,
		"hired":       true,
		"rejected":    true,
	}

	if !validStatuses[status] {
		return errors.New("invalid status")
	}

	return s.appRepo.UpdateStatus(id, status)
}

// toResponseDTO converts model to DTO
func (s *ApplicationService) toResponseDTO(app *models.Application) *dto.ApplicationResponseDTO {
	return &dto.ApplicationResponseDTO{
		ID:               app.ID,
		UserID:           app.UserID,
		JobID:            app.JobID,
		Status:           app.Status,
		TermsAccepted:    app.TermsAccepted,
		WhatsAppNumber:   app.WhatsAppNumber,
		DomicileCity:     app.DomicileCity,
		DomicileProvince: app.DomicileProvince,
		LastWorkRole:     app.LastWorkRole,
		LastWorkCompany:  app.LastWorkCompany,
		LastWorkFrom:     app.LastWorkFrom,
		LastWorkTo:       app.LastWorkTo,
		University:       app.University,
		Notes:            app.Notes,
		CVPath:           app.CVPath,
		PhotoPath:        app.PhotoPath,
		CreatedAt:        app.CreatedAt,
		UpdatedAt:        app.UpdatedAt,
	}
}
```

**Step 2: Run tests to verify they pass**

Run: `go test ./internal/service/application/... -v`
Expected: PASS

**Step 3: Commit**

```bash
git add internal/service/application/application_service.go
git commit -m "feat(service): implement ApplicationService with transaction handling"
```

---

### Task 15: Create CandidateHandler for application flow

**Files:**
- Modify or Create: `internal/handlers/candidate_handler.go`

**Step 1: Create CandidateHandler**

Create `internal/handlers/candidate_handler.go`:
```go
package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"wowrack-recruitment/internal/dto"
	"wowrack-recruitment/internal/middleware"
	"wowrack-recruitment/internal/repository"
	"wowrack-recruitment/internal/service/application"
)

// CandidateHandler handles candidate-related requests
type CandidateHandler struct {
	appService *application.ApplicationService
	jobRepo    repository.JobRepository
}

// NewCandidateHandler creates a new CandidateHandler
func NewCandidateHandler(appService *application.ApplicationService, jobRepo repository.JobRepository) *CandidateHandler {
	return &CandidateHandler{
		appService: appService,
		jobRepo:    jobRepo,
	}
}

// CreateApplication handles POST /api/v1/jobs/:slug/apply
// Note: Public endpoint (no auth required) or optional auth
func (h *CandidateHandler) CreateApplication(c *gin.Context) {
	slug := c.Param("slug")

	// Parse multipart form
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil { // 32MB max
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_form", "message": "Failed to parse form"})
		return
	}

	// Get user ID from context if logged in (optional)
	var userID uint
	if id := middleware.GetUserID(c); id > 0 {
		userID = id
	}

	// Extract DTO fields
	dto := dto.CreateApplicationDTO{
		TermsAccepted:    c.PostForm("terms_accepted") == "true",
		WhatsAppNumber:   c.PostForm("whatsapp_number"),
		DomicileCity:     c.PostForm("domicile_city"),
		DomicileProvince: c.PostForm("domicile_province"),
		LastWorkRole:     c.PostForm("last_work_role"),
		LastWorkCompany:  c.PostForm("last_work_company"),
		LastWorkFrom:     c.PostForm("last_work_from"),
		LastWorkTo:       c.PostForm("last_work_to"),
		University:       c.PostForm("university"),
		Notes:            c.PostForm("notes"),
	}

	// Get files
	cvFile, err := c.FormFile("cv_file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_file", "field": "cv_file", "message": "CV file is required"})
		return
	}

	photoFile, _ := c.FormFile("photo_file") // Optional

	// Read file data
	cvData, err := cvFile.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "file_read_failed"})
		return
	}
	defer cvData.Close()

	cvBytes := make([]byte, cvFile.Size)
	if _, err := cvData.Read(cvBytes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "file_read_failed"})
		return
	}

	var photoBytes []byte
	if photoFile != nil {
		photoData, err := photoFile.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "file_read_failed"})
			return
		}
		defer photoData.Close()

		photoBytes = make([]byte, photoFile.Size)
		if _, err := photoData.Read(photoBytes); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "file_read_failed"})
			return
		}
	}

	// Validate DTO
	if dto.WhatsAppNumber == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "validation_failed", "field": "whatsapp_number", "message": "WhatsApp number is required"})
		return
	}

	// Create application
	if err := h.appService.Create(dto, userID, cvBytes, photoBytes, slug); err != nil {
		if err == application.ErrTermsNotAccepted {
			c.JSON(http.StatusBadRequest, gin.H{"error": "terms_not_accepted", "message": err.Error()})
			return
		}
		if err == application.ErrAlreadyApplied {
			c.JSON(http.StatusConflict, gin.H{"error": "already_applied", "message": err.Error()})
			return
		}
		if err == application.ErrJobNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "not_found", "message": err.Error()})
			return
		}
		if err == application.ErrJobClosed {
			c.JSON(http.StatusBadRequest, gin.H{"error": "job_closed", "message": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal_error"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Application submitted successfully",
	})
}

// GetJob handles GET /api/v1/jobs/:slug (public)
func (h *CandidateHandler) GetJob(c *gin.Context) {
	slug := c.Param("slug")

	job, err := h.jobRepo.FindBySlug(slug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not_found", "message": "Job not found"})
		return
	}

	// Hide AI score for candidates
	response := dto.JobResponseDTO{
		ID:             job.ID,
		Title:          job.Title,
		Description:    job.Description,
		Requirements:   job.Requirements,
		Location:       job.Location,
		SalaryMin:      job.SalaryMin,
		SalaryMax:      job.SalaryMax,
		Department:     job.Department.Name,
		Slug:           job.Slug,
		Deadline:       job.Deadline,
		DateNeeded:     job.DateNeeded,
		SpecialNeeds:   job.SpecialNeeds,
		Benefits:       job.Benefits,
		ApplicantCount: len(job.Applications),
		CreatedAt:      job.CreatedAt,
	}

	c.JSON(http.StatusOK, response)
}

// GetMyApplications handles GET /api/v1/candidate/applications
func (h *CandidateHandler) GetMyApplications(c *gin.Context) {
	userID := middleware.GetUserID(c)

	// This would need to be implemented in service
	// For MVP, return empty or implement
	c.JSON(http.StatusOK, gin.H{"applications": []interface{}{}})
}
```

**Step 2: Run build to verify**

Run: `go build ./...`
Expected: No errors

**Step 3: Commit**

```bash
git add internal/handlers/candidate_handler.go
git commit -m "feat(handler): add CandidateHandler for application flow"
```

---

### Task 16: Register candidate routes in main.go

**Files:**
- Modify: `cmd/api/main.go`

**Step 1: Update routes**

Modify `cmd/api/main.go`:
```go
// Add candidate routes (public or optional auth)
candidate := api.Group("/candidate")
candidate.Use(middleware.AuthMiddleware(os.Getenv("JWT_SECRET"))) // Optional: make this optional
{
	candidate.GET("/applications", candidateHandler.GetMyApplications)
}

// Public job routes (no auth required)
api.GET("/jobs/:slug", candidateHandler.GetJob)
api.POST("/jobs/:slug/apply", candidateHandler.CreateApplication)
```

**Step 2: Run build to verify**

Run: `go build ./...`
Expected: No errors

**Step 3: Commit**

```bash
git add cmd/api/main.go
git commit -m "feat(routes): register candidate application routes"
```

---

## Week 2: HR Management Flow

### Task 17: Create HR ApplicationHandler

**Files:**
- Modify or Create: `internal/handlers/hr_application_handler.go`

**Step 1: Create/Update HRApplicationHandler**

Create or modify `internal/handlers/hr_application_handler.go`:
```go
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"wowrack-recruitment/internal/dto"
	"wowrack-recruitment/internal/middleware"
	"wowrack-recruitment/internal/repository"
	"wowrack-recruitment/internal/service/application"
)

// HRApplicationHandler handles HR application management
type HRApplicationHandler struct {
	appService *application.ApplicationService
	jobRepo    repository.JobRepository
}

// NewHRApplicationHandler creates a new HRApplicationHandler
func NewHRApplicationHandler(appService *application.ApplicationService, jobRepo repository.JobRepository) *HRApplicationHandler {
	return &HRApplicationHandler{
		appService: appService,
		jobRepo:    jobRepo,
	}
}

// ListApplications handles GET /api/v1/hr/applications
func (h *HRApplicationHandler) ListApplications(c *gin.Context) {
	status := c.Query("status")

	var applications []dto.ApplicationResponseDTO
	var err error

	if status != "" {
		applications, err = h.appService.ListByStatus(status)
	} else {
		// TODO: Implement list all
		applications, err = h.appService.ListByStatus("applied")
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal_error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"applications": applications})
}

// GetApplication handles GET /api/v1/hr/applications/:id
func (h *HRApplicationHandler) GetApplication(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_id"})
		return
	}

	application, err := h.appService.GetByID(uint(id))
	if err != nil {
		if err.Error() == "application not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "not_found", "message": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal_error"})
		return
	}

	// Include AI score for HR (not candidates)
	// This would need to be added to the service
	c.JSON(http.StatusOK, application)
}

// UpdateStatus handles PATCH /api/v1/hr/applications/:id/status
func (h *HRApplicationHandler) UpdateStatus(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_id"})
		return
	}

	var req dto.UpdateStatusDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_request"})
		return
	}

	userID := middleware.GetUserID(c)

	// Validate status transition
	if err := h.appService.UpdateStatus(uint(id), req.Status); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_status", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Status updated successfully",
		"updated_by": userID,
	})
}
```

**Step 2: Add import for strconv**

Make sure to import `strconv` at the top of the file.

**Step 3: Run build to verify**

Run: `go build ./...`
Expected: No errors

**Step 4: Commit**

```bash
git add internal/handlers/hr_application_handler.go
git commit -m "feat(handler): add HRApplicationHandler for management flow"
```

---

### Task 18: Create JobService with active vacancies

**Files:**
- Modify: `internal/service/job_service.go`

**Step 1: Read current job service**

Run: `cat internal/service/job_service.go`
Expected: See current job service

**Step 2: Add GetActiveVacancies method**

Modify `internal/service/job_service.go`:
```go
// Add to JobService interface and implementation

// GetActiveVacancies retrieves all published, non-archived jobs
func (s *jobService) GetActiveVacancies() ([]dto.ActiveVacancyDTO, error) {
	jobs, err := s.jobRepo.FindActive()
	if err != nil {
		return nil, err
	}

	result := make([]dto.ActiveVacancyDTO, len(jobs))
	for i, job := range jobs {
		result[i] = dto.ActiveVacancyDTO{
			ID:             job.ID,
			Title:          job.Title,
			Department:     job.Department.Name,
			Location:       job.Location,
			Status:         job.Status,
			ApplicantCount: len(job.Applications),
			CreatedAt:      job.CreatedAt,
		}
	}
	return result, nil
}
```

**Step 3: Add FindActive to JobRepository**

Modify `internal/repository/job_repository.go`:
```go
// FindActive retrieves published, non-archived jobs
func (r *jobRepository) FindActive() ([]models.Job, error) {
	var jobs []models.Job
	err := r.db.Preload("Department").Preload("Applications").
		Where("status = ?", "published").
		Where("is_archived = ?", false).
		Order("created_at DESC").
		Find(&jobs).Error
	return jobs, err
}
```

**Step 4: Run build to verify**

Run: `go build ./...`
Expected: No errors

**Step 5: Commit**

```bash
git add internal/service/job_service.go internal/repository/job_repository.go
git commit -m "feat(job): add GetActiveVacancies for HR management"
```

---

### Task 19: Create HRHandler for active vacancies

**Files:**
- Modify or Create: `internal/handlers/hr_handler.go`

**Step 1: Create/Update HRHandler**

Create or modify `internal/handlers/hr_handler.go`:
```go
package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"wowrack-recruitment/internal/service"
)

// HRHandler handles HR-specific requests
type HRHandler struct {
	jobService *service.JobService
}

// NewHRHandler creates a new HRHandler
func NewHRHandler(jobService *service.JobService) *HRHandler {
	return &HRHandler{jobService: jobService}
}

// GetActiveVacancies handles GET /api/v1/hr/active-vacancies
func (h *HRHandler) GetActiveVacancies(c *gin.Context) {
	vacancies, err := h.jobService.GetActiveVacancies()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal_error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"vacancies": vacancies})
}

// GetActiveVacancy handles GET /api/v1/hr/active-vacancies/:id
func (h *HRHandler) GetActiveVacancy(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_id"})
		return
	}

	// Get job and verify it's active
	job, err := h.jobService.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not_found"})
		return
	}

	if job.Status != "published" || job.IsArchived {
		c.JSON(http.StatusNotFound, gin.H{"error": "not_found", "message": "Vacancy not active"})
		return
	}

	c.JSON(http.StatusOK, job)
}
```

**Step 2: Run build to verify**

Run: `go build ./...`
Expected: No errors

**Step 3: Commit**

```bash
git add internal/handlers/hr_handler.go
git commit -m "feat(handler): add HRHandler for active vacancies"
```

---

### Task 20: Register HR routes

**Files:**
- Modify: `cmd/api/main.go`

**Step 1: Update HR routes**

Modify `cmd/api/main.go`:
```go
// HR routes (require HR role)
hr := api.Group("/hr")
hr.Use(middleware.AuthMiddleware(os.Getenv("JWT_SECRET")))
hr.Use(middleware.HasRole("hr"))
{
	// Application management
	hr.GET("/applications", hrApplicationHandler.ListApplications)
	hr.GET("/applications/:id", hrApplicationHandler.GetApplication)
	hr.PATCH("/applications/:id/status", hrApplicationHandler.UpdateStatus)

	// Active vacancies
	hr.GET("/active-vacancies", hrHandler.GetActiveVacancies)
	hr.GET("/active-vacancies/:id", hrHandler.GetActiveVacancy)
}
```

**Step 2: Run build to verify**

Run: `go build ./...`
Expected: No errors

**Step 3: Commit**

```bash
git add cmd/api/main.go
git commit -m "feat(routes): register HR management routes"
```

---

## Week 3: Polish & Edge Cases

### Task 21: Create error handling middleware

**Files:**
- Create: `internal/middleware/error.go`

**Step 1: Create error middleware**

Create `internal/middleware/error.go`:
```go
package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ErrorResponse represents standard error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
	Field   string `json:"field,omitempty"`
}

// RecoveryMiddleware handles panics
func RecoveryMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				c.JSON(http.StatusInternalServerError, ErrorResponse{
					Error:   "internal_error",
					Message: "An unexpected error occurred",
				})
				c.Abort()
			}
		}()
		c.Next()
	}
}

// ErrorResponse sends a standardized error response
func ErrorResponse(c *gin.Context, statusCode int, errCode, message string) {
	c.JSON(statusCode, ErrorResponse{
		Error:   errCode,
		Message: message,
	})
}

// ValidationErrorResponse sends a validation error response
func ValidationErrorResponse(c *gin.Context, field, message string) {
	c.JSON(http.StatusBadRequest, ErrorResponse{
		Error:   "validation_failed",
		Field:   field,
		Message: message,
	})
}
```

**Step 2: Run build to verify**

Run: `go build ./...`
Expected: No errors

**Step 3: Commit**

```bash
git add internal/middleware/error.go
git commit -m "feat(middleware): add standardized error handling"
```

---

### Task 22: Create validation middleware

**Files:**
- Create: `internal/middleware/validation.go`

**Step 1: Create validation middleware**

Create `internal/middleware/validation.go`:
```go
package middleware

import (
	"regexp"

	"github.com/gin-gonic/gin"
)

// WhatsApp pattern for Indonesian numbers (08xx)
var whatsappPattern = regexp.MustCompile(`^08[0-9]{8,11}$`)

// ValidateWhatsApp validates Indonesian WhatsApp number format
func ValidateWhatsApp(number string) bool {
	return whatsappPattern.MatchString(number)
}

// ValidateIndonesianPhone validates Indonesian phone number format
func ValidateIndonesianPhone(number string) bool {
	// Support 08xxxxxxxxxx, +628xxxxxxxxxx, 628xxxxxxxxxx
	phonePattern := regexp.MustCompile(`^(?:\+62|62|0)8[0-9]{8,11}$`)
	return phonePattern.MatchString(number)
}
```

**Step 2: Run build to verify**

Run: `go build ./...`
Expected: No errors

**Step 3: Commit**

```bash
git add internal/middleware/validation.go
git commit -m "feat(middleware): add validation helpers for phone numbers"
```

---

### Task 23: Update ApplicationService to use validation middleware

**Files:**
- Modify: `internal/service/application/application_service.go`

**Step 1: Add validation in Create method**

Modify `internal/service/application/application_service.go`:
```go
// Add import
import (
	"wowrack-recruitment/internal/middleware"
)

// In Create method, after terms validation:
if !middleware.ValidateWhatsApp(dto.WhatsAppNumber) {
	return errors.New("invalid WhatsApp number format")
}

// Validate domicile (basic check)
if dto.DomicileCity == "" || dto.DomicileProvince == "" {
	return errors.New("domicile city and province are required")
}
```

**Step 2: Run build to verify**

Run: `go build ./...`
Expected: No errors

**Step 3: Commit**

```bash
git add internal/service/application/application_service.go
git commit -m "feat(service): add validation for WhatsApp and domicile"
```

---

### Task 24: Create AdminHandler for user role management

**Files:**
- Create: `internal/handlers/admin_handler.go`

**Step 1: Create AdminHandler**

Create `internal/handlers/admin_handler.go`:
```go
package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"wowrack-recruitment/internal/middleware"
	"wowrack-recruitment/internal/repository"
)

// AdminHandler handles admin requests
type AdminHandler struct {
	userRepo     repository.UserRepository
	userRoleRepo repository.UserRoleRepository
}

// NewAdminHandler creates a new AdminHandler
func NewAdminHandler(userRepo repository.UserRepository, userRoleRepo repository.UserRoleRepository) *AdminHandler {
	return &AdminHandler{
		userRepo:     userRepo,
		userRoleRepo: userRoleRepo,
	}
}

// GetUserRoles handles GET /api/v1/admin/users/:id/roles
func (h *AdminHandler) GetUserRoles(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_id"})
		return
	}

	roles, err := h.userRoleRepo.FindByUserID(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal_error"})
		return
	}

	roleNames := make([]string, len(roles))
	for i, r := range roles {
		roleNames[i] = r.Role
	}

	c.JSON(http.StatusOK, gin.H{"user_id": id, "roles": roleNames})
}

// AddUserRole handles POST /api/v1/admin/users/:id/roles
type AddRoleRequest struct {
	Role string `json:"role" binding:"required"`
}

func (h *AdminHandler) AddUserRole(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_id"})
		return
	}

	var req AddRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_request"})
		return
	}

	validRoles := map[string]bool{
		"admin":           true,
		"hr":              true,
		"hiring_manager":  true,
		"candidate":       true,
	}

	if !validRoles[req.Role] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_role"})
		return
	}

	// Check if role already exists
	roles, err := h.userRoleRepo.FindByUserID(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal_error"})
		return
	}

	for _, r := range roles {
		if r.Role == req.Role {
			c.JSON(http.StatusConflict, gin.H{"error": "role_already_exists"})
			return
		}
	}

	userRole := &models.UserRole{
		UserID: uint(id),
		Role:   req.Role,
	}

	if err := h.userRoleRepo.Create(userRole); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal_error"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Role added successfully"})
}

// RemoveUserRole handles DELETE /api/v1/admin/users/:id/roles/:role
func (h *AdminHandler) RemoveUserRole(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_id"})
		return
	}

	role := c.Param("role")

	// Check if this is the user's last role
	roles, err := h.userRoleRepo.FindByUserID(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal_error"})
		return
	}

	if len(roles) == 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot_remove_last_role", "message": "User must have at least one role"})
		return
	}

	// Prevent removing admin role from admin users (simplified check)
	requesterID := middleware.GetUserID(c)
	if requesterID == uint(id) && role == "admin" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot_remove_own_admin_role"})
		return
	}

	if err := h.userRoleRepo.Delete(uint(id), role); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal_error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Role removed successfully"})
}
```

**Step 2: Add missing import**

Make sure to import `models` at the top.

**Step 3: Run build to verify**

Run: `go build ./...`
Expected: No errors

**Step 4: Commit**

```bash
git add internal/handlers/admin_handler.go
git commit -m "feat(handler): add AdminHandler for role management"
```

---

### Task 25: Register admin routes

**Files:**
- Modify: `cmd/api/main.go`

**Step 1: Update admin routes**

Modify `cmd/api/main.go`:
```go
// Admin routes (require admin role)
admin := api.Group("/admin")
admin.Use(middleware.AuthMiddleware(os.Getenv("JWT_SECRET")))
admin.Use(middleware.HasRole("admin"))
{
	admin.GET("/users/:id/roles", adminHandler.GetUserRoles)
	admin.POST("/users/:id/roles", adminHandler.AddUserRole)
	admin.DELETE("/users/:id/roles/:role", adminHandler.RemoveUserRole)
}
```

**Step 2: Run build to verify**

Run: `go build ./...`
Expected: No errors

**Step 3: Commit**

```bash
git add cmd/api/main.go
git commit -m "feat(routes): register admin role management routes"
```

---

### Task 26: Apply recovery middleware globally

**Files:**
- Modify: `cmd/api/main.go`

**Step 1: Add recovery middleware**

Modify `cmd/api/main.go`:
```go
// Before other middleware
api.Use(middleware.RecoveryMiddleware())
api.Use(middleware.AuthMiddleware(os.Getenv("JWT_SECRET")))
```

**Step 2: Run build to verify**

Run: `go build ./...`
Expected: No errors

**Step 3: Commit**

```bash
git add cmd/api/main.go
git commit -m "feat(middleware): apply recovery middleware globally"
```

---

## Week 4: Testing & Final Polish

### Task 27: Write integration test for candidate apply flow

**Files:**
- Create: `tests/integration/candidate_apply_test.go`

**Step 1: Write integration test**

Create `tests/integration/candidate_apply_test.go`:
```go
//go:build integration
// +build integration

package integration

import (
	"bytes"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"wowrack-recruitment/cmd/api"
)

func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	return api.SetupRouter()
}

func TestPOST_JobsSlugApply_FullFlow(t *testing.T) {
	router := setupTestRouter()

	// Create multipart form body
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	writer.WriteField("terms_accepted", "true")
	writer.WriteField("whatsapp_number", "08123456789")
	writer.WriteField("domicile_city", "Jakarta")
	writer.WriteField("domicile_province", "DKI Jakarta")
	writer.WriteField("last_work_role", "Software Engineer")
	writer.WriteField("last_work_company", "Tech Company")
	writer.WriteField("last_work_from", "2023-01-01")
	writer.WriteField("last_work_to", "2024-01-01")
	writer.WriteField("university", "University of Indonesia")

	// Add dummy CV file
	writer.CreateFormFile("cv_file", "cv.pdf")
	writer.WriteField("cv_file", "dummy cv content")

	writer.Close()

	req, _ := http.NewRequest("POST", "/api/v1/jobs/test-slug/apply", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	assert.Equal(t, "Application submitted successfully", response["message"])
}

func TestPOST_JobsSlugApply_TermsNotAccepted(t *testing.T) {
	router := setupTestRouter()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	writer.WriteField("terms_accepted", "false") // Invalid
	writer.WriteField("whatsapp_number", "08123456789")
	writer.WriteField("domicile_city", "Jakarta")
	writer.WriteField("domicile_province", "DKI Jakarta")

	writer.Close()

	req, _ := http.NewRequest("POST", "/api/v1/jobs/test-slug/apply", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	assert.Equal(t, "terms_not_accepted", response["error"])
}
```

**Step 2: Run integration tests**

Run: `go test ./tests/integration/... -tags=integration -v`
Expected: Tests run (may need test DB setup)

**Step 3: Commit**

```bash
git add tests/integration/candidate_apply_test.go
git commit -m "test(integration): add candidate apply flow tests"
```

---

### Task 28: Write integration test for HR workflow

**Files:**
- Create: `tests/integration/hr_workflow_test.go`

**Step 1: Write integration test**

Create `tests/integration/hr_workflow_test.go`:
```go
//go:build integration
// +build integration

package integration

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestGET_HrApplications_Authentication(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := setupTestRouter()

	// Test without token
	req, _ := http.NewRequest("GET", "/api/v1/hr/applications", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)

	// Test with invalid token
	req, _ = http.NewRequest("GET", "/api/v1/hr/applications", nil)
	req.Header.Set("Authorization", "Bearer invalid")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestPATCH_HrApplications_UpdateStatus(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := setupTestRouter()

	// First login as HR to get token
	loginReq := map[string]string{"email": "hr@wowrack.com", "password": "password"}
	loginBody, _ := json.Marshal(loginReq)

	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(loginBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	var loginResp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &loginResp)

	token := loginResp["token"].(string)

	// Update application status
	updateReq := map[string]string{"status": "selected"}
	updateBody, _ := json.Marshal(updateReq)

	req, _ = http.NewRequest("PATCH", "/api/v1/hr/applications/1/status", bytes.NewBuffer(updateBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}
```

**Step 2: Run integration tests**

Run: `go test ./tests/integration/... -tags=integration -v`
Expected: Tests run

**Step 3: Commit**

```bash
git add tests/integration/hr_workflow_test.go
git commit -m "test(integration): add HR workflow tests"
```

---

### Task 29: Verify test coverage

**Step 1: Run all tests with coverage**

Run: `go test ./... -coverprofile=coverage.out`

**Step 2: Check coverage percentage**

Run: `go tool cover -func=coverage.out | grep total`
Expected: ~65% or higher coverage

**Step 3: Generate HTML report**

Run: `go tool cover -html=coverage.out -o coverage.html`

**Step 4: Review coverage gaps**

Check coverage.html for areas needing more tests.

**Step 5: Document coverage**

Create `docs/testing_coverage.md`:
```markdown
# Test Coverage Report

## Current Coverage: XX%

## Coverage by Module

| Module | Coverage | Notes |
|--------|----------|-------|
| application/ | XX% | MVP core functionality |
| middleware/ | XX% | Auth and role checking |
| handlers/ | XX% | API endpoints |

## Target: 65% for MVP
```

**Step 6: Commit**

```bash
git add docs/testing_coverage.md
git commit -m "docs: add test coverage report"
```

---

### Task 30: Final code review and cleanup

**Files:**
- All modified files

**Step 1: Run linter**

Run: `golangci-lint run ./...`
Expected: Fix any linting issues

**Step 2: Run go vet**

Run: `go vet ./...`
Expected: No warnings

**Step 3: Run go mod tidy**

Run: `go mod tidy`

**Step 4: Build production binary**

Run: `go build -o bin/api ./cmd/api`
Expected: Binary created successfully

**Step 5: Test production binary**

Run: `./bin/api --help`
Expected: Help output

**Step 6: Commit any cleanup**

```bash
git add .
git commit -m "chore: final code cleanup and build verification"
```

---

## Summary

This implementation plan covers:

**Week 1: Foundation - Multi-Role Authentication** (Tasks 1-10)
- Database migrations for user_roles, application fields, job fields
- Model updates for multi-role support
- JWT claims update to role array
- Auth and Role middleware
- Integration with main.go

**Week 1 (Part 2): Candidate Application Flow** (Tasks 11-16)
- Application DTOs with MVP fields
- ApplicationRepository with CRUD operations
- ApplicationService with transaction handling and validation
- CandidateHandler for apply flow
- Route registration

**Week 2: HR Management Flow** (Tasks 17-20)
- HRApplicationHandler for application management
- JobService with active vacancies
- HRHandler for vacancy management
- Route registration

**Week 3: Polish & Edge Cases** (Tasks 21-26)
- Error handling middleware
- Validation middleware
- AdminHandler for role management
- Route registration

**Week 4: Testing & Final Polish** (Tasks 27-30)
- Integration tests
- Coverage verification
- Code review and cleanup

**Total Tasks:** 30
**Estimated Effort:** ~4 weeks
**Test Coverage Target:** 65%

---

## Prerequisites for Execution

1. Set up test database
2. Set up test MinIO instance
3. Configure environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `MINIO_ENDPOINT`
   - `MINIO_ACCESS_KEY`
   - `MINIO_SECRET_KEY`
