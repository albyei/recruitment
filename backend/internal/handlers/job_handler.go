package handler

import (
	"net/http"
	"strconv"

	"wowrack-recruitment/internal/dto"
	"wowrack-recruitment/internal/service"
	"wowrack-recruitment/internal/util"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
)

type jobHandler struct {
	service service.JobService
}

func NewJobHandler(svc service.JobService) *jobHandler {
	return &jobHandler{service: svc}
}

// Create godoc
// @Summary      Create a new job (draft)
// @Description  Hiring Manager creates a new job posting in draft status
// @Tags         Hiring Manager
// @Accept       mpfd
// @Produce      json
// @Security     Bearer
// @Param        title            formData  string  true   "Job title (min 10, max 200)"
// @Param        description      formData  string  true   "Job description (min 50)"
// @Param        requirements     formData  string  false  "Job requirements"
// @Param        benefits         formData  string  false  "Job benefits"
// @Param        location         formData  string  false  "Job location"
// @Param        employment_type  formData  string  false  "Employment type"  Enums(full-time, internship, contract, freelance)
// @Param        salary_range     formData  string  false  "Salary range"
// @Param        department_id    formData  int     true   "Department ID"
// @Param        quantity_needed  formData  int     false  "Number of positions"
// @Param        priority         formData  string  false  "Priority"  Enums(low, medium, high, urgent)
// @Param        file             formData  file    false  "Job description file"
// @Success      201  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]interface{}
// @Failure      401  {object}  map[string]interface{}
// @Failure      403  {object}  map[string]interface{}
// @Router       /hiring_manager/jobs [post]
func (h *jobHandler) Create(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req dto.CreateJobRequest
	if err := c.ShouldBindWith(&req, binding.FormMultipart); err != nil {
		util.RespError(c, http.StatusBadRequest, "Invalid form data", err.Error())
		return
	}

	file, _ := c.FormFile("file")

	data, err := h.service.Create(req, file, userID)
	if err != nil {
		util.RespError(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	util.RespSuccess(c, http.StatusCreated, "Job berhasil dibuat (draft)", data)
}

// Update godoc
// @Summary      Update a job
// @Description  Update an existing job posting
// @Tags         Hiring Manager
// @Accept       mpfd
// @Produce      json
// @Security     Bearer
// @Param        id    path      int                  true  "Job ID"
// @Param        title            formData  string  false  "Job title"
// @Param        description      formData  string  false  "Job description"
// @Param        file             formData  file    false  "Job description file"
// @Success      200  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]interface{}
// @Failure      401  {object}  map[string]interface{}
// @Router       /hiring_manager/jobs/{id} [put]
func (h *jobHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		util.RespError(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	userID := c.GetUint("user_id")

	var req dto.UpdateJobRequest
	if err := c.ShouldBindWith(&req, binding.FormMultipart); err != nil {
		util.RespError(c, http.StatusBadRequest, "Invalid form data", err.Error())
		return
	}

	file, _ := c.FormFile("file")

	data, err := h.service.Update(uint(id), req, file, userID)
	if err != nil {
		util.RespError(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	util.RespSuccess(c, http.StatusOK, "Job berhasil diupdate", data)
}

// Submit godoc
// @Summary      Submit job for approval
// @Description  Hiring Manager submits a draft job for HR approval
// @Tags         Hiring Manager
// @Produce      json
// @Security     Bearer
// @Param        id  path  int  true  "Job ID"
// @Success      200  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]interface{}
// @Failure      401  {object}  map[string]interface{}
// @Router       /hiring_manager/jobs/{id}/submit [patch]
func (h *jobHandler) Submit(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		util.RespError(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	userID := c.GetUint("user_id")
	if err := h.service.SubmitForApproval(uint(id), userID); err != nil {
		util.RespError(c, http.StatusBadRequest, err.Error(), nil)
		return
	}
	util.RespSuccess(c, http.StatusOK, "Job disubmit untuk approval", nil)
}

// Approve godoc
// @Summary      Approve a job
// @Description  HR approves a submitted job posting
// @Tags         HR Jobs
// @Produce      json
// @Security     Bearer
// @Param        id  path  int  true  "Job ID"
// @Success      200  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]interface{}
// @Failure      403  {object}  map[string]interface{}
// @Router       /hr/jobs/{id}/approve [patch]
func (h *jobHandler) Approve(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		util.RespError(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	userID := c.GetUint("user_id")
	if err := h.service.Approve(uint(id), userID); err != nil {
		util.RespError(c, http.StatusForbidden, err.Error(), nil)
		return
	}
	util.RespSuccess(c, http.StatusOK, "Job telah diapprove", nil)
}

// Publish godoc
// @Summary      Publish a job
// @Description  Hiring Manager publishes an approved job posting
// @Tags         Hiring Manager
// @Produce      json
// @Security     Bearer
// @Param        id  path  int  true  "Job ID"
// @Success      200  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]interface{}
// @Router       /hiring_manager/jobs/{id}/publish [patch]
func (h *jobHandler) Publish(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		util.RespError(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	userID := c.GetUint("user_id")
	if err := h.service.Publish(uint(id), userID); err != nil {
		util.RespError(c, http.StatusBadRequest, err.Error(), nil)
		return
	}
	util.RespSuccess(c, http.StatusOK, "Job telah dipublish!", nil)
}

// Close godoc
// @Summary      Close a job
// @Description  HR closes a published job posting
// @Tags         HR Jobs
// @Produce      json
// @Security     Bearer
// @Param        id  path  int  true  "Job ID"
// @Success      200  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]interface{}
// @Router       /hr/jobs/{id}/close [patch]
func (h *jobHandler) Close(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		util.RespError(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	userID := c.GetUint("user_id")
	if err := h.service.Close(uint(id), userID); err != nil {
		util.RespError(c, http.StatusBadRequest, err.Error(), nil)
		return
	}
	util.RespSuccess(c, http.StatusOK, "Job telah ditutup", nil)
}

// GetAllForHR godoc
// @Summary      Get all jobs (HR view)
// @Description  Get paginated list of all jobs for HR dashboard
// @Tags         HR Jobs
// @Produce      json
// @Security     Bearer
// @Param        page   query  int  false  "Page number"   default(1)
// @Param        limit  query  int  false  "Items per page" default(20)
// @Success      200  {object}  map[string]interface{}
// @Failure      401  {object}  map[string]interface{}
// @Router       /hr/jobs [get]
func (h *jobHandler) GetAllForHR(c *gin.Context) {
	pag, err := util.GetPagination(c)
	if err != nil {
		util.RespError(c, http.StatusBadRequest, "Parameter pagination tidak valid", err.Error())
		return
	}
	data, total, err := h.service.GetAllForHRWithPagination(pag.Page, pag.Limit)
	if err != nil {
		util.RespError(c, http.StatusInternalServerError, "Gagal mengambil data", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"data": data,
		"meta": gin.H{
			"page":  pag.Page,
			"limit": pag.Limit,
			"total": total,
		},
	})
}

// GetAllForHiringManager godoc
// @Summary      Get all jobs (Hiring Manager view)
// @Description  Get paginated list of jobs for Hiring Manager dashboard
// @Tags         Hiring Manager
// @Produce      json
// @Security     Bearer
// @Param        page   query  int  false  "Page number"   default(1)
// @Param        limit  query  int  false  "Items per page" default(20)
// @Success      200  {object}  map[string]interface{}
// @Failure      401  {object}  map[string]interface{}
// @Router       /hiring_manager/jobs [get]
func (h *jobHandler) GetAllForHiringManager(c *gin.Context) {
	pag, err := util.GetPagination(c)
	if err != nil {
		util.RespError(c, http.StatusBadRequest, "Parameter pagination tidak valid", err.Error())
		return
	}
	data, total, err := h.service.GetAllForManagerWithPagination(pag.Page, pag.Limit)
	if err != nil {
		util.RespError(c, http.StatusInternalServerError, "Gagal mengambil data", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"data": data,
		"meta": gin.H{
			"page":  pag.Page,
			"limit": pag.Limit,
			"total": total,
		},
	})
}

// GetPublishedJobs godoc
// @Summary      List published jobs
// @Description  Get all published job vacancies with optional filters and pagination
// @Tags         Jobs
// @Produce      json
// @Param        department  query  string  false  "Filter by department name"
// @Param        location    query  string  false  "Filter by location"
// @Param        type        query  string  false  "Filter by employment type"  Enums(full-time, internship, contract, freelance)
// @Param        priority    query  string  false  "Filter by priority"         Enums(low, medium, high, urgent)
// @Param        page        query  int     false  "Page number"                default(1)
// @Param        limit       query  int     false  "Items per page"             default(20)
// @Success      200  {object}  map[string]interface{}
// @Failure      500  {object}  map[string]interface{}
// @Router       /jobs [get]
func (h *jobHandler) GetPublishedJobs(c *gin.Context) {
	filters := map[string]string{
		"department": c.Query("department"),
		"location":   c.Query("location"),
		"type":       c.Query("type"),
		"priority":   c.Query("priority"),
	}
	pag, err := util.GetPagination(c)
	if err != nil {
		util.RespError(c, http.StatusBadRequest, "Parameter pagination tidak valid", err.Error())
		return
	}
	data, total, err := h.service.GetPublishedJobsWithPagination(filters, pag.Page, pag.Limit)
	if err != nil {
		util.RespError(c, http.StatusInternalServerError, "Error", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"data": data,
		"meta": gin.H{
			"page":  pag.Page,
			"limit": pag.Limit,
			"total": total,
		},
	})
}

// GetJobBySlug godoc
// @Summary      Get job by slug
// @Description  Get a single published job posting by its slug
// @Tags         Jobs
// @Produce      json
// @Param        slug  path  string  true  "Job slug"
// @Success      200  {object}  map[string]interface{}
// @Failure      404  {object}  map[string]interface{}
// @Router       /jobs/{slug} [get]
func (h *jobHandler) GetJobBySlug(c *gin.Context) {
	slug := c.Param("slug")
	data, err := h.service.GetBySlug(slug)
	if err != nil {
		util.RespError(c, http.StatusNotFound, "Job tidak ditemukan atau belum dipublish", nil)
		return
	}
	util.RespSuccess(c, http.StatusOK, "Success", data)
}

// Reject godoc
// @Summary      Reject a job
// @Description  HR rejects a submitted job posting with a reason
// @Tags         HR Jobs
// @Accept       json
// @Produce      json
// @Security     Bearer
// @Param        id    path  int                   true  "Job ID"
// @Param        body  body  dto.RejectJobRequest   true  "Rejection reason"
// @Success      200  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]interface{}
// @Router       /hr/jobs/{id}/reject [patch]
func (h *jobHandler) Reject(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		util.RespError(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}

	var req dto.RejectJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.RespError(c, http.StatusBadRequest, "Alasan wajib diisi", err.Error())
		return
	}

	if err := h.service.Reject(uint(id), req.Reason, userID); err != nil {
		util.RespError(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	util.RespSuccess(c, http.StatusOK, "Job telah direject. Hiring Manager bisa melakukan revisi sekarang.", nil)
}

// Delete godoc
// @Summary      Delete a job
// @Description  HR deletes a job posting
// @Tags         HR Jobs
// @Produce      json
// @Security     Bearer
// @Param        id  path  int  true  "Job ID"
// @Success      200  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]interface{}
// @Failure      500  {object}  map[string]interface{}
// @Router       /hr/jobs/{id} [delete]
func (h *jobHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		util.RespError(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}

	if err := h.service.Delete(uint(id)); err != nil {
		util.RespError(c, http.StatusInternalServerError, "Gagal menghapus job", err.Error())
		return
	}

	util.RespSuccess(c, http.StatusOK, "Job berhasil dihapus", nil)
}
