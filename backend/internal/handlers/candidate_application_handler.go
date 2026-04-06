package handler

import (
	"net/http"
	"strconv"

	"wowrack-recruitment/internal/dto"
	"wowrack-recruitment/internal/service/application"
	"wowrack-recruitment/internal/util"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
)

type candidateApplicationHandler struct {
	service application.ApplicationService
}

func NewCandidateApplicationHandler(svc application.ApplicationService) *candidateApplicationHandler {
	return &candidateApplicationHandler{service: svc}
}

// GetMyApplications godoc
// @Summary      Get my applications
// @Description  Get all job applications submitted by the authenticated candidate
// @Tags         Candidate
// @Produce      json
// @Security     Bearer
// @Success      200  {object}  map[string]interface{}
// @Failure      401  {object}  map[string]interface{}
// @Failure      500  {object}  map[string]interface{}
// @Router       /candidate/applications [get]
func (h *candidateApplicationHandler) GetMyApplications(c *gin.Context) {
	userID := c.GetUint("user_id")

	apps, err := h.service.GetApplicationsByCandidate(c.Request.Context(), userID)
	if err != nil {
		util.RespError(c, http.StatusInternalServerError, "Gagal mengambil lamaran", err.Error())
		return
	}

	util.RespSuccess(c, http.StatusOK, "Daftar lamaran Anda", apps)
}

// WithdrawApplication godoc
// @Summary      Withdraw application
// @Description  Withdraw/cancel a pending job application
// @Tags         Candidate
// @Produce      json
// @Security     Bearer
// @Param        id  path  int  true  "Application ID"
// @Success      200  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]interface{}
// @Failure      401  {object}  map[string]interface{}
// @Router       /candidate/applications/{id} [delete]
func (h *candidateApplicationHandler) WithdrawApplication(c *gin.Context) {
	userID := c.GetUint("user_id")
	appIDStr := c.Param("id")
	appID, err := strconv.ParseUint(appIDStr, 10, 32)
	if err != nil {
		util.RespError(c, http.StatusBadRequest, "ID lamaran tidak valid", nil)
		return
	}

	if err := h.service.WithdrawApplication(c.Request.Context(), uint(appID), userID); err != nil {
		util.RespError(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	util.RespSuccess(c, http.StatusOK, "Lamaran berhasil ditarik dan data dihapus", nil)
}

// EditApplication godoc
// @Summary      Edit application
// @Description  Edit a pending job application (name, phone, address, linkedin, optional new CV)
// @Tags         Candidate
// @Accept       mpfd
// @Produce      json
// @Security     Bearer
// @Param        id        path      int     true   "Application ID"
// @Param        name      formData  string  true   "Full name"
// @Param        phone     formData  string  true   "Phone number"
// @Param        address   formData  string  false  "Address"
// @Param        linkedin  formData  string  false  "LinkedIn URL"
// @Param        cv        formData  file    false  "New CV file (optional)"
// @Success      200  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]interface{}
// @Failure      401  {object}  map[string]interface{}
// @Router       /candidate/applications/{id} [put]
func (h *candidateApplicationHandler) EditApplication(c *gin.Context) {
	userID := c.GetUint("user_id")
	appIDStr := c.Param("id")
	appID, err := strconv.ParseUint(appIDStr, 10, 32)
	if err != nil {
		util.RespError(c, http.StatusBadRequest, "ID lamaran tidak valid", nil)
		return
	}

	var req dto.EditApplicationRequest
	if err := c.ShouldBindWith(&req, binding.FormMultipart); err != nil {
		util.RespError(c, http.StatusBadRequest, "Data tidak valid", err.Error())
		return
	}

	cvFile, _ := c.FormFile("cv") // optional

	res, err := h.service.EditApplication(c.Request.Context(), uint(appID), userID, req, cvFile)
	if err != nil {
		util.RespError(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	// Tambahkan message dinamis kalau CV diganti
	msg := "Lamaran berhasil diupdate! Skor kecocokan AI baru: " + strconv.Itoa(res.AIScore) + "%"
	if cvFile == nil {
		msg = "Lamaran berhasil diupdate"
	}
	util.RespSuccess(c, http.StatusOK, msg, res)
}