package handler

import (
	"net/http"
	"strconv"

	"wowrack-recruitment/internal/dto"
	"wowrack-recruitment/internal/service"
	"wowrack-recruitment/internal/service/application"
	"wowrack-recruitment/internal/util"

	"github.com/gin-gonic/gin"
)

type hrApplicationHandler struct {
	service    application.ApplicationService
	jobService service.JobService
}

func NewHRApplicationHandler(svc application.ApplicationService, jobSvc service.JobService) *hrApplicationHandler {
	return &hrApplicationHandler{service: svc, jobService: jobSvc}
}

// GetAllApplications godoc
// @Summary      Get all applications
// @Description  Get paginated list of all job applications (HR only)
// @Tags         HR Applications
// @Produce      json
// @Security     Bearer
// @Param        page   query  int  false  "Page number"   default(1)
// @Param        limit  query  int  false  "Items per page" default(20)
// @Success      200  {object}  map[string]interface{}
// @Failure      401  {object}  map[string]interface{}
// @Failure      500  {object}  map[string]interface{}
// @Router       /hr/applications [get]
func (h *hrApplicationHandler) GetAllApplications(c *gin.Context) {
	pag, err := util.GetPagination(c)
	if err != nil {
		util.RespError(c, http.StatusBadRequest, "Parameter pagination tidak valid", err.Error())
		return
	}
	apps, total, err := h.service.GetAllApplications(c.Request.Context(), pag.Page, pag.Limit)
	if err != nil {
		util.RespError(c, http.StatusInternalServerError, "Gagal mengambil lamaran", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": apps,
		"meta": gin.H{
			"page":  pag.Page,
			"limit": pag.Limit,
			"total": total,
		},
	})
}

// GetApplicationsByJob godoc
// @Summary      Get applications by job
// @Description  Get paginated list of applications for a specific job (HR only)
// @Tags         HR Applications
// @Produce      json
// @Security     Bearer
// @Param        id     path   int  true   "Job ID"
// @Param        page   query  int  false  "Page number"   default(1)
// @Param        limit  query  int  false  "Items per page" default(20)
// @Success      200  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]interface{}
// @Failure      500  {object}  map[string]interface{}
// @Router       /hr/jobs/{id}/applications [get]
func (h *hrApplicationHandler) GetApplicationsByJob(c *gin.Context) {
	jobIDStr := c.Param("id")
	jobID, err := strconv.ParseUint(jobIDStr, 10, 32)
	if err != nil {
		util.RespError(c, http.StatusBadRequest, "ID job tidak valid", nil)
		return
	}

	pag, err := util.GetPagination(c)
	if err != nil {
		util.RespError(c, http.StatusBadRequest, "Parameter pagination tidak valid", err.Error())
		return
	}
	apps, total, err := h.service.GetApplicationsByJob(c.Request.Context(), uint(jobID), pag.Page, pag.Limit)
	if err != nil {
		util.RespError(c, http.StatusInternalServerError, "Gagal mengambil lamaran", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": apps,
		"meta": gin.H{
			"page":  pag.Page,
			"limit": pag.Limit,
			"total": total,
		},
	})
}

// UpdateStatus godoc
// @Summary      Update application status
// @Description  Change the status of a job application (HR only)
// @Tags         HR Applications
// @Accept       json
// @Produce      json
// @Security     Bearer
// @Param        id    path  int                      true  "Application ID"
// @Param        body  body  dto.UpdateStatusRequest   true  "Status update payload"
// @Success      200  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]interface{}
// @Failure      401  {object}  map[string]interface{}
// @Router       /hr/applications/{id}/status [patch]
func (h *hrApplicationHandler) UpdateStatus(c *gin.Context) {
	appIDStr := c.Param("id")
	appID, err := strconv.ParseUint(appIDStr, 10, 32)
	if err != nil {
		util.RespError(c, http.StatusBadRequest, "ID lamaran tidak valid", nil)
		return
	}

	var req dto.UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.RespError(c, http.StatusBadRequest, "Data tidak valid", err.Error())
		return
	}

	if err := h.service.UpdateApplicationStatus(c.Request.Context(), uint(appID), req, req.Notes); err != nil {
		util.RespError(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	util.RespSuccess(c, http.StatusOK, "Status lamaran berhasil diubah", nil)
}

// GetActiveVacancies godoc
// @Summary      Get active vacancies
// @Description  Get list of all active (published) job vacancies for HR dashboard
// @Tags         HR Applications
// @Produce      json
// @Security     Bearer
// @Success      200  {object}  map[string]interface{}
// @Failure      500  {object}  map[string]interface{}
// @Router       /hr/active-vacancies [get]
func (h *hrApplicationHandler) GetActiveVacancies(c *gin.Context) {
	vacancies, err := h.jobService.GetActiveVacancies()
	if err != nil {
		util.RespError(c, http.StatusInternalServerError, "Gagal mengambil lowongan aktif", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": vacancies,
	})
}

// GetApplicationByID godoc
// @Summary      Get application by ID
// @Description  Get a single application detail by its ID (HR only)
// @Tags         HR Applications
// @Produce      json
// @Security     Bearer
// @Param        id  path  int  true  "Application ID"
// @Success      200  {object}  map[string]interface{}
// @Failure      404  {object}  map[string]interface{}
// @Router       /hr/applications/{id} [get]
func (h *hrApplicationHandler) GetApplicationByID(c *gin.Context) {
	appIDStr := c.Param("id")
	appID, err := strconv.ParseUint(appIDStr, 10, 32)
	if err != nil {
		util.RespError(c, http.StatusBadRequest, "ID lamaran tidak valid", nil)
		return
	}

	// Fetch directly by ID
	app, err := h.service.GetApplicationByID(c.Request.Context(), uint(appID))
	if err != nil {
		util.RespError(c, http.StatusNotFound, "Lamaran tidak ditemukan", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": app})
}

// GetActiveVacancyByID godoc
// @Summary      Get active vacancy by ID
// @Description  Get a single active vacancy detail by its ID (HR only)
// @Tags         HR Applications
// @Produce      json
// @Security     Bearer
// @Param        id  path  int  true  "Vacancy ID"
// @Success      200  {object}  map[string]interface{}
// @Failure      404  {object}  map[string]interface{}
// @Router       /hr/active-vacancies/{id} [get]
func (h *hrApplicationHandler) GetActiveVacancyByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		util.RespError(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}

	job, err := h.jobService.GetByID(uint(id))
	if err != nil {
		util.RespError(c, http.StatusNotFound, "Lowongan tidak ditemukan", nil)
		return
	}

	if job.Status != "published" {
		util.RespError(c, http.StatusNotFound, "Lowongan tidak aktif", nil)
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": job})
}
