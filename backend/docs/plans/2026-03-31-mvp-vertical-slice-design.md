# Recruitment MVP - Vertical Slice Design

**Date:** 2026-03-31
**Status:** Design Approved
**Approach:** Vertical Slice First

---

## Executive Summary

This document outlines the design for a Minimum Viable Product (MVP) of the recruitment system backend, using a Vertical Slice approach to deliver working functionality incrementally.

**Approach Chosen:** Vertical Slice First - build complete user journeys end-to-end before expanding features.

**Total Estimated Effort:** ~4 weeks

**Timeline:**
- Week 1: Complete Candidate Apply Flow
- Week 2: Complete HR Management Flow
- Week 3: Active Vacancies & Polish
- Week 4: Deploy to Staging & Test

---

## 1. Overall Architecture

### 1.1 Simplified MVP Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Candidate  │  │      HR      │  │     Admin    │ │
│  │   Pages      │  │    Pages     │  │    Pages     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    API Layer (Gin)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Auth MW    │  │   Role MW    │  │   Error MW   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Candidate  │  │     HR       │  │    Admin     │ │
│  │   Handlers   │  │   Handlers   │  │   Handlers   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Service Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Auth Svc   │  │  Application │  │    Job Svc   │ │
│  │              │  │     Svc      │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                 Repository Layer (GORM)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   User Repo  │  │ Application  │  │    Job Repo  │ │
│  │              │  │    Repo      │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│               PostgreSQL + MinIO (Files)                │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Key Architectural Decisions for MVP

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Role system | Multi-role with junction table | Required by stakeholders |
| Pipeline | Simple status string field | MVP - defer configurable pipeline |
| Email | Simple `text/template` or manual | Defer full email system |
| Survey | None for MVP | Manual HR follow-up |
| Auth | JWT with role array | Already in design, keep |

---

## 2. Database Schema Changes

### 2.1 Multi-Role Support

**New Table: `user_roles` (junction table)**
```sql
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, role)
);
```

**User Model Changes:**
- Remove single `role` field
- Add `Roles []Role` via GORM `many2many` relationship
- JWT claims: Include array of roles instead of single role

### 2.2 Application Form Changes

**Modify `applications` table:**
```sql
ALTER TABLE applications ADD COLUMN terms_accepted BOOLEAN DEFAULT FALSE;
ALTER TABLE applications ADD COLUMN whatsapp_number VARCHAR(20);
ALTER TABLE applications ADD COLUMN domicile_city VARCHAR(100);
ALTER TABLE applications ADD COLUMN domicile_province VARCHAR(100);
ALTER TABLE applications ADD COLUMN last_work_role VARCHAR(100);
ALTER TABLE applications ADD COLUMN last_work_company VARCHAR(100);
ALTER TABLE applications ADD COLUMN last_work_from DATE;
ALTER TABLE applications ADD COLUMN last_work_to DATE;
ALTER TABLE applications ADD COLUMN university VARCHAR(200);
```

### 2.3 Job/Pipeline Changes

**Add to `jobs` table:**
```sql
ALTER TABLE jobs ADD COLUMN date_needed DATE;
ALTER TABLE jobs ADD COLUMN special_needs TEXT;
ALTER TABLE jobs ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN benefits TEXT;
```

**Simple Status Flow (MVP):**
```go
const (
    StatusApplied     = "applied"
    StatusSelected    = "selected"
    StatusInterviewed  = "interviewed"
    StatusHired       = "hired"
    StatusRejected    = "rejected"
)
```

---

## 3. API Endpoints (MVP)

### 3.1 Candidate Endpoints

```
GET    /api/v1/jobs/:slug                    - Get job details (public)
POST   /api/v1/jobs/:slug/apply              - Submit application (public)
```

### 3.2 HR Endpoints

```
POST   /api/v1/auth/login                     - Login
GET    /api/v1/hr/applications                - List applications
GET    /api/v1/hr/applications/:id            - Get application detail
PATCH  /api/v1/hr/applications/:id/status     - Update application status
GET    /api/v1/hr/active-vacancies            - List active jobs
GET    /api/v1/hr/active-vacancies/:id        - Get active vacancy details
```

### 3.3 Admin Endpoints (Multi-Role Management)

```
GET    /api/v1/roles                          - List all available roles
GET    /api/v1/users/:id/roles                - Get user's roles
POST   /api/v1/admin/users/:id/roles           - Add role to user
DELETE /api/v1/admin/users/:id/roles/:role     - Remove role from user
```

---

## 4. Components by Slice

### Slice 1: Candidate Journey (Week 1)

| Component | Purpose | Files |
|-----------|---------|-------|
| `AuthMiddleware` | Verify JWT, extract roles | `internal/middleware/auth.go` |
| `RoleMiddleware` | Check `HasRole("candidate")` | `internal/middleware/role.go` |
| `CandidateHandler` | Handle candidate requests | `internal/handlers/candidate_handler.go` |
| `ApplicationService` | Business logic for apply flow | `internal/service/application/...` |
| `ApplicationRepository` | DB operations | `internal/repository/application_repository.go` |
| `UserRepository` | Multi-role user operations | `internal/repository/user_repository.go` |
| `ApplicationDTO` | Request/response models | `internal/dto/application.go` |

**New DTO Fields for Application:**
```go
type CreateApplicationDTO struct {
    TermsAccepted       bool   `json:"terms_accepted" binding:"required"`
    WhatsAppNumber      string `json:"whatsapp_number" binding:"required"`
    DomicileCity        string `json:"domicile_city" binding:"required"`
    DomicileProvince    string `json:"domicile_province" binding:"required"`
    LastWorkRole        string `json:"last_work_role"`
    LastWorkCompany     string `json:"last_work_company"`
    LastWorkFrom        string `json:"last_work_from"`
    LastWorkTo          string `json:"last_work_to"`
    University          string `json:"university"`
    // ... existing fields (CV, photo, etc.)
}
```

### Slice 2: HR Journey (Week 2)

| Component | Purpose | Files |
|-----------|---------|-------|
| `HrMiddleware` | Check `HasRole("hr")` | `internal/middleware/role.go` |
| `HrHandler` | HR-specific endpoints | `internal/handlers/hr_application_handler.go` |
| `JobService` | Active vacancies logic | `internal/service/job_service.go` |
| `JobRepository` | DB operations | `internal/repository/job_repository.go` |
| `JobDTO` | Active vacancy response | `internal/dto/job.go` |

**New Job Fields:**
```go
type Job struct {
    // ... existing fields
    DateNeeded    *time.Time `json:"date_needed,omitempty"`
    SpecialNeeds  string     `json:"special_needs,omitempty"`
    Benefits      string     `json:"benefits,omitempty"`
    IsArchived    bool       `json:"is_archived" gorm:"default:false"`
}
```

### Slice 3: Active Vacancies (Week 2.5)

**Query Logic:**
```sql
SELECT * FROM jobs
WHERE status = 'published'
  AND is_archived = false
ORDER BY created_at DESC
```

### Slice 4: Polish (Week 3)

| Component | Purpose | Files |
|-----------|---------|-------|
| `ValidationMiddleware` | Input validation | `internal/middleware/validation.go` |
| `ErrorHandler` | Consistent error responses | `internal/middleware/error.go` |
| `LoggerMiddleware` | Request logging | `internal/middleware/logger.go` |
| Test files | Unit/integration tests | `**/*_test.go` |

---

## 5. Error Handling

### 5.1 Error Response Format

```go
type ErrorResponse struct {
    Error   string `json:"error"`
    Message string `json:"message,omitempty"`
    Field   string `json:"field,omitempty"`
}
```

### 5.2 Error Categories & HTTP Codes

| Category | HTTP Code | Example |
|----------|-----------|---------|
| Validation | 400 | Missing `terms_accepted` |
| Authentication | 401 | Invalid/expired JWT |
| Authorization | 403 | HR trying to access admin endpoint |
| Not Found | 404 | Job slug doesn't exist |
| Conflict | 409 | Already applied for this job |
| Internal | 500 | Database connection failed |

### 5.3 Critical Validation Rules (MVP)

| Rule | Context | Validation |
|------|---------|------------|
| Terms accepted | Application submit | Must be `true` |
| WhatsApp format | Application submit | Must match Indo phone pattern |
| Date format | Work experience | Must be valid date, `to` ≥ `from` |
| Job exists | Application submit | Check slug in DB |
| Job status | Application submit | Must be `published`, not archived |
| Status transition | HR update | Must be valid transition |
| Last role | User role update | Cannot remove user's only role |
| File type | Upload | Must match whitelist (PDF, JPG, PNG) |
| File size | Upload | CV ≤ 5MB, Photo ≤ 2MB |

---

## 6. Testing Strategy

### 6.1 Test Coverage Targets

| Slice | Unit | Integration | E2E |
|-------|------|-------------|-----|
| Slice 1: Candidate Apply | 70% | 50% | 30% |
| Slice 2: HR Journey | 70% | 50% | 30% |
| Slice 3: Active Vacancies | 60% | 40% | 20% |
| Slice 4: Polish | 60% | 30% | N/A |

**Target: Overall 65% code coverage for MVP**

### 6.2 Key Test Scenarios

**Unit Tests:**
- `ApplicationService_Create_Success` - Valid application created
- `ApplicationService_Create_TermsNotAccepted` - Reject when false
- `ApplicationService_Create_AlreadyApplied` - Reject duplicate
- `ApplicationService_Create_JobNotFound` - Invalid job
- `HrService_UpdateStatus_ValidTransition` - Valid status change
- `HrService_UpdateStatus_InvalidTransition` - Invalid transition
- `AuthMiddleware_ValidToken` - Valid JWT passes
- `RoleMiddleware_HasRole` - Role checking

**Integration Tests:**
- `POST_JobsSlugApply_FullFlow` - Complete application flow
- `GET_HrApplications_Authentication` - Auth checks

**E2E Tests:**
- `TestE2E_CandidateApplyFlow` - End-to-end candidate journey
- `TestE2E_HRWorkflowFlow` - End-to-end HR journey
- `TestE2E_MultiRoleFlow` - Multi-role auth test

---

## 7. Data Migration

### 7.1 Database Migration

**Migration File: `migrations/YYYYMMDD_add_mvp_fields.up.sql`**
```sql
-- Multi-role support
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Backfill existing users
INSERT INTO user_roles (user_id, role, created_at)
SELECT id, role, created_at FROM users WHERE role IS NOT NULL;

-- Application form fields
ALTER TABLE applications ADD COLUMN terms_accepted BOOLEAN DEFAULT FALSE;
ALTER TABLE applications ADD COLUMN whatsapp_number VARCHAR(20);
ALTER TABLE applications ADD COLUMN domicile_city VARCHAR(100);
ALTER TABLE applications ADD COLUMN domicile_province VARCHAR(100);
ALTER TABLE applications ADD COLUMN last_work_role VARCHAR(100);
ALTER TABLE applications ADD COLUMN last_work_company VARCHAR(100);
ALTER TABLE applications ADD COLUMN last_work_from DATE;
ALTER TABLE applications ADD COLUMN last_work_to DATE;
ALTER TABLE applications ADD COLUMN university VARCHAR(200);

-- Job fields
ALTER TABLE jobs ADD COLUMN date_needed DATE;
ALTER TABLE jobs ADD COLUMN special_needs TEXT;
ALTER TABLE jobs ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN benefits TEXT;
```

**Migration File: `migrations/YYYYMMDD_add_mvp_fields.down.sql`**
```sql
DROP TABLE IF EXISTS user_roles;
ALTER TABLE applications DROP COLUMN terms_accepted;
ALTER TABLE applications DROP COLUMN whatsapp_number;
ALTER TABLE applications DROP COLUMN domicile_city;
ALTER TABLE applications DROP COLUMN domicile_province;
ALTER TABLE applications DROP COLUMN last_work_role;
ALTER TABLE applications DROP COLUMN last_work_company;
ALTER TABLE applications DROP COLUMN last_work_from;
ALTER TABLE applications DROP COLUMN last_work_to;
ALTER TABLE applications DROP COLUMN university;
ALTER TABLE jobs DROP COLUMN date_needed;
ALTER TABLE jobs DROP COLUMN special_needs;
ALTER TABLE jobs DROP COLUMN is_archived;
ALTER TABLE jobs DROP COLUMN benefits;
```

---

## 8. Implementation Timeline

### Week 1: Candidate Apply Flow (Foundation)

| Day | Tasks |
|-----|-------|
| Day 1 | Multi-role database + migration, JWT updates |
| Day 2 | Auth middleware, Role middleware |
| Day 3 | Application DTO, Repository layer |
| Day 4 | ApplicationService (transaction handling) |
| Day 5 | CandidateHandler, Integration tests |

### Week 2: HR Management Flow

| Day | Tasks |
|-----|-------|
| Day 1 | JobService, JobRepository (active vacancies) |
| Day 2 | HR Application handlers (list, view) |
| Day 3 | Status update endpoint with transaction |
| Day 4 | Active vacancies page endpoint |
| Day 5 | Integration tests for HR flow |

### Week 3: Polish & Edge Cases

| Day | Tasks |
|-----|-------|
| Day 1 | Error handling middleware |
| Day 2 | Input validation refinements |
| Day 3 | Security review, authorization checks |
| Day 4 | Unit tests, improve coverage |
| Day 5 | Bug fixes, documentation |

### Week 4: Deploy to Staging & Test

| Day | Tasks |
|-----|-------|
| Day 1 | Staging environment setup |
| Day 2 | Deploy to staging, smoke tests |
| Day 3 | E2E testing on staging |
| Day 4 | Bug fixes from staging review |
| Day 5 | Final review, UAT with stakeholders |

---

## 9. Deployment Strategy

### 9.1 Staging Deployment

**Environment:**
- Subdomain: Generated random (e.g., `rec-abc123.staging.wowrack.com`)
- Database: Separate staging PostgreSQL instance
- MinIO: Separate staging bucket
- Environment: `ENVIRONMENT=staging`

**Process:**
1. Create staging branch from main
2. Run all tests (unit, integration, E2E)
3. Build Docker image
4. Deploy to staging VPS
5. Run smoke tests
6. Share URL with Elzanna and Andy
7. Gather feedback
8. Fix issues
9. Repeat until approval

### 9.2 Production Deployment

**Prerequisites:**
- All tests passing
- Staging approved by stakeholders
- Database migrations tested on staging
- Rollback plan documented

**Process:**
1. Create production release branch
2. Deploy to production during low-traffic window
3. Run production smoke tests
4. Monitor for 1 hour
5. If issues: Execute rollback plan

---

## 10. Rollback Plan

### 10.1 Application Rollback
- Revert to previous Docker image tag
- No database rollback needed (backward compatible changes)

### 10.2 Database Rollback
- Run down migration files if schema changes cause issues
- Restore from pre-deployment backup if needed

---

## 11. Deferred Features (Post-MVP)

| Feature | Deferred For | Reason |
|--------|--------------|--------|
| Survey system | Phase 3 | Manual HR follow-up for MVP |
| Email templates | Phase 3 | Simple emails for MVP |
| Configurable pipelines | Phase 3 | Simple status flow for MVP |
| Interview types table | Phase 2 | String field for MVP |
| Full search/filters | Post-MVP | Basic list for MVP |

---

## 12. Summary

**MVP Scope:**
- Multi-role authentication system
- Enhanced candidate application form
- Basic application status management
- Active vacancies for HR
- File upload with validation
- Transaction handling for data integrity

**Timeline:** 4 weeks
**Effort:** ~160 hours
**Test Coverage Target:** 65%

**Next Steps:**
1. Create detailed implementation plan
2. Set up development branch for Week 1
3. Begin Week 1 implementation
