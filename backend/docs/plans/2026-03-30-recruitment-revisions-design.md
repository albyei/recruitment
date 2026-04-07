# Recruitment System Revisions - Design Document

**Date:** 2026-03-30
**Status:** Design Approved
**Approach:** Incremental Phased Rollout

---

## Executive Summary

This document outlines the design for comprehensive revisions to the recruitment system backend. The changes span candidate experience, HR workflow, hiring manager features, admin capabilities, and deployment readiness.

**Approach Chosen:** Incremental Phased Rollout - breaks down revisions into 3 phases for faster value delivery and reduced risk.

**Total Estimated Effort:** ~240 hours (6-9 weeks)

**Stakeholder Requirements:**
- Multi-role: Any combination allowed
- Pipelines: Predefined stages (Admin defines) + configurable per job (HR selects)
- Surveys: Triggered at end of process (hired/rejected)
- University: Frontend handles API, backend receives free text

---

## 1. Database Schema Changes

### 1.1 Multi-Role Support

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

### 1.2 Application Form Changes

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

### 1.3 Job/Pipeline Changes

**Add to `jobs` table:**
```sql
ALTER TABLE jobs ADD COLUMN date_needed DATE;
ALTER TABLE jobs ADD COLUMN special_needs TEXT;
ALTER TABLE jobs ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;
```

**New Table: `job_pipeline_stages`**
```sql
CREATE TABLE job_pipeline_stages (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    stage_name VARCHAR(50) NOT NULL,
    stage_order INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Pipeline Stage Definitions (from stakeholder):**
1. Applied
2. Selected
3. Contacted
4. HR Interview
5. User Interview
6. Salary Negotiation
7. Hired / Rejected

### 1.4 Survey System

**New Table: `survey_templates`**
```sql
CREATE TABLE survey_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    trigger_on VARCHAR(20) NOT NULL, -- 'hired' or 'rejected'
    created_by_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

**New Table: `survey_questions`**
```sql
CREATE TABLE survey_questions (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES survey_templates(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL, -- 'text', 'rating', 'choice'
    options JSONB, -- for choice questions
    is_required BOOLEAN DEFAULT TRUE,
    question_order INTEGER NOT NULL
);
```

**New Table: `survey_responses`**
```sql
CREATE TABLE survey_responses (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    template_id INTEGER REFERENCES survey_templates(id),
    answered_at TIMESTAMP DEFAULT NOW()
);
```

**New Table: `survey_answers`**
```sql
CREATE TABLE survey_answers (
    id SERIAL PRIMARY KEY,
    response_id INTEGER REFERENCES survey_responses(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES survey_questions(id),
    answer TEXT NOT NULL
);
```

### 1.5 Interview Types

**New Table: `interview_types`**
```sql
CREATE TABLE interview_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);
```

**Seed Data:**
- HR Interview
- Hiring Manager Interview
- Technical Interview (new)
- Director Interview (new)

### 1.6 Rejection Emails

**New Table: `email_templates`**
```sql
CREATE TABLE email_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    subject VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    template_type VARCHAR(50) NOT NULL, -- 'rejection'
    is_default BOOLEAN DEFAULT FALSE
);
```

---

## 2. API Endpoints Overview

### 2.1 Multi-Role Endpoints
```
GET    /api/v1/roles                          - List all available roles
GET    /api/v1/users/:id/roles                - Get user's roles
POST   /api/v1/admin/users/:id/roles           - Add role to user (Admin only)
DELETE /api/v1/admin/users/:id/roles/:role     - Remove role from user (Admin only)
```

### 2.2 Survey Endpoints (Admin/HR)
```
GET    /api/v1/survey-templates                - List survey templates
POST   /api/v1/survey-templates               - Create survey template
GET    /api/v1/survey-templates/:id            - Get template with questions
PUT    /api/v1/survey-templates/:id            - Update template
DELETE /api/v1/survey-templates/:id            - Delete template

GET    /api/v1/survey-templates/:id/questions  - Get template questions
POST   /api/v1/survey-templates/:id/questions  - Add question
PUT    /api/v1/survey-questions/:id             - Update question
DELETE /api/v1/survey-questions/:id             - Delete question
```

### 2.3 Survey Endpoints (Candidate)
```
GET    /api/v1/candidate/surveys/:application_id - Get survey for application
POST   /api/v1/candidate/surveys/:application_id - Submit survey response
```

### 2.4 Pipeline Management (HR)
```
GET    /api/v1/hr/jobs/:id/pipeline           - Get job's pipeline stages
POST   /api/v1/hr/jobs/:id/pipeline           - Set pipeline stages (select from predefined)
PUT    /api/v1/hr/jobs/:id/pipeline/:stage_id  - Reorder stage
DELETE /api/v1/hr/jobs/:id/pipeline/:stage_id  - Remove stage

GET    /api/v1/pipeline/stages                 - List all predefined stages (Admin to manage)
POST   /api/v1/pipeline/stages                 - Create new predefined stage (Admin)
PUT    /api/v1/pipeline/stages/:id             - Update predefined stage (Admin)
DELETE /api/v1/pipeline/stages/:id             - Delete predefined stage (Admin)
```

### 2.5 Active Vacancies (HR/Admin)
```
GET    /api/v1/hr/active-vacancies            - List active jobs (status=published, not archived)
GET    /api/v1/hr/active-vacancies/:id        - Get active vacancy details
```

### 2.6 Rejection Email (HR)
```
GET    /api/v1/hr/email-templates             - List email templates
POST   /api/v1/hr/applications/:id/reject     - Reject and send email
```

### 2.7 Interview Types (Admin)
```
GET    /api/v1/admin/interview-types          - List all interview types
POST   /api/v1/admin/interview-types          - Create interview type
PUT    /api/v1/admin/interview-types/:id      - Update interview type
DELETE /api/v1/admin/interview-types/:id      - Delete interview type
```

### 2.8 Department Management (Admin)
```
GET    /api/v1/admin/departments             - List departments (same endpoints as HR, but for Admin)
POST   /api/v1/admin/departments             - Create department
PUT    /api/v1/admin/departments/:id         - Update department
DELETE /api/v1/admin/departments/:id         - Delete department
```

### 2.9 Job Archive (HR/Admin)
```
PATCH  /api/v1/hr/jobs/:id/archive          - Archive job (soft close)
PATCH  /api/v1/hr/jobs/:id/unarchive        - Unarchive job
```

### 2.10 Candidate Application Updates
```
POST   /api/v1/jobs/:slug/apply            - Updated: include terms_accepted, whatsapp, domicile, work experience, university
```

---

## 3. Architecture Changes

### 3.1 Multi-Role Authorization Architecture

**Current (Single Role):**
```
User ── role: "hr" ──┐
                     ├──→ HrOnly Middleware
                     └──→ Check: user.Role == "hr"
```

**New (Multi-Role):**
```
User ── roles: ["hr", "hiring_manager"] ──┐
                                   ├──→ HasRole("hr")
                                   ├──→ HasRole("hiring_manager")
                                   └──→ HasAnyRole([]string{"hr", "admin"})
```

**New Middleware Functions:**
- `HasRole(role string)` - Checks if user has specific role
- `HasAnyRole(roles []string)` - Checks if user has ANY of the roles
- `HasAllRoles(roles []string)` - Checks if user has ALL the roles

**JWT Claims Update:**
```go
type Claims struct {
    UserID uint     `json:"user_id"`
    Email  string   `json:"email"`
    Roles  []string `json:"roles"`  // Changed from single role
    jwt.RegisteredClaims
}
```

### 3.2 Pipeline Configuration Architecture

```
┌─────────────────────────────────────────────────────┐
│         Predefined Stages (Admin Managed)          │
│  Applied, Selected, Contacted, HR Interview,     │
│  User Interview, Technical, Director, etc.        │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│     Job Pipeline Configuration (HR Managed)        │
│  Job: Software Engineer                           │
│  Stages: [Applied, Selected, Contacted,           │
│           HR Interview, Hired]                     │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│         Application Status Tracking               │
│  Application status maps to current pipeline stage │
└─────────────────────────────────────────────────────┘
```

### 3.3 Survey Trigger Architecture

```
┌─────────────────────┐       ┌─────────────────────┐
│  Application Status │ ──→   │  Status Changed     │
│  : "hired"         │       │   Event Triggered    │
└─────────────────────┘       └─────────────────────┘
                                      │
                                      ▼
                           ┌─────────────────────┐
                           │  Check if Survey    │
                           │  Exists for Status  │
                           └─────────────────────┘
                                      │
                                      ▼
                    ┌──────────────────────────────┐
                    │  Create Survey Response      │
                    │  with pending status        │
                    └──────────────────────────────┘
                                      │
                                      ▼
                    ┌──────────────────────────────┐
                    │  Send Email/Notification     │
                    │  to Candidate              │
                    └──────────────────────────────┘
```

### 3.4 Email Service Architecture

```
┌─────────────────────────────────────────────────────┐
│          Email Templates                          │
│  - Rejection (Default)                          │
│  - Rejection (Custom 1)                         │
│  - Rejection (Custom 2)                         │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│      Template Renderer (Go Templates)             │
│  Variables: {{.CandidateName}}, {{.JobTitle}},   │
│              {{.Reason}}, {{.Company}}            │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│         SMTP Service                              │
│  - Queue emails                                   │
│  - Retry logic                                    │
│  - Track delivery status                          │
└─────────────────────────────────────────────────────┘
```

---

## 4. Implementation Phases

### Phase 1: Quick Wins (1-2 weeks)

| # | Task | Priority | Effort | Impact |
|---|------|----------|--------|--------|
| 1 | Hide AI Score from candidates | High | 4h | Immediate UX improvement |
| 2 | Add terms & conditions checkbox | High | 4h | Legal compliance |
| 3 | Rename phone → whatsapp | Medium | 2h | Field clarity |
| 4 | Replace address → domicile (city + province) | Medium | 6h | Data accuracy |
| 5 | Add optional work experience fields | Medium | 8h | More candidate info |
| 6 | Add Date Needed to MPP | Medium | 4h | Scheduling |
| 7 | Add Special Needs to MPP | Medium | 4h | Requirements tracking |
| 8 | Add Benefits to MPP | Low | 2h | Temporary field |
| 9 | Change job Delete → Archive | High | 6h | Data retention |
| 10 | Currency change to IDR | Low | 4h | Localization |
| 11 | University manual input | Medium | 4h | Data flexibility |

**Total Phase 1:** ~46 hours (~1.5 weeks)

---

### Phase 2: Core Infrastructure (2-3 weeks)

| # | Task | Priority | Effort | Impact |
|---|------|----------|--------|--------|
| 1 | Multi-role database changes | High | 12h | Foundation |
| 2 | Multi-role middleware & JWT updates | High | 16h | Authorization |
| 3 | Update all existing middleware | High | 12h | Compatibility |
| 4 | Department admin endpoints | Medium | 8h | Admin access |
| 5 | Active Vacancies page | Medium | 8h | HR productivity |
| 6 | Technical Interview type | Low | 2h | Interview options |
| 7 | Director Interview type | Low | 2h | Interview options |
| 8 | Benefits in Job Openings | Medium | 6h | Job details |
| 9 | Update Application DTOs | Medium | 8h | Data consistency |

**Total Phase 2:** ~74 hours (~2-3 weeks)

---

### Phase 3: Complex Features (3-4 weeks)

| # | Task | Priority | Effort | Impact |
|---|------|----------|--------|--------|
| 1 | Predefined pipeline stages table | High | 8h | Pipeline foundation |
| 2 | Job pipeline configuration | High | 16h | Per-job pipelines |
| 3 | Pipeline UI endpoints | High | 16h | HR workflow |
| 4 | Survey templates & questions | High | 16h | Survey system |
| 5 | Survey response tracking | High | 12h | Data collection |
| 6 | Survey trigger on status change | High | 8h | Automation |
| 7 | Candidate survey UI endpoints | Medium | 8h | User experience |
| 8 | Email templates system | High | 12h | Rejection emails |
| 9 | Send rejection email endpoint | High | 8h | HR workflow |
| 10 | Email rendering & SMTP | High | 12h | Email delivery |
| 11 | Pipeline improvements (UX) | Low | 16h | Optional polish |

**Total Phase 3:** ~120 hours (~3-4 weeks)

---

## 5. Error Handling & Validation

### 5.1 Multi-Role Validation
```go
// Cannot remove the last role from a user
if len(user.Roles) == 1 && !isAdding {
    return errors.New("user must have at least one role")
}

// Admin must always have admin role
if existingAdmin && !hasAdminRole(roles) {
    return errors.New("admin cannot lose admin role")
}
```

### 5.2 Pipeline Validation
```go
// Cannot delete stages that have applications
if hasApplicationsInStage(stageID) {
    return errors.New("cannot remove stage with active applications")
}

// Pipeline must have at least start and end stages
if len(stages) < 2 {
    return errors.New("pipeline must have at least 2 stages")
}
```

### 5.3 Survey Validation
```go
// Cannot delete survey template with responses
if hasResponses(templateID) {
    return errors.New("cannot delete template with responses")
}

// Template must have at least one question
if len(questions) == 0 {
    return errors.New("template must have at least one question")
}
```

### 5.4 Email Validation
```go
// Validate email variables exist in template
requiredVars := []string{"CandidateName", "JobTitle", "Reason"}
for _, v := range requiredVars {
    if !strings.Contains(body, "{{."+v+"}}") {
        return errors.New("missing required variable: " + v)
    }
}
```

---

## 6. Testing Strategy

### 6.1 Unit Tests
- Repository layer: CRUD operations
- Service layer: Business logic (multi-role checks, pipeline validation)
- Middleware: Role authorization checks

### 6.2 Integration Tests
- Application flow with new fields
- Multi-role user operations
- Pipeline stage transitions
- Survey creation and response
- Email sending

### 6.3 E2E Tests
- Candidate applies with new form fields
- HR configures pipeline and moves candidates
- Candidate receives and completes survey
- HR sends rejection email

---

## 7. Migration Strategy

### 7.1 Database Migration
1. Create migration files for each phase
2. Run migrations during deployment
3. Backfill data where needed

### 7.2 Data Backfill Examples
```sql
-- Backfill existing users to user_roles table
INSERT INTO user_roles (user_id, role, created_at)
SELECT id, role, created_at FROM users WHERE role IS NOT NULL;
```

### 7.3 API Versioning
- Keep existing endpoints for backward compatibility where possible
- New features add new endpoints
- Deprecate old endpoints after 2 release cycles

### 7.4 Rollback Plan
- Each phase deployed independently
- Can rollback to previous version if issues arise
- Database migrations are reversible

---

## 8. Deployment Strategy (VPS/DigitalOcean)

### 8.1 Infrastructure
- VPS: DigitalOcean Droplet
- Database: PostgreSQL (managed or self-hosted)
- Storage: MinIO for file storage
- Reverse Proxy: Nginx
- SSL: Let's Encrypt

### 8.2 Staging Subdomain
- Generate random subdomain: `rec-abc123.staging.domain.com`
- Share with Elzanna and Andy for review
- Production deployment after approval

### 8.3 CI/CD Pipeline (Recommended)
```yaml
# Example: GitHub Actions
1. Run tests
2. Build Docker image
3. Deploy to staging (automatic)
4. Manual approval for production
5. Deploy to production
```

### 8.4 Environment Variables Required
```
# Database
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME

# JWT
JWT_SECRET

# MinIO/S3
S3_ENDPOINT
S3_ACCESS_KEY
S3_SECRET_KEY
S3_BUCKET_APPLICATIONS
S3_USE_SSL

# Email (SMTP)
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASSWORD

# Application
PORT
ENVIRONMENT (staging/production)
```

---

## 9. Potential Breaking Changes & Mitigation

| Change | Breaking | Mitigation |
|--------|----------|------------|
| User role structure change | Yes | Backfill existing roles, gradual migration |
| Job delete → archive | Yes | Keep delete endpoint, mark as archived |
| Application field changes | Partial | Make new fields optional initially |
| Pipeline stages | No | New system, existing apps use default |
| JWT token format | Yes | Support both formats during transition |

---

## 10. Summary

**Total Estimated Effort:** ~240 hours (6-9 weeks)

**Phase Distribution:**
- Phase 1 (Quick Wins): 46 hours (1.5 weeks)
- Phase 2 (Infrastructure): 74 hours (2-3 weeks)
- Phase 3 (Complex Features): 120 hours (3-4 weeks)

**Key Deliverables:**
- Multi-role authentication system
- Per-job configurable pipelines
- Candidate survey system
- Rejection email automation
- Enhanced candidate application form
- Active vacancies management
- Ready-for-deployment application

**Next Steps:**
1. Create detailed implementation plan (next document)
2. Set up development branch for Phase 1
3. Begin Phase 1 implementation
