package handler

import (
	"net/http"

	"wowrack-recruitment/internal/dto"
	"wowrack-recruitment/internal/service/application"
	"wowrack-recruitment/internal/util"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
)

type applicationHandler struct {
	service application.ApplicationService
}

func NewApplicationHandler(svc application.ApplicationService) *applicationHandler {
	return &applicationHandler{service: svc}
}

// Apply godoc
// @Summary      Apply for a job
// @Description  Submit a job application with CV file upload (multipart/form-data)
// @Tags         Applications
// @Accept       mpfd
// @Produce      json
// @Param        slug               path      string  true   "Job slug"
// @Param        name               formData  string  true   "Full name"
// @Param        email              formData  string  true   "Email address"
// @Param        phone              formData  string  true   "Phone number"
// @Param        terms_accepted     formData  bool    true   "Terms acceptance"
// @Param        whatsapp_number    formData  string  true   "WhatsApp number (08xx format)"
// @Param        domicile_city      formData  string  true   "City of domicile"
// @Param        domicile_province  formData  string  true   "Province of domicile"
// @Param        university         formData  string  false  "University name"
// @Param        cv                 formData  file    true   "CV file (PDF, max 5MB)"
// @Success      201  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]interface{}
// @Failure      404  {object}  map[string]interface{}
// @Failure      409  {object}  map[string]interface{}
// @Router       /jobs/{slug}/apply [post]
func (h *applicationHandler) Apply(c *gin.Context) {
	jobSlug := c.Param("slug")

	var req dto.ApplyJobRequest
	if err := c.ShouldBindWith(&req, binding.FormMultipart); err != nil {
		util.RespError(c, http.StatusBadRequest, "Data tidak valid", err.Error())
		return
	}

	cvFile, err := c.FormFile("cv")
	if err != nil {
		util.RespError(c, http.StatusBadRequest, "CV wajib diupload", nil)
		return
	}

	res, err := h.service.Apply(c.Request.Context(), req, jobSlug, cvFile)
	if err != nil {
		status := http.StatusBadRequest
		if util.IsNotFound(err) || util.IsJobNotAvailable(err) {
			status = http.StatusNotFound
		} else if util.IsDuplicate(err) {
			status = http.StatusConflict
		}
		util.RespError(c, status, err.Error(), nil)
		return
	}

	util.RespSuccess(c, http.StatusCreated, "Lamaran berhasil dikirim! Cek email untuk login.", res)
}