# Wowrack Recruitment Portal — Production-Blocking Review

**Scope:** Security · Data Integrity · Scalability Hygiene · Idiomatic Go  
**Codebase:** 46 Go files, Gin + GORM + PostgreSQL + MinIO  
**Date:** 2026-02-23

---

## 1. Security — MUST NOT SHIP IF BROKEN

### SEC-01 🔴 Blocker — Hardcoded JWT Secret

**File:** [jwt.go](file:///c:/Users/MOLKET012/wowrack-recruitment-2/recruitment/internal/util/jwt.go)

The JWT signing key is hardcoded and the `JWT_SECRET` environment variable from `.env` is never read.

```diff
-var jwtSecret = []byte("rahasia-sangat-rahasia-1234567890")
+var jwtSecret []byte
+
+func init() {
+    secret := os.Getenv("JWT_SECRET")
+    if secret == "" {
+        panic("JWT_SECRET environment variable is required")
+    }
+    if len(secret) < 32 {
+        panic("JWT_SECRET must be at least 32 characters")
+    }
+    jwtSecret = []byte(secret)
+}
```

---

### SEC-02 🔴 Blocker — Hardcoded DB Credentials

**File:** [db.go](file:///c:/Users/MOLKET012/wowrack-recruitment-2/recruitment/internal/config/db.go#L19-L20)

Fallback credentials are real production values.

```diff
 func ConnectDB() {
-    host := getEnv("DB_HOST", "127.0.0.1")
-    port := getEnv("DB_PORT", "5432")
-    user := getEnv("DB_USER", "albiadmingamtenk")
-    password := getEnv("DB_PASSWORD", "albiarisyafiq987654321")
-    dbname := getEnv("DB_NAME", "myapp_recruitment")
-    sslmode := getEnv("DB_SSLMODE", "disable")
+    required := []string{"DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"}
+    for _, key := range required {
+        if os.Getenv(key) == "" {
+            log.Fatalf("Required env var %s is not set", key)
+        }
+    }
+    host := os.Getenv("DB_HOST")
+    port := os.Getenv("DB_PORT")
+    user := os.Getenv("DB_USER")
+    password := os.Getenv("DB_PASSWORD")
+    dbname := os.Getenv("DB_NAME")
+    sslmode := getEnv("DB_SSLMODE", "require") // default to SSL on
```

---

### SEC-03 🔴 Blocker — `.env` Committed with Real Credentials

**File:** [.env](file:///c:/Users/MOLKET012/wowrack-recruitment-2/recruitment/.env)

Contains real DB password, S3 keys, SMTP password, and JWT secret.

**Fix:**
```bash
# 1. Add to .gitignore IMMEDIATELY
echo ".env" >> .gitignore

# 2. Remove from git history
git rm --cached .env
git commit -m "Remove .env from tracking"

# 3. ROTATE all credentials — they're compromised:
#    - DB_PASSWORD
#    - S3_ACCESS_KEY / S3_SECRET_KEY
#    - EMAIL_PASSWORD  
#    - JWT_SECRET

# 4. Create .env.example with placeholder values
```

```ini
# .env.example (commit this instead)
DB_HOST=localhost
DB_PORT=5432
DB_USER=
DB_PASSWORD=
DB_NAME=myapp_recruitment
DB_SSLMODE=require
S3_ENDPOINT=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_USE_SSL=true
JWT_SECRET=
EMAIL_FROM=
EMAIL_SMTP_HOST=
EMAIL_SMTP_PORT=587
EMAIL_PASSWORD=
PORT=8080
```

---

### SEC-04 🔴 Blocker — Debug Credential Logging

**File:** [main.go:56-58](file:///c:/Users/MOLKET012/wowrack-recruitment-2/recruitment/cmd/api/main.go#L56-L58)

```diff
-    log.Println("DEBUG DB_HOST:", os.Getenv("DB_HOST"))
-    log.Println("DEBUG S3_ENDPOINT:", os.Getenv("S3_ENDPOINT"))
-    log.Println("DEBUG S3_ACCESS_KEY:", os.Getenv("S3_ACCESS_KEY"))
+    // REMOVED: never log credentials, even partially
```

---

### SEC-05 🔴 Blocker — Hardcoded Admin Setup Secret

**File:** [main.go:114-147](file:///c:/Users/MOLKET012/wowrack-recruitment-2/recruitment/cmd/api/main.go#L114-L147)

The `/setup-first-admin` endpoint uses a hardcoded secret header and is always active.

```diff
-    r.POST("/setup-first-admin", func(c *gin.Context) {
-        if c.GetHeader("X-Setup-Secret") != "rahasia-setup-1234567890" {
+    // Move to a CLI command instead of an HTTP endpoint:
+    // go run cmd/setup/main.go --name="Admin" --email="admin@co.com"
+    //
+    // If you must keep HTTP, gate it properly:
+    if os.Getenv("ENABLE_SETUP_ENDPOINT") == "true" {
+        r.POST("/setup-first-admin", func(c *gin.Context) {
+            setupSecret := os.Getenv("SETUP_SECRET")
+            if setupSecret == "" || c.GetHeader("X-Setup-Secret") != setupSecret {
+                c.JSON(401, gin.H{"error": "Unauthorized"})
+                return
+            }
+            // ... rest of handler
+        })
+    }
```

> [!TIP]
> Best practice: Use a CLI tool (`cmd/setup/main.go`) that runs once during deployment, not an HTTP endpoint.

---

### SEC-06 🔴 Blocker — No CV File Validation

**File:** [candidate_application.go](file:///c:/Users/MOLKET012/wowrack-recruitment-2/recruitment/internal/service/application/candidate_application.go#L142-L150)

The `validateApplyRequest` checks only that `cvFile != nil` — no MIME type, no size limit, no extension check. An attacker can upload executables, scripts, or multi-GB files.

Create a shared validation helper:

```go
// internal/util/file_validation.go
package util

import (
    "errors"
    "mime/multipart"
    "net/http"
    "path/filepath"
    "strings"
)

var (
    AllowedCVExtensions    = map[string]bool{".pdf": true, ".doc": true, ".docx": true}
    AllowedCVMIMETypes     = map[string]bool{
        "application/pdf": true,
        "application/msword": true,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
    }
    AllowedImageExtensions = map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true}
    AllowedImageMIMETypes  = map[string]bool{
        "image/jpeg": true, "image/png": true, "image/webp": true,
    }
    MaxCVSize    int64 = 10 << 20 // 10 MB
    MaxImageSize int64 = 5 << 20  // 5 MB
)

func ValidateFile(file *multipart.FileHeader, maxSize int64, allowedExt map[string]bool, allowedMIME map[string]bool) error {
    if file.Size > maxSize {
        return errors.New("file exceeds maximum allowed size")
    }

    ext := strings.ToLower(filepath.Ext(file.Filename))
    if !allowedExt[ext] {
        return errors.New("file type not allowed: " + ext)
    }

    // Sniff actual content type (don't trust Content-Type header)
    src, err := file.Open()
    if err != nil {
        return err
    }
    defer src.Close()

    buf := make([]byte, 512)
    n, _ := src.Read(buf)
    detectedType := http.DetectContentType(buf[:n])
    if !allowedMIME[detectedType] {
        return errors.New("detected MIME type not allowed: " + detectedType)
    }

    return nil
}
```

Use it in the Apply flow:

```diff
 func (s *applicationService) validateApplyRequest(req dto.ApplyJobRequest, cvFile *multipart.FileHeader) error {
     if req.Name == "" || req.Email == "" || req.Phone == "" {
         return errors.New("nama, email, dan phone wajib diisi")
     }
     if cvFile == nil {
         return errors.New("CV wajib diupload")
     }
+    if err := util.ValidateFile(cvFile, util.MaxCVSize, util.AllowedCVExtensions, util.AllowedCVMIMETypes); err != nil {
+        return fmt.Errorf("CV validation failed: %w", err)
+    }
     return nil
 }
```

Apply the same pattern for photo uploads in `auth_service.go:uploadPhoto` and JD uploads in `job_service.go:uploadJD`.

---

### SEC-07 🔴 Blocker — No Photo File Validation

**File:** [auth_service.go:104-122](file:///c:/Users/MOLKET012/wowrack-recruitment-2/recruitment/internal/service/auth_service.go#L104-L122)

`uploadPhoto` accepts **any file type and size** with no validation.

```diff
 func (s *service) uploadPhoto(file *multipart.FileHeader) (string, error) {
     if file == nil {
         return "", nil
     }
+    if err := util.ValidateFile(file, util.MaxImageSize, util.AllowedImageExtensions, util.AllowedImageMIMETypes); err != nil {
+        return "", fmt.Errorf("photo validation failed: %w", err)
+    }
     src, err := file.Open()
```

---

### SEC-08 🟠 High — JWT Lifecycle: No Refresh, No Revocation, 72h Expiry

**File:** [jwt.go](file:///c:/Users/MOLKET012/wowrack-recruitment-2/recruitment/internal/util/jwt.go)

Current: Single 72-hour token with no refresh or revocation mechanism.

**Minimum viable fix — Short access token + refresh token:**

```go
// internal/util/jwt.go
package util

import (
    "os"
    "time"
    "github.com/golang-jwt/jwt/v5"
    "github.com/google/uuid"
)

var jwtSecret []byte

func init() {
    secret := os.Getenv("JWT_SECRET")
    if secret == "" || len(secret) < 32 {
        panic("JWT_SECRET must be set and >= 32 characters")
    }
    jwtSecret = []byte(secret)
}

type Claims struct {
    UserID uint   `json:"user_id"`
    Email  string `json:"email"`
    Role   string `json:"role"`
    jwt.RegisteredClaims
}

// Access token — short-lived (15 min)
func GenerateAccessToken(userID uint, email, role string) (string, error) {
    claims := Claims{
        UserID: userID,
        Email:  email,
        Role:   role,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            ID:        uuid.New().String(), // unique token ID for revocation
        },
    }
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString(jwtSecret) // ← HANDLE this error!
}

// Refresh token — longer-lived (7 days), stored in DB
func GenerateRefreshToken(userID uint) (string, error) {
    claims := jwt.RegisteredClaims{
        ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
        IssuedAt:  jwt.NewNumericDate(time.Now()),
        Subject:   fmt.Sprintf("%d", userID),
        ID:        uuid.New().String(),
    }
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString(jwtSecret)
}

func ValidateToken(tokenString string) (*Claims, error) {
    claims := &Claims{}
    token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
        }
        return jwtSecret, nil
    })
    if err != nil {
        return nil, fmt.Errorf("token validation failed: %w", err)
    }
    if !token.Valid {
        return nil, errors.New("invalid token")
    }
    return claims, nil
}
```

> [!IMPORTANT]
> For token revocation, store the `jti` (JWT ID) in a Redis blocklist. On logout, add the token's `jti` to the blocklist. The auth middleware checks the blocklist before accepting a token. This can be deferred to pre-production.

---

### SEC-09 🟠 High — Plaintext Passwords in Emails

**Files:** [candidate_application.go:194](file:///c:/Users/MOLKET012/wowrack-recruitment-2/recruitment/internal/service/application/candidate_application.go#L194), [auth_service.go:339](file:///c:/Users/MOLKET012/wowrack-recruitment-2/recruitment/internal/service/auth_service.go#L339)

Auto-generated passwords are sent in plaintext via email.

**Fix:** Replace with a one-time password-reset link pattern:

```go
// Instead of sending the password directly:
// 1. Generate a time-limited reset token (UUID, 24h expiry)
// 2. Store hash of token in DB with expiry
// 3. Send link: https://recruitment.wowrack.com/set-password?token=xxx
// 4. User sets their own password on first visit

// Quick interim fix if you can't build reset flow yet:
// At minimum, force password change on first login by adding a
// `MustChangePassword bool` field to the User model.
```

---

### SEC-10 🟠 High — CORS Wildcard

**File:** [main.go:101](file:///c:/Users/MOLKET012/wowrack-recruitment-2/recruitment/cmd/api/main.go#L101)

```diff
-    c.Header("Access-Control-Allow-Origin", "*")
+    allowedOrigins := map[string]bool{
+        "https://recruitment.wowrack.com": true,
+        "http://localhost:3000":           true, // dev only
+    }
+    origin := c.GetHeader("Origin")
+    if allowedOrigins[origin] {
+        c.Header("Access-Control-Allow-Origin", origin)
+        c.Header("Vary", "Origin")
+    }
```

---

### SEC-11 🟠 High — No Rate Limiting

No rate limiting on login, registration, or application endpoints.

**Add `golang.org/x/time/rate` based middleware:**

```go
// internal/middleware/ratelimit.go
package middleware

import (
    "net/http"
    "sync"
    "time"

    "github.com/gin-gonic/gin"
    "golang.org/x/time/rate"
)

type visitor struct {
    limiter  *rate.Limiter
    lastSeen time.Time
}

var (
    visitors = make(map[string]*visitor)
    mu       sync.Mutex
)

// Clean up old entries every 3 minutes
func init() {
    go func() {
        for {
            time.Sleep(3 * time.Minute)
            mu.Lock()
            for ip, v := range visitors {
                if time.Since(v.lastSeen) > 5*time.Minute {
                    delete(visitors, ip)
                }
            }
            mu.Unlock()
        }
    }()
}

func getVisitor(ip string, r rate.Limit, b int) *rate.Limiter {
    mu.Lock()
    defer mu.Unlock()
    v, exists := visitors[ip]
    if !exists {
        limiter := rate.NewLimiter(r, b)
        visitors[ip] = &visitor{limiter: limiter, lastSeen: time.Now()}
        return limiter
    }
    v.lastSeen = time.Now()
    return v.limiter
}

// RateLimit creates a per-IP rate limiter.
// r = requests per second, b = burst size
func RateLimit(r rate.Limit, b int) gin.HandlerFunc {
    return func(c *gin.Context) {
        ip := c.ClientIP()
        limiter := getVisitor(ip, r, b)
        if !limiter.Allow() {
            c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
                "error": "Too many requests. Please try again later.",
            })
            return
        }
        c.Next()
    }
}
```

**Usage in `main.go`:**

```go
auth.POST("/login", middleware.RateLimit(1, 5), userHandler.Login)         // 1 req/s, burst 5
auth.POST("/register", middleware.RateLimit(0.2, 3), userHandler.Register) // 1 req/5s, burst 3
api.POST("/jobs/:slug/apply", middleware.RateLimit(0.5, 3), applicationHandler.Apply)
```

---

### SEC-12 🟠 High — No Pipeline Transition Guards

**File:** [hr_application.go:74-76](file:///c:/Users/MOLKET012/wowrack-recruitment-2/recruitment/internal/service/application/hr_application.go#L74-L76)

Status can jump from any state to any other state (e.g., `hired` → `screening`).

```go
// internal/model/application.go — add valid transitions
var ValidTransitions = map[ApplicationStatus][]ApplicationStatus{
    AppApplied:                {AppScreening, AppRejected},
    AppScreening:              {AppContacted, AppRejected},
    AppContacted:              {AppHRInterview, AppRejected},
    AppHRInterview:            {AppHiringManagerInterview, AppRejected},
    AppHiringManagerInterview: {AppSalaryNegotiation, AppRejected},
    AppSalaryNegotiation:      {AppHired, AppRejected},
    // Terminal states: AppHired, AppRejected — no transitions out
}

func IsValidTransition(from, to ApplicationStatus) bool {
    allowed, exists := ValidTransitions[from]
    if !exists {
        return false
    }
    for _, s := range allowed {
        if s == to {
            return true
        }
    }
    return false
}
```

```diff
 // hr_application.go UpdateApplicationStatus
     newStatus := model.ApplicationStatus(req.Status)
-    oldStatus := app.Status
-    app.Status = newStatus
+    if !model.IsValidTransition(app.Status, newStatus) {
+        return fmt.Errorf("invalid transition: %s → %s", app.Status, newStatus)
+    }
+    app.Status = newStatus
```

---

### SEC-13 🟡 Medium — Hiring Manager Can Bypass HR Approval to Publish

**File:** [main.go:215](file:///c:/Users/MOLKET012/wowrack-recruitment-2/recruitment/cmd/api/main.go#L215)

```go
hiring_manager.PATCH("/jobs/:id/publish", jobHandler.Publish) // ← only HR should publish
```

The `Publish` service method checks `status == approved` but doesn't verify the **caller's role**. A Hiring Manager who somehow gets a job into "approved" state can publish it.

**Fix:** Move the publish route to the HR group, or add a role check inside the service:

```diff
-    hiring_manager.PATCH("/jobs/:id/publish", jobHandler.Publish)
+    // Publish belongs under HR, not Hiring Manager
+    hr.PATCH("/jobs/:id/publish", jobHandler.Publish)
```

---

### SEC-14 🟡 Medium — `GetAllUsers` Double-Checks Role in Handler AND Service

**Files:** [auth_handler.go:171](file:///c:/Users/MOLKET012/wowrack-recruitment-2/recruitment/internal/handlers/auth_handler.go#L171), [auth_service.go:401](file:///c:/Users/MOLKET012/wowrack-recruitment-2/recruitment/internal/service/auth_service.go#L401)

The route is under `admin.Use(middleware.AdminOnly())`, but both handler and service re-check the role — and the service allows `hr` and `hiring_manager`, contradicting the middleware.

**Fix:** Remove redundant checks. Trust the middleware. If HR should also see users, move the endpoint outside the admin group.

---

### SEC-15 🟡 Medium — No Audit Logging

No record of who changed application statuses, deleted accounts, created admin users, or approved/rejected jobs.

**Minimum viable approach — add an `audit_logs` table:**

```go
// internal/model/audit_log.go
type AuditLog struct {
    ID        uint      `gorm:"primaryKey"`
    UserID    uint      `gorm:"index"`
    Action    string    `gorm:"type:varchar(50);not null"`  // "status_change", "account_delete", etc.
    Entity    string    `gorm:"type:varchar(50)"`           // "application", "job", "user"
    EntityID  string    `gorm:"type:varchar(50)"`
    Details   string    `gorm:"type:jsonb"`                 // JSON with old/new values
    IP        string    `gorm:"type:varchar(45)"`
    CreatedAt time.Time
}
```

Log at the service layer:

```go
func (s *applicationService) UpdateApplicationStatus(ctx context.Context, appID uint, req dto.UpdateStatusRequest, actorID uint) error {
    // ... status update logic ...
    
    s.repo.GetDB().Create(&model.AuditLog{
        UserID:   actorID,
        Action:   "status_change",
        Entity:   "application",
        EntityID: fmt.Sprintf("%d", appID),
        Details:  fmt.Sprintf(`{"from":"%s","to":"%s"}`, oldStatus, newStatus),
    })
    return nil
}
```

---

## 2. Data Integrity & Transactions

### TXNR-01 🔴 Blocker — Apply Flow Has No Transaction

**File:** [candidate_application.go:55-139](file:///c:/Users/MOLKET012/wowrack-recruitment-2/recruitment/internal/service/application/candidate_application.go#L55-L139)

The `Apply` method performs 5 independent DB operations that must be atomic:

1. Find/create candidate user
2. Create application record
3. Increment `job.ApplicationCount`
4. Run AI scoring
5. Update application with AI results

If step 3 fails, you have an orphaned application. If step 5 fails, the AI score is lost.

**Fix with GORM transaction:**

```go
func (s *applicationService) Apply(ctx context.Context, req dto.ApplyJobRequest, jobSlug string, cvFile *multipart.FileHeader) (*dto.ApplicationResponse, error) {
    if err := s.validateApplyRequest(req, cvFile); err != nil {
        return nil, err
    }

    job, err := s.jobRepo.FindBySlug(jobSlug)
    if err != nil || job.Status != model.StatusPublished {
        return nil, errors.New("lowongan tidak ditemukan atau belum dipublish")
    }

    // Upload CV BEFORE transaction (external I/O should not hold DB locks)
    cvFilename, cvURL, err := s.uploadAndGetCVURL(ctx, cvFile)
    if err != nil {
        return nil, err
    }

    jdURL, _ := s.getJDURL(ctx, job.FileURL) // non-fatal

    var app *model.Application
    var candidate *model.User

    // ===== START TRANSACTION =====
    err = s.repo.GetDB().WithContext(ctx).Transaction(func(tx *gorm.DB) error {
        // Step 1: Find or create candidate
        var existingUser model.User
        result := tx.Where("email = ?", req.Email).First(&existingUser)
        if result.Error != nil && !errors.Is(result.Error, gorm.ErrRecordNotFound) {
            return result.Error
        }

        if result.RowsAffected > 0 {
            // Check duplicate application
            var count int64
            if err := tx.Model(&model.Application{}).
                Where("job_id = ? AND candidate_id = ?", job.ID, existingUser.ID).
                Count(&count).Error; err != nil {
                return err
            }
            if count > 0 {
                return errors.New("anda sudah melamar lowongan ini")
            }
            candidate = &existingUser
        } else {
            // Create new candidate
            password := util.GenerateRandomPassword()
            hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
            if err != nil {
                return err
            }
            candidate = &model.User{
                Name: req.Name, Email: req.Email, Password: string(hashed),
                Phone: req.Phone, Address: req.Address, LinkedIn: req.LinkedIn,
                Role: "candidate",
            }
            if err := tx.Create(candidate).Error; err != nil {
                return err
            }
            // Send welcome email AFTER transaction commits (see below)
        }

        // Step 2: Create application
        app = &model.Application{
            JobID: job.ID, CandidateID: candidate.ID,
            CVFilename: cvFilename, CVURL: cvURL,
            Status: model.AppApplied, AppliedAt: time.Now(),
        }
        if err := tx.Create(app).Error; err != nil {
            return err
        }

        // Step 3: Atomic counter increment (prevents race condition)
        if err := tx.Model(&model.Job{}).
            Where("id = ?", job.ID).
            UpdateColumn("application_count", gorm.Expr("application_count + 1")).
            Error; err != nil {
            return err
        }

        return nil // COMMIT
    })
    // ===== END TRANSACTION =====

    if err != nil {
        // Transaction rolled back — clean up uploaded CV
        _ = s.storageSvc.DeleteCV(ctx, cvFilename)
        return nil, err
    }

    // Step 4: AI scoring OUTSIDE transaction (slow, non-critical)
    score, matched, missing, explanation, aiErr := s.scoreWithAI(ctx, cvURL, jdURL)
    if aiErr != nil {
        s.logger.Error("AI scoring failed", zap.Error(aiErr), zap.Uint("app_id", app.ID))
        score = 0
        explanation = "Skor sedang dihitung..."
    }
    app.AIScore = score
    app.MatchedSkills = matched
    app.MissingSkills = missing
    app.AIExplanation = explanation
    s.repo.GetDB().WithContext(ctx).Save(app) // best-effort update

    // Emails AFTER everything succeeds
    go s.emailSvc.SendNewApplicationHRNotification(app)

    return &dto.ApplicationResponse{
        ID: app.ID, JobTitle: job.Title, AIScore: score,
        Status: "applied", CVURL: cvURL,
        AppliedAt: app.AppliedAt.Format("02 Jan 2006 15:04"),
        MatchedSkills: matched, MissingSkills: missing, Explanation: explanation,
    }, nil
}
```

> [!IMPORTANT]
> **Key principle:** External I/O (MinIO upload, AI HTTP call, email) goes **outside** the transaction. Only DB writes go inside.

---

### TXNR-02 🔴 Blocker — Race Condition in ApplicationCount

**File:** [candidate_application.go:103-107](file:///c:/Users/MOLKET012/wowrack-recruitment-2/recruitment/internal/service/application/candidate_application.go#L103-L107)

```go
// CURRENT — race condition under concurrent requests:
job.ApplicationCount++            // read-increment in Go memory
s.jobRepo.Update(job)             // write to DB — another goroutine may have incremented too
```

```diff
-    job.ApplicationCount++
-    if err := s.jobRepo.Update(job); err != nil {
-        s.logger.Warn("Failed to update job application count")
-    }
+    // Atomic DB-level increment:
+    if err := tx.Model(&model.Job{}).
+        Where("id = ?", job.ID).
+        UpdateColumn("application_count", gorm.Expr("application_count + 1")).
+        Error; err != nil {
+        return err
+    }
```

---

### TXNR-03 🟠 High — Withdraw Deletes Without Decrementing Count

**File:** [candidate_application.go:258-282](file:///c:/Users/MOLKET012/wowrack-recruitment-2/recruitment/internal/service/application/candidate_application.go#L258-L282)

`WithdrawApplication` hard-deletes the application but never decrements `job.ApplicationCount`.

```diff
 func (s *applicationService) WithdrawApplication(ctx context.Context, appID, candidateID uint) error {
     // ... validation ...
 
+    err := s.repo.GetDB().WithContext(ctx).Transaction(func(tx *gorm.DB) error {
+        if err := tx.Unscoped().Delete(&app).Error; err != nil {
+            return err
+        }
+        return tx.Model(&model.Job{}).
+            Where("id = ? AND application_count > 0", app.JobID).
+            UpdateColumn("application_count", gorm.Expr("application_count - 1")).Error
+    })
-    if err := s.repo.GetDB().WithContext(ctx).Unscoped().Delete(&app).Error; err != nil {
```

---

### TXNR-04 🟠 High — UpdateApplicationStatus Needs Transaction

**File:** [hr_application.go:67-119](file:///c:/Users/MOLKET012/wowrack-recruitment-2/recruitment/internal/service/application/hr_application.go#L67-L119)

Status update + meeting creation + `VisibleInPipeline` change should be atomic:

```go
err = s.repo.GetDB().WithContext(ctx).Transaction(func(tx *gorm.DB) error {
    app.Status = newStatus
    if newStatus == model.AppHired || newStatus == model.AppRejected {
        app.VisibleInPipeline = false
    }
    return tx.Save(&app).Error
})
if err != nil {
    return err
}
// Email & meeting creation AFTER commit
```

---

## 3. Basic Scalability Hygiene

### SCALE-01 🔴 — No Pagination on Critical List Endpoints

All of these return **unbounded result sets**:

| Endpoint | File | Impact |
|---|---|---|
| `GET /hr/applications` | `hr_application.go:15` | All applications globally |
| `GET /hr/jobs/:id/applications` | `hr_application.go:41` | All applications per job |
| `GET /hr/jobs` | `job_repository.go:70` | All jobs ever created |
| `GET /admin/users` | `auth_service.go:404` | All users |
| `GET /jobs` (public) | `job_repository.go:46` | All published jobs |

**Reusable pagination helper:**

```go
// internal/util/pagination.go
package util

import (
    "strconv"
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
)

type Pagination struct {
    Page  int `json:"page"`
    Limit int `json:"limit"`
    Total int64 `json:"total"`
}

func GetPagination(c *gin.Context) Pagination {
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
    if page < 1 { page = 1 }
    if limit < 1 { limit = 20 }
    if limit > 100 { limit = 100 }
    return Pagination{Page: page, Limit: limit}
}

func (p Pagination) Offset() int {
    return (p.Page - 1) * p.Limit
}

func Paginate(p Pagination) func(db *gorm.DB) *gorm.DB {
    return func(db *gorm.DB) *gorm.DB {
        return db.Offset(p.Offset()).Limit(p.Limit)
    }
}
```

**Usage example:**

```diff
 // handler
 func (h *hrApplicationHandler) GetAllApplications(c *gin.Context) {
+    pag := util.GetPagination(c)
-    apps, err := h.service.GetAllApplications(c.Request.Context())
+    apps, total, err := h.service.GetAllApplications(c.Request.Context(), pag.Page, pag.Limit)
     // ...
+    c.JSON(200, gin.H{"data": apps, "meta": gin.H{"page": pag.Page, "limit": pag.Limit, "total": total}})
 }

 // service
-func (s *applicationService) GetAllApplications(ctx context.Context) ([]dto.HRApplicationResponse, error) {
+func (s *applicationService) GetAllApplications(ctx context.Context, page, limit int) ([]dto.HRApplicationResponse, int64, error) {
     var apps []model.Application
+    var total int64
+    s.repo.GetDB().WithContext(ctx).Model(&model.Application{}).Where("visible_in_pipeline = ?", true).Count(&total)
     if err := s.repo.GetDB().WithContext(ctx).
         Preload("Job").Preload("Candidate").
         Where("visible_in_pipeline = ?", true).
+        Order("applied_at DESC").
+        Offset((page - 1) * limit).Limit(limit).
         Find(&apps).Error; err != nil {
-        return nil, err
+        return nil, 0, err
     }
     // ... build response
-    return res, nil
+    return res, total, nil
 }
```

---

### SCALE-02 🟠 — Missing Critical DB Indexes

Add this as a migration or call from `main.go`:

```go
// internal/config/migrations.go
func RunIndexMigrations(db *gorm.DB) {
    indexes := []string{
        // Applications — most queried table
        "CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)",
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_job_candidate ON applications(job_id, candidate_id)",
        "CREATE INDEX IF NOT EXISTS idx_applications_visible ON applications(visible_in_pipeline) WHERE visible_in_pipeline = true",

        // Jobs
        "CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)",
        "CREATE INDEX IF NOT EXISTS idx_jobs_department ON jobs(department_id)",
        "CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON jobs(created_by_id)",

        // Users
        "CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)",
    }
    for _, sql := range indexes {
        if err := db.Exec(sql).Error; err != nil {
            log.Printf("Index migration warning: %v", err)
        }
    }
}
```

---

### SCALE-03 🟠 — AI Scoring Is Synchronous (60s Timeout in Request Path)

**File:** [ai_scoring.go:22-23](file:///c:/Users/MOLKET012/wowrack-recruitment-2/recruitment/internal/service/application/ai_scoring.go#L22-L23)

The AI service has a 60-second HTTP timeout and is called **synchronously** inside the Apply handler.

**Minimum fix — move to goroutine with status tracking:**

```go
// In the Apply method, after the transaction commits:
app.AIScore = 0
app.AIExplanation = "Scoring in progress..."
s.repo.GetDB().Save(app)

// Score in background
go func() {
    ctx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
    defer cancel()
    
    score, matched, missing, explanation, err := s.aiSvc.ScoreCV(cvURL, jdURL)
    if err != nil {
        s.logger.Error("Background AI scoring failed", zap.Error(err), zap.Uint("app_id", app.ID))
        return
    }
    s.repo.GetDB().WithContext(ctx).Model(&model.Application{}).
        Where("id = ?", app.ID).
        Updates(map[string]interface{}{
            "ai_score":       score,
            "matched_skills": matched,
            "missing_skills": missing,
            "ai_explanation": explanation,
        })
}()
```

> [!TIP]
> For production, replace bare goroutines with a proper job queue like [Asynq](https://github.com/hibiken/asynq) backed by Redis. This gives you retry, dead-letter, monitoring, and concurrency control.

---

### SCALE-04 🟡 — N+1 Presigned URL Generation

**File:** [auth_service.go:409-421](file:///c:/Users/MOLKET012/wowrack-recruitment-2/recruitment/internal/service/auth_service.go#L409-L421)

`GetAllUsers` calls `getPhotoURL()` per row, which makes a network call to MinIO for each user.

**Fix:** Batch presigned URL generation or cache URLs:

```go
// Short-term: Skip presigned URLs for list endpoints, only generate on detail view
// Or: Cache presigned URLs in Redis with TTL matching their expiry (7 days)

// Quick fix — don't generate presigned URL in list:
for _, u := range users {
    photoURL := ""
    if u.Photo != "" {
        photoURL = "/api/v1/users/" + fmt.Sprintf("%d", u.ID) + "/photo" // proxy endpoint
    }
    resp = append(resp, response.UserResponse{
        // ...
        PhotoProfile: photoURL,
    })
}
```

---

## 4. Idiomatic Go — Core Rules

### GO-01 🔴 — Ignored Errors Throughout

**Before (15+ instances of ignored errors):**

```go
// jwt.go:30 — if signing fails, returns empty string used as valid token
signedToken, _ := token.SignedString(jwtSecret)

// main.go:137 — if bcrypt fails, hashed is nil → empty password stored
hashed, _ := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)

// job_handler.go:67 — if "abc" is passed as ID, id = 0 → matches wrong record
id, _ := strconv.Atoi(c.Param("id"))

// config/db.go:40 — if DB() fails, sqlDB is nil → panic on Ping
sqlDB, _ := DB.DB()
```

**After:**

```go
// jwt.go
func GenerateAccessToken(userID uint, email, role string) (string, error) {
    // ...
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    signed, err := token.SignedString(jwtSecret)
    if err != nil {
        return "", fmt.Errorf("failed to sign token: %w", err)
    }
    return signed, nil
}

// handler — propagate to caller
id, err := strconv.ParseUint(c.Param("id"), 10, 32)
if err != nil {
    util.RespError(c, http.StatusBadRequest, "Invalid ID", nil)
    return
}

// config/db.go
sqlDB, err := DB.DB()
if err != nil {
    log.Fatalf("Failed to get underlying SQL DB: %v", err)
}
```

---

### GO-02 🟠 — No `context.Context` Propagation in Auth/Job/Department Services

**Before:**

```go
// auth_service.go — every MinIO call uses context.Background()
_, err = minioClient.PutObject(context.Background(), bucketProfiles, filename, ...)

// job_service.go — no context at all
func (s *jobService) Create(req dto.CreateJobRequest, file *multipart.FileHeader, userID uint) (*dto.JobResponse, error) {
```

**After:**

```go
// All service methods accept context as first param
func (s *jobService) Create(ctx context.Context, req dto.CreateJobRequest, file *multipart.FileHeader, userID uint) (*dto.JobResponse, error) {
    // Pass ctx to all downstream calls
    _, err = s.minioClient.PutObject(ctx, s.bucket, filename, ...)
    // ...
    if err := s.repo.CreateWithContext(ctx, job); err != nil {
```

```go
// Handler passes Gin's context
func (h *jobHandler) Create(c *gin.Context) {
    data, err := h.service.Create(c.Request.Context(), req, file, userID)
```

---

### GO-03 🟠 — Global State Instead of Dependency Injection

**Before:**

```go
// config/db.go — global mutable variable
var DB *gorm.DB

// job_repository.go — depends on global
func (r *jobRepository) Create(job *model.Job) error {
    return config.DB.Create(job).Error  // ← import cycle risk, untestable
}

// auth_service.go — 3 separate global MinIO clients
var (
    once        sync.Once
    minioClient *minio.Client
    bucketProfiles string
)
```

**After:**

```go
// job_repository.go — injected dependency
type jobRepository struct {
    db *gorm.DB  // ← injected, not global
}

func NewJobRepository(db *gorm.DB) JobRepository {
    return &jobRepository{db: db}
}

func (r *jobRepository) Create(job *model.Job) error {
    return r.db.Create(job).Error
}
```

```go
// main.go — wire once
db := config.ConnectDB() // returns *gorm.DB instead of setting global

jobRepo := repository.NewJobRepository(db)
deptRepo := repository.NewDepartmentRepository(db)
// ...
```

```go
// Single MinIO client — internal/pkg/storage/storage.go
type Storage struct {
    client *minio.Client
    buckets map[string]string // "profiles", "jobs", "applications", "news"
}

func NewStorage() *Storage { /* one init */ }
func (s *Storage) Upload(ctx context.Context, bucket, path string, file *multipart.FileHeader) (string, error) { ... }
func (s *Storage) Delete(ctx context.Context, bucket, path string) error { ... }
func (s *Storage) PresignedURL(ctx context.Context, bucket, path string) (string, error) { ... }
```

---

### GO-04 🟠 — Mixed Logging (fmt/log vs zap)

**Before:**

```go
// auth_service.go — uses fmt.Printf and log.Printf
fmt.Printf("Foto berhasil dihapus dari MinIO: %s", user.Photo)
log.Printf("Gagal hapus photo lama: %v (file: %s)", err, user.Photo)

// application service — uses structured zap
s.logger.Error("Failed to create application", zap.Error(err), zap.Uint("candidate_id", candidate.ID))
```

**After:** Use zap everywhere. Pass `*zap.Logger` via constructor.

```go
// service constructor
func NewService(repo repository.Repository, logger *zap.Logger) Service {
    return &service{repository: repo, logger: logger}
}

// usage
s.logger.Warn("Failed to delete old photo",
    zap.Error(err),
    zap.String("filename", user.Photo),
    zap.Uint("user_id", user.ID),
)
```

```go
// main.go
logger, _ := zap.NewProduction()
defer logger.Sync()

userService := service.NewService(userRepo, logger)
jobService := service.NewJobService(jobRepo, logger)
```

> [!TIP]
> Create a `NewDevelopment()` logger for dev and `NewProduction()` for production. Never use `fmt.Println` or `log.Printf` in service code.

---

## Summary of All Findings

| ID | Category | Severity | Issue |
|---|---|---|---|
| SEC-01 | Security | 🔴 Blocker | Hardcoded JWT secret |
| SEC-02 | Security | 🔴 Blocker | Hardcoded DB credentials |
| SEC-03 | Security | 🔴 Blocker | `.env` committed with real credentials |
| SEC-04 | Security | 🔴 Blocker | Debug credential logging |
| SEC-05 | Security | 🔴 Blocker | Hardcoded admin setup secret |
| SEC-06 | Security | 🔴 Blocker | No CV file validation |
| SEC-07 | Security | 🔴 Blocker | No photo file validation |
| SEC-08 | Security | 🟠 High | JWT: no refresh, no revocation, 72h expiry |
| SEC-09 | Security | 🟠 High | Plaintext passwords in email |
| SEC-10 | Security | 🟠 High | CORS wildcard |
| SEC-11 | Security | 🟠 High | No rate limiting |
| SEC-12 | Security | 🟠 High | No pipeline transition guards |
| SEC-13 | Security | 🟡 Medium | Hiring Manager can publish (bypasses HR) |
| SEC-14 | Security | 🟡 Medium | Redundant role checks in handler + service |
| SEC-15 | Security | 🟡 Medium | No audit logging |
| TXNR-01 | Transactions | 🔴 Blocker | Apply flow has no transaction |
| TXNR-02 | Transactions | 🔴 Blocker | Race condition in ApplicationCount |
| TXNR-03 | Transactions | 🟠 High | Withdraw doesn't decrement count |
| TXNR-04 | Transactions | 🟠 High | Status update needs transaction |
| SCALE-01 | Scalability | 🔴 Blocker | No pagination on list endpoints |
| SCALE-02 | Scalability | 🟠 High | Missing critical DB indexes |
| SCALE-03 | Scalability | 🟠 High | Synchronous AI scoring (60s in request path) |
| SCALE-04 | Scalability | 🟡 Medium | N+1 presigned URL generation |
| GO-01 | Idiomatic Go | 🔴 Blocker | 15+ ignored errors (JWT, bcrypt, strconv) |
| GO-02 | Idiomatic Go | 🟠 High | No context.Context propagation |
| GO-03 | Idiomatic Go | 🟠 High | Global state instead of DI |
| GO-04 | Idiomatic Go | 🟠 High | Mixed unstructured logging |

**Total: 10 Blockers · 12 High · 5 Medium**
