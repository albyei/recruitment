// internal/handlers/news_handler.go
package handler

import (
	"mime/multipart"
	"net/http"
	"strconv"

	"wowrack-recruitment/internal/dto"
	"wowrack-recruitment/internal/service"
	"wowrack-recruitment/internal/util"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

type NewsHandler struct {
	newsService service.NewsCultureService
}

func NewNewsHandler(newsService service.NewsCultureService) *NewsHandler {
	return &NewsHandler{newsService: newsService}
}

// CreateNews godoc
// @Summary      Create news/culture article
// @Description  Create a new news or culture article with image and optional gallery (HR only)
// @Tags         News
// @Accept       mpfd
// @Produce      json
// @Security     Bearer
// @Param        title      formData  string  true   "Article title (min 5, max 200)"
// @Param        content    formData  string  true   "Article content (min 20)"
// @Param        excerpt    formData  string  true   "Short excerpt (max 500)"
// @Param        published  formData  bool    false  "Publish immediately"
// @Param        image      formData  file    true   "Main image"
// @Param        gallery    formData  file    false  "Gallery images (multiple)"
// @Success      201  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]interface{}
// @Failure      401  {object}  map[string]interface{}
// @Router       /hr/news-cultures [post]
func (h *NewsHandler) CreateNews(c *gin.Context) {
	userIDRaw, exists := c.Get("user_id")
	if !exists {
		util.RespError(c, http.StatusUnauthorized, "user_id not found in context", nil)
		return
	}

	var input dto.CreateNewsCultureRequest
	if err := c.ShouldBind(&input); err != nil {
		util.RespError(c, http.StatusBadRequest, "Validation failed", err.Error())
		return
	}
	if err := validate.Struct(&input); err != nil {
		util.RespError(c, http.StatusBadRequest, "Validation failed", err.Error())
		return
	}

	imageHeader, err := c.FormFile("image")
	if err != nil {
		util.RespError(c, http.StatusBadRequest, "Image is required", nil)
		return
	}

	var galleryFiles []*multipart.FileHeader
	if files, ok := c.Request.MultipartForm.File["gallery"]; ok {
		galleryFiles = files
	}

	result, err := h.newsService.Create(c.Request.Context(), &input, userIDRaw, imageHeader, galleryFiles)
	if err != nil {
		util.RespError(c, http.StatusInternalServerError, "Failed to create news culture", err.Error())
		return
	}

	util.RespSuccess(c, http.StatusCreated, "News culture berhasil dibuat", result)
}

// DeleteNews godoc
// @Summary      Delete news/culture article
// @Description  Permanently delete a news article and all associated photos (HR only)
// @Tags         News
// @Produce      json
// @Security     Bearer
// @Param        id  path  int  true  "News ID"
// @Success      200  {object}  map[string]interface{}
// @Failure      404  {object}  map[string]interface{}
// @Failure      500  {object}  map[string]interface{}
// @Router       /hr/news-cultures/{id} [delete]
func (h *NewsHandler) DeleteNews(c *gin.Context) {
	newsID := c.Param("id")
	if newsID == "" {
		util.RespError(c, http.StatusBadRequest, "ID news diperlukan", nil)
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		util.RespError(c, http.StatusUnauthorized, "user_id not found in context", nil)
		return
	}

	if err := h.newsService.Delete(c.Request.Context(), newsID, userID); err != nil {
		if err.Error() == "news not found" {
			util.RespError(c, http.StatusNotFound, "News not found", err.Error())
			return
		}
		util.RespError(c, http.StatusInternalServerError, "Failed to delete news", err.Error())
		return
	}

	util.RespSuccess(c, http.StatusOK, "News culture berhasil dihapus permanen beserta semua foto", nil)
}

// GetAllNews godoc
// @Summary      Get all news/culture articles
// @Description  Get paginated list of news articles with optional filters (HR only)
// @Tags         News
// @Produce      json
// @Security     Bearer
// @Param        page       query  int     false  "Page number"    default(1)
// @Param        limit      query  int     false  "Items per page" default(10)
// @Param        published  query  string  false  "Filter by published status"  Enums(true, false)
// @Param        search     query  string  false  "Search by title"
// @Success      200  {object}  map[string]interface{}
// @Failure      500  {object}  map[string]interface{}
// @Router       /hr/news-cultures [get]
func (h *NewsHandler) GetAllNews(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")

	var published *bool
	if pub := c.Query("published"); pub != "" {
		if pub == "true" {
			b := true
			published = &b
		} else if pub == "false" {
			b := false
			published = &b
		}
	}

	data, total, err := h.newsService.GetAll(c.Request.Context(), page, limit, published, search)
	if err != nil {
		util.RespError(c, http.StatusInternalServerError, "Failed to get news", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "success",
		"data":    data,
		"meta": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

// GetNewsByID godoc
// @Summary      Get news by ID
// @Description  Get a single news/culture article by its ID (HR only)
// @Tags         News
// @Produce      json
// @Security     Bearer
// @Param        id  path  int  true  "News ID"
// @Success      200  {object}  map[string]interface{}
// @Failure      404  {object}  map[string]interface{}
// @Router       /hr/news-cultures/{id} [get]
func (h *NewsHandler) GetNewsByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		util.RespError(c, http.StatusBadRequest, "ID required", nil)
		return
	}

	data, err := h.newsService.GetByID(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "news not found" {
			util.RespError(c, http.StatusNotFound, "News not found", err.Error())
			return
		}
		util.RespError(c, http.StatusInternalServerError, "Failed to get news", err.Error())
		return
	}

	util.RespSuccess(c, http.StatusOK, "success", data)
}

// UpdateNews godoc
// @Summary      Update news/culture article
// @Description  Update an existing news article with optional new image/gallery (HR only)
// @Tags         News
// @Accept       mpfd
// @Produce      json
// @Security     Bearer
// @Param        id         path      int     true   "News ID"
// @Param        title      formData  string  false  "Article title"
// @Param        content    formData  string  false  "Article content"
// @Param        excerpt    formData  string  false  "Excerpt"
// @Param        published  formData  bool    false  "Published status"
// @Param        image      formData  file    false  "New main image"
// @Param        gallery    formData  file    false  "New gallery images"
// @Success      200  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]interface{}
// @Failure      404  {object}  map[string]interface{}
// @Router       /hr/news-cultures/{id} [put]
func (h *NewsHandler) UpdateNews(c *gin.Context) {
	newsID := c.Param("id")
	if newsID == "" {
		util.RespError(c, http.StatusBadRequest, "ID required", nil)
		return
	}

	var input dto.UpdateNewsCultureRequest
	if err := c.ShouldBind(&input); err != nil {
		util.RespError(c, http.StatusBadRequest, "Validation failed", err.Error())
		return
	}

	if err := validate.Struct(&input); err != nil {
		util.RespError(c, http.StatusBadRequest, "Validation failed", err.Error())
		return
	}

	imageHeader, _ := c.FormFile("image") // optional
	var galleryFiles []*multipart.FileHeader
	if files, ok := c.Request.MultipartForm.File["gallery"]; ok {
		galleryFiles = files
	}

	userID, exists := c.Get("user_id") // dari middleware
	if !exists {
		util.RespError(c, http.StatusUnauthorized, "user_id not found in context", nil)
		return
	}

	result, err := h.newsService.Update(c.Request.Context(), newsID, &input, userID, imageHeader, galleryFiles)
	if err != nil {
		if err.Error() == "news not found" {
			util.RespError(c, http.StatusNotFound, "News not found", err.Error())
			return
		}
		util.RespError(c, http.StatusInternalServerError, "Failed to update news", err.Error())
		return
	}

	util.RespSuccess(c, http.StatusOK, "News culture berhasil diupdate", result)
}