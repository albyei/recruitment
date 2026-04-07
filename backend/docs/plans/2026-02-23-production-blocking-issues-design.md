# Desain Perbaikan Production-Blocking Issues

**Tanggal:** 2026-02-23
**Status:** Disetujui
**Jumlah Issue:** 11 Blocker (7 Security + 2 Transactions + 1 Scalability + 1 Idiomatic Go)

---

## Ringkasan

Dokumen ini mendefinisikan desain untuk memperbaiki 11 issue production-blocking yang ditemukan dalam review kode Wowrack Recruitment Portal. Perbaikan akan dilakukan dengan urutan **risk-based priority** dan menggunakan strategi **Blue-Green Deployment + Feature Flag**.

## Daftar 11 Issue Blocker

| No | ID | Kategori | Issue | Prioritas |
|----|----|----------|-------|-----------|
| 1 | SEC-03 | Security | `.env` committed dengan real credentials | CRITICAL |
| 2 | SEC-01 | Security | Hardcoded JWT secret | HIGH |
| 3 | SEC-02 | Security | Hardcoded DB credentials | HIGH |
| 4 | TXNR-01 | Transactions | Apply flow has no transaction | HIGH |
| 5 | SEC-05 | Security | Hardcoded admin setup secret | MEDIUM-HIGH |
| 6 | SEC-04 | Security | Debug credential logging | MEDIUM-HIGH |
| 7 | TXNR-02 | Transactions | Race condition di ApplicationCount | MEDIUM |
| 8 | SEC-06 | Security | No CV file validation | MEDIUM |
| 9 | SEC-07 | Security | No photo file validation | MEDIUM |
| 10 | SCALE-01 | Scalability | No pagination pada list endpoints | LOW-MEDIUM |
| 11 | GO-01 | Idiomatic Go | 15+ ignored errors | LOW-MEDIUM |

---

## 1. Arsitektur Secara Keseluruhan

Perbaikan akan dilakukan dalam **11 task terpisah**. Setiap task terdiri dari:
- Modifikasi kode untuk memperbaiki issue
- Unit test coverage lengkap
- Feature flag untuk safe deployment
- Dokumentasi perubahan

### Arsitektur High-Level

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Handlers → Services → Repositories → Database              │
│                                                             │
│  Middleware:                                                │
│  - Auth (JWT validation)                                    │
│  - File Validation (CV, Photo)                              │
│  - Feature Flag                                             │
│  - Rate Limiting (future)                                   │
└─────────────────────────────────────────────────────────────┘
         ↓                    ↓                    ↓
    Feature Flags         Storage            Database
       (Redis)            (MinIO)           (PostgreSQL)
```

---

## 2. Komponen Utama

### 2.1 Credential & Environment Management
- **File:** `internal/config/env.go`
- **Tujuan:** Centralized environment variable handling
- **Fitur:**
  - Loading semua environment variables
  - Validation untuk required env vars
  - Panic jika required env vars tidak ada

- **File:** `internal/config/validator.go`
- **Tujuan:** Validation helper untuk env vars
- **Fitur:**
  - Cek jika env var tidak kosong
  - Validasi minimum length untuk secrets

### 2.2 File Validation
- **File:** `internal/util/file_validation.go`
- **Tujuan:** Validasi file (CV, photo) dengan MIME type sniffing
- **Fitur:**
  - File size limit (CV: 10MB, Photo: 5MB)
  - Allowed extensions (.pdf, .doc, .docx, .jpg, .png, .webp)
  - MIME type sniffing (actual content, bukan header)
  - Reusable `ValidateFile()` function

### 2.3 Authentication & Authorization
- **File:** `internal/util/jwt.go`
- **Tujuan:** JWT handling dengan proper error handling
- **Fitur:**
  - JWT secret dari environment variable
  - Generate token dengan proper error handling
  - Validate token dengan proper error handling
  - (Post-MVP: Refresh token mechanism)

### 2.4 Transaction Management
- **File:** `internal/pkg/transaction/manager.go`
- **Tujuan:** Transaction wrapper untuk GORM
- **Fitur:**
  - `WithTransaction()` helper untuk atomic operations
  - Automatic rollback jika error
  - Cleanup orphaned files jika transaction gagal

### 2.5 Pagination
- **File:** `internal/util/pagination.go`
- **Tujuan:** Reusable pagination helper
- **Fitur:**
  - `GetPagination()` - parse page/limit dari query params
  - `Paginate()` - GORM scope untuk offset/limit
  - Default values dan max limit (100)

### 2.6 Feature Flag
- **File:** `internal/pkg/featureflag/client.go`
- **Tujuan:** Feature flag client untuk safe deployment
- **Fitur:**
  - Redis-based flag storage
  - Check flag dengan default value
  - Flags:
    - `enable_new_file_validation`
    - `enable_transaction_wrapper`
    - `enable_pagination`

---

## 3. Data Flow

### 3.1 Flow Apply Job (setelah perbaikan TXNR-01)

```
Request → Handler
    ↓
Validate Request (termasuk File Validation via SEC-06)
    ↓
Upload CV ke MinIO (OUTSIDE transaction - critical!)
    ↓
START TRANSACTION
    ↓
Find/Create Candidate User
    ↓
Create Application Record
    ↓
Atomic Increment Job.ApplicationCount (menggunakan gorm.Expr)
    ↓
COMMIT
    ↓
Jika GAGAL → Cleanup CV file dari MinIO (best-effort)
    ↓
AI Scoring (background goroutine - non-blocking)
    ↓
Send Email Notification (background goroutine - non-blocking)
    ↓
Response
```

### 3.2 Flow File Upload (setelah perbaikan SEC-06, SEC-07)

```
Request → Handler
    ↓
File Size Check (MaxCVSize: 10MB, MaxImageSize: 5MB)
    ↓
File Extension Check (allowedExt map)
    ↓
MIME Type Sniffing (actual content - 512 bytes)
    ↓
Jika Valid → Upload ke MinIO
    ↓
Jika Invalid → Return error 400
    ↓
Response
```

---

## 4. Error Handling

### 4.1 Error Categories

| Error Type | HTTP Status | Description |
|------------|-------------|-------------|
| `ErrValidation` | 400 | Input validation errors |
| `ErrUnauthorized` | 401 | Unauthorized (invalid/expired token) |
| `ErrForbidden` | 403 | Forbidden (insufficient permissions) |
| `ErrNotFound` | 404 | Resource not found |
| `ErrConflict` | 409 | Conflict (duplicate, invalid state transition) |
| `ErrInternal` | 500 | Internal server error |

### 4.2 Error Propagation

```
Handler
    ↓ (convert to HTTP status, wrap response)
Service
    ↓ (wrap with context, add details)
Repository
    ↓ (return GORM error)
Database
```

### 4.3 Error Handling Rules (GO-01)

- **TIDAK BOLEH** mengabaikan error menggunakan `_`
- Semua error harus diperiksa dan ditangani dengan benar
- Error harus di-propagate ke caller dengan proper wrapping
- Critical operations (JWT signing, bcrypt hashing) harus panic jika gagal

---

## 5. Testing Strategy

### 5.1 Test Structure

```
internal/
├── util/
│   ├── file_validation.go
│   └── file_validation_test.go
├── config/
│   ├── env.go
│   └── env_test.go
├── util/
│   ├── jwt.go
│   └── jwt_test.go
├── util/
│   ├── pagination.go
│   └── pagination_test.go
├── service/
│   └── application/
│       ├── candidate_application.go
│       └── candidate_application_test.go
├── pkg/
│   └── transaction/
│       ├── manager.go
│       └── manager_test.go
```

### 5.2 Test Types

#### Unit Test
- Test function individual dengan mock
- Test edge cases dan error scenarios
- Tidak menggunakan database eksternal

#### Integration Test
- Test dengan test database (PostgreSQL test container)
- Test transaction behavior
- Test file validation dengan actual file

#### End-to-End Test
- Test API endpoint secara end-to-end
- Test happy path dan error paths

### 5.3 Test Coverage Target
- **Minimum:** 80% code coverage
- **Critical paths:** 100% coverage (transaction, file validation, auth)

---

## 6. Deployment Strategy

### 6.1 Blue-Green Deployment

```
┌─────────────┐         ┌─────────────┐
│   Blue      │         │   Green     │
│  (Current)  │         │   (New)     │
└─────────────┘         └─────────────┘
       │                       │
       │ Load Balancer         │
       └───────────┬───────────┘
                   │
            Switch Traffic (Instant)
```

**Steps:**
1. Deploy versi baru ke Green environment
2. Run smoke tests di Green
3. Switch traffic ke Green
4. Monitor untuk errors/metrics
5. Jika OK → hapus Blue
6. Jika error → rollback ke Blue

### 6.2 Feature Flags

| Flag Name | Purpose | Default |
|-----------|---------|---------|
| `enable_new_file_validation` | Enable SEC-06, SEC-07 | false |
| `enable_transaction_wrapper` | Enable TXNR-01, TXNR-02 | false |
| `enable_pagination` | Enable SCALE-01 | false |
| `use_env_credentials` | Enable SEC-01, SEC-02 | false |
| `remove_debug_logs` | Enable SEC-04 | false |
| `fix_setup_endpoint` | Enable SEC-05 | false |

### 6.3 Feature Flag Rollout

**Phase 1:** Enable flags untuk subset pengguna (5%)
**Phase 2:** Monitor metrics/errors untuk 24 jam
**Phase 3:** Jika OK, rollout ke 50%
**Phase 4:** Jika OK, rollout ke 100%
**Phase 5:** Remove feature flag code setelah stabil

---

## 7. Cleanup Strategy (Post-MVP)

### 7.1 Scenario: File Upload Success + DB Failure

Ketika file berhasil di-upload ke MinIO tapi operasi database gagal, kita terjebak dengan **orphaned files** di storage.

### 7.2 Current Strategy: Immediate Cleanup

```go
// Upload sebelum transaction
cvFilename, cvURL, err := s.uploadAndGetCVURL(ctx, cvFile)
if err != nil {
    return nil, err
}

// Transaction
err = s.repo.GetDB().WithContext(ctx).Transaction(func(tx *gorm.DB) error {
    // ... DB operations ...
    return nil
})

// Jika transaction gagal → hapus file yang sudah di-upload
if err != nil {
    _ = s.storageSvc.DeleteCV(ctx, cvFilename) // best-effort
    return nil, err
}
```

**Kelebihan:** Simple, tidak ada orphaned files
**Kekurangan:** Jika aplikasi crash sebelum cleanup, file tetap orphaned

### 7.3 Future Strategy: Garbage Collection Job (Post-MVP)

```go
// Internal/pkg/storage/cleaner.go
type FileCleaner struct {
    db      *gorm.DB
    storage *Storage
}

func (c *FileCleaner) RunGC(ctx context.Context) error {
    // 1. Get all files in MinIO bucket
    files, _ := c.storage.ListFiles(ctx, "applications")

    // 2. Check each file exists in database
    for _, file := range files {
        var count int64
        c.db.Model(&model.Application{}).
            Where("cv_filename = ?", file.Name).
            Count(&count)

        if count == 0 {
            // File tidak ada di DB → orphaned
            c.storage.Delete(ctx, "applications", file.Name)
        }
    }
    return nil
}

// Jalankan sebagai cron job setiap 1 jam
go func() {
    ticker := time.NewTicker(1 * time.Hour)
    for range ticker.C {
        cleaner.RunGC(context.Background())
    }
}()
```

---

## 8. Detail Implementasi Per Issue

### SEC-03: `.env` committed dengan real credentials

**Files:**
- `.env` (remove from git)
- `.env.example` (create)
- `.gitignore` (update)

**Actions:**
1. Tambahkan `.env` ke `.gitignore`
2. Remove `.env` dari git tracking (bukan delete file lokal)
3. Create `.env.example` dengan placeholder values
4. **CRITICAL:** ROTATE semua credentials yang bocor:
   - DB_PASSWORD
   - S3_ACCESS_KEY / S3_SECRET_KEY
   - EMAIL_PASSWORD
   - JWT_SECRET

### SEC-01: Hardcoded JWT secret

**Files:**
- `internal/util/jwt.go`

**Actions:**
1. Ubah `jwtSecret` dari hardcoded ke environment variable
2. Tambahkan validation: minimum 32 characters
3. Panic jika `JWT_SECRET` tidak ada atau terlalu pendek

### SEC-02: Hardcoded DB credentials

**Files:**
- `internal/config/db.go`

**Actions:**
1. Hapus fallback credentials (real production values)
2. Buat semua DB env vars required
3. Tambahkan panic jika env vars tidak ada
4. Default `DB_SSLMODE` ke `require` (bukan `disable`)

### SEC-04: Debug credential logging

**Files:**
- `cmd/api/main.go`

**Actions:**
1. Remove debug log statements yang mencetak credentials
2. Replace dengan structured logging (jika perlu debugging)

### SEC-05: Hardcoded admin setup secret

**Files:**
- `cmd/api/main.go`

**Actions:**
1. Ubah hardcoded secret ke environment variable (`SETUP_SECRET`)
2. Tambahkan env var `ENABLE_SETUP_ENDPOINT` untuk disable di production
3. (Best practice post-MVP: Buat CLI command `cmd/setup/main.go`)

### SEC-06: No CV file validation

**Files:**
- `internal/util/file_validation.go` (create)
- `internal/service/application/candidate_application.go` (update)

**Actions:**
1. Create `ValidateFile()` helper dengan:
   - Size limit check (10MB)
   - Extension check (.pdf, .doc, .docx)
   - MIME type sniffing (actual content)
2. Integrate ke `validateApplyRequest()`

### SEC-07: No photo file validation

**Files:**
- `internal/service/auth_service.go` (update)

**Actions:**
1. Gunakan `ValidateFile()` helper untuk photo validation
2. Size limit check (5MB)
3. Extension check (.jpg, .jpeg, .png, .webp)
4. MIME type sniffing

### TXNR-01: Apply flow has no transaction

**Files:**
- `internal/service/application/candidate_application.go` (update)

**Actions:**
1. Wrap DB operations dalam GORM transaction:
   - Find/create candidate user
   - Create application record
   - Increment job.ApplicationCount (atomic)
2. Upload CV dan AI scoring di-luar transaction
3. Cleanup CV file jika transaction gagal

### TXNR-02: Race condition di ApplicationCount

**Files:**
- `internal/service/application/candidate_application.go` (update)

**Actions:**
1. Gunakan `gorm.Expr("application_count + 1")` untuk atomic increment
2. Hindari read-modify-write di Go memory

### SCALE-01: No pagination pada list endpoints

**Files:**
- `internal/util/pagination.go` (create)
- Multiple handler files (update)

**Actions:**
1. Create reusable pagination helper:
   - `GetPagination()` - parse query params
   - `Paginate()` - GORM scope
2. Update semua list endpoints:
   - `/hr/applications`
   - `/hr/jobs/:id/applications`
   - `/hr/jobs`
   - `/admin/users`
   - `/jobs` (public)
3. Return metadata: `{ data: [...], meta: { page, limit, total } }`

### GO-01: 15+ ignored errors

**Files:**
- Multiple files (update)

**Actions:**
1. Cari semua `_, err :=` dan `_ :=` untuk error returns
2. Tambahkan proper error handling:
   - Critical operations → return error atau panic
   - Non-critical → log error tapi lanjut
3. Fokus pada:
   - `jwt.go` - `SignedString()` error
   - `main.go` - `bcrypt.GenerateFromPassword()` error
   - Handlers - `strconv.Atoi()` error
   - `db.go` - `DB.DB()` error

---

## 9. Checklist Implementasi

- [ ] SEC-03: Remove `.env` from git, create `.env.example`, rotate credentials
- [ ] SEC-01: Fix hardcoded JWT secret
- [ ] SEC-02: Fix hardcoded DB credentials
- [ ] SEC-04: Remove debug credential logging
- [ ] SEC-05: Fix hardcoded admin setup secret
- [ ] SEC-06: Add CV file validation
- [ ] SEC-07: Add photo file validation
- [ ] TXNR-01: Add transaction to apply flow
- [ ] TXNR-02: Fix race condition in ApplicationCount
- [ ] SCALE-01: Add pagination to list endpoints
- [ ] GO-01: Fix all ignored errors
- [ ] Write unit tests untuk semua perubahan
- [ ] Write integration tests untuk transaction & validation
- [ ] Add feature flags
- [ ] Deploy ke staging dengan blue-green deployment
- [ ] Rollout feature flags secara bertahap
- [ ] Monitor metrics dan errors
- [ ] Full deployment ke production

---

## 10. Timeline Estimasi

| Task | Estimasi |
|------|----------|
| SEC-03 (Credential rotation) | 1-2 hari (termasuk koordinasi team infra) |
| SEC-01, SEC-02 (Credential handling) | 1 hari |
| TXNR-01 (Transaction) | 1 hari |
| SEC-05, SEC-04 (Setup & Logs) | 0.5 hari |
| TXNR-02 (Race condition) | 0.5 hari |
| SEC-06, SEC-07 (File validation) | 1 hari |
| SCALE-01 (Pagination) | 1 hari |
| GO-01 (Error handling) | 1 hari |
| Testing & Code Review | 2-3 hari |
| Deployment & Rollout | 1-2 hari |
| **Total** | **~10-12 hari** |

---

## 11. References

- [GORM Transaction Documentation](https://gorm.io/docs/transactions.html)
- [Go File Sniffing (http.DetectContentType)](https://pkg.go.dev/net/http#DetectContentType)
- [Blue-Green Deployment Pattern](https://martinfowler.com/bliki/BlueGreenDeployment.html)
- [Feature Flags Best Practices](https://martinfowler.com/articles/feature-toggles.html)
