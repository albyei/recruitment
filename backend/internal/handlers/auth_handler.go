// internal/handler/auth_handler.go
package handler

import (
	"net/http"
	"wowrack-recruitment/internal/dto"
	"wowrack-recruitment/internal/service"
	"wowrack-recruitment/internal/util"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
)

type userHandler struct {
	service service.Service
}

func NewUserHandler(svc service.Service) *userHandler {
	return &userHandler{service: svc}
}

// Register godoc
// @Summary      Register a new candidate
// @Description  Create a new candidate account with optional photo upload
// @Tags         Auth
// @Accept       mpfd
// @Produce      json
// @Param        name      formData  string  true   "Full name (min 3, max 100)"
// @Param        email     formData  string  true   "Email address"
// @Param        password  formData  string  true   "Password (min 8, must contain special char)"
// @Param        phone     formData  string  false  "Phone number"
// @Param        linkedin  formData  string  false  "LinkedIn URL"
// @Param        address   formData  string  false  "Address"
// @Param        gender    formData  string  false  "Gender"  Enums(male, female)
// @Param        photo     formData  file    false  "Profile photo"
// @Success      201  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]interface{}
// @Router       /auth/register [post]
func (h *userHandler) Register(c *gin.Context) {
	var input dto.RegisterRequest
	if err := c.ShouldBind(&input); err != nil {
		util.RespError(c, http.StatusBadRequest, "Validasi gagal", util.ValidationError(err))
		return
	}

	file, _ := c.FormFile("photo")

	newUser, err := h.service.Register(&input, file)
	if err != nil {
		util.RespError(c, http.StatusBadRequest, "Registrasi gagal", err.Error())
		return
	}

	photoURL := ""
	if newUser.Photo != "" {
		photoURL = h.service.GetPhotoURL(newUser.Photo)
	}

	// RESPONSE SESUAI CONTOH
	c.JSON(http.StatusCreated, gin.H{
		"data": gin.H{
			"id":         newUser.ID,
			"name":       newUser.Name,
			"email":      newUser.Email,
			"role":       newUser.Role,
			"phone":      newUser.Phone,
			"linkedin":   newUser.LinkedIn,
			"address":    newUser.Address,
			"gender":     newUser.Gender,
			"photo_url":  photoURL,
			"created_at": newUser.CreatedAt.Format("2006-01-02 15:04:05"),
		},
		"message": "Profil Anda",
	})
}

// Login godoc
// @Summary      Login
// @Description  Authenticate user and get JWT token
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Param        body  body      dto.LoginRequest  true  "Login credentials"
// @Success      200   {object}  map[string]interface{}
// @Failure      401   {object}  map[string]interface{}
// @Router       /auth/login [post]
func (h *userHandler) Login(c *gin.Context) {
	var input dto.LoginRequest
	if err := c.ShouldBind(&input); err != nil {
		util.RespError(c, http.StatusBadRequest, "Validasi gagal", util.ValidationError(err))
		return
	}

	response, err := h.service.Login(&input)
	if err != nil {
		util.RespError(c, http.StatusUnauthorized, "Login gagal", err.Error())
		return
	}

	util.RespSuccess(c, http.StatusOK, "Login berhasil", response)
}

// UpdateMyProfile godoc
// @Summary      Update my profile
// @Description  Update the currently authenticated user's profile
// @Tags         Auth
// @Accept       mpfd
// @Produce      json
// @Security     Bearer
// @Param        name      formData  string  false  "Full name"
// @Param        email     formData  string  false  "Email"
// @Param        password  formData  string  false  "New password"
// @Param        phone     formData  string  false  "Phone"
// @Param        linkedin  formData  string  false  "LinkedIn URL"
// @Param        address   formData  string  false  "Address"
// @Param        gender    formData  string  false  "Gender"  Enums(male, female)
// @Param        photo     formData  file    false  "Profile photo"
// @Success      200  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]interface{}
// @Failure      401  {object}  map[string]interface{}
// @Router       /profile [put]
func (h *userHandler) UpdateMyProfile(c *gin.Context) {
	claims := c.MustGet("user").(*util.Claims)

	var input dto.UpdateMyProfileRequest
	if err := c.ShouldBind(&input); err != nil {
		util.RespError(c, http.StatusBadRequest, "Validasi gagal", util.ValidationError(err))
		return
	}
	file, _ := c.FormFile("photo")

	// Update dulu (kita tetap panggil, tapi tidak pakai hasilnya untuk response)
	_, err := h.service.UpdateMyProfile(claims.UserID, &input, file)
	if err != nil {
		util.RespError(c, http.StatusBadRequest, "Update Profile gagal", err.Error())
		return
	}

	// Ambil profile terbaru dengan PhotoURL yang sudah benar
	profile, err := h.service.GetMyProfile(claims.UserID)
	if err != nil {
		util.RespError(c, http.StatusInternalServerError, "Gagal mengambil profile terbaru", nil)
		return
	}

	// Response sudah konsisten + photo_url bisa diklik!
	util.RespSuccess(c, http.StatusOK, "Update Profile berhasil", profile)
}

// DeleteMyAccount godoc
// @Summary      Delete my account
// @Description  Permanently delete the authenticated user's account
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Security     Bearer
// @Param        body  body      dto.DeleteMyAccountRequest  true  "Password confirmation"
// @Success      200   {object}  map[string]interface{}
// @Failure      400   {object}  map[string]interface{}
// @Failure      401   {object}  map[string]interface{}
// @Router       /me [delete]
func (h *userHandler) DeleteMyAccount(c *gin.Context) {
	userVal, exists := c.Get("user")
	if !exists {
		util.RespError(c, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}
	currentUser := userVal.(*util.Claims)

	var req dto.DeleteMyAccountRequest
	if err := c.ShouldBind(&req); err != nil {
		util.RespError(c, http.StatusBadRequest, "Validasi gagal", util.ValidationError(err))
		return
	}

	if err := h.service.DeleteMyAccount(currentUser.UserID, req.Password); err != nil {
		util.RespError(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	util.RespSuccess(c, http.StatusOK, "Akun Anda berhasil dihapus. Terima kasih telah menggunakan layanan kami.", nil)
}

// GetMyProfile godoc
// @Summary      Get my profile
// @Description  Get the currently authenticated user's profile
// @Tags         Auth
// @Produce      json
// @Security     Bearer
// @Success      200  {object}  map[string]interface{}
// @Failure      401  {object}  map[string]interface{}
// @Failure      404  {object}  map[string]interface{}
// @Router       /profile [get]
func (h *userHandler) GetMyProfile(c *gin.Context) {
	userVal, exists := c.Get("user")
	if !exists {
		util.RespError(c, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}
	currentUser := userVal.(*util.Claims)

	profile, err := h.service.GetMyProfile(currentUser.UserID)
	if err != nil {
		util.RespError(c, http.StatusNotFound, err.Error(), nil)
		return
	}

	util.RespSuccess(c, http.StatusOK, "Profil Anda", profile)
}

// CreateUserByAdmin godoc
// @Summary      Create user by admin
// @Description  Admin creates a new user (HR or Hiring Manager) and sends credentials via email
// @Tags         Admin
// @Accept       mpfd
// @Produce      json
// @Security     Bearer
// @Param        name      formData  string  true   "Full name"
// @Param        email     formData  string  true   "Email address"
// @Param        role      formData  string  true   "User role"  Enums(hr, hiring_manager)
// @Param        phone     formData  string  false  "Phone number"
// @Param        linkedin  formData  string  false  "LinkedIn URL"
// @Param        address   formData  string  false  "Address"
// @Param        gender    formData  string  false  "Gender"  Enums(male, female)
// @Param        photo     formData  file    false  "Profile photo"
// @Success      201  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]interface{}
// @Failure      401  {object}  map[string]interface{}
// @Failure      403  {object}  map[string]interface{}
// @Router       /admin/users [post]
func (h *userHandler) CreateUserByAdmin(c *gin.Context) {
	var req dto.CreateUserByAdminRequest
	if err := c.ShouldBindWith(&req, binding.FormMultipart); err != nil {
		util.RespError(c, http.StatusBadRequest, "Data tidak valid", err.Error())
		return
	}

	photo, _ := c.FormFile("photo")

	user, err := h.service.CreateUserByAdminRequest(&req, photo)
	if err != nil {
		util.RespError(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	util.RespSuccess(c, http.StatusCreated, "User berhasil dibuat dan email credential telah dikirim", user)
}

// GetAllUsers godoc
// @Summary      Get all users
// @Description  Get paginated list of all users (Admin/HR/Manager only)
// @Tags         Admin
// @Produce      json
// @Security     Bearer
// @Param        page   query    int  false  "Page number"   default(1)
// @Param        limit  query    int  false  "Items per page" default(20)
// @Success      200  {object}  map[string]interface{}
// @Failure      401  {object}  map[string]interface{}
// @Failure      403  {object}  map[string]interface{}
// @Router       /admin/users [get]
func (h *userHandler) GetAllUsers(c *gin.Context) {
	userVal, exists := c.Get("user")
	if !exists {
		util.RespError(c, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}
	currentUser := userVal.(*util.Claims)

	validRole := ""
	for _, role := range currentUser.Roles {
		if role == "admin" || role == "hiring_manager" || role == "hr" {
			validRole = role
			break
		}
	}

	if validRole == "" {
		util.RespError(c, http.StatusForbidden, "Akses ditolak", nil)
		return
	}

	pag, err := util.GetPagination(c)
	if err != nil {
		util.RespError(c, http.StatusBadRequest, "Parameter pagination tidak valid", err.Error())
		return
	}

	users, total, err := h.service.GetAllUsers(currentUser.Roles, pag.Page, pag.Limit)
	if err != nil {
		util.RespError(c, http.StatusForbidden, err.Error(), nil)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": users,
		"meta": gin.H{
			"page":  pag.Page,
			"limit": pag.Limit,
			"total": total,
		},
	})
}