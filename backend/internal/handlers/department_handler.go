package handler

import (
	"net/http"
	"strconv"
	"wowrack-recruitment/internal/dto"
	"wowrack-recruitment/internal/service"
	"wowrack-recruitment/internal/util"

	"github.com/gin-gonic/gin"
)

type departmentHandler struct {
	service service.DepartmentService
}

func NewDepartmentHandler(svc service.DepartmentService) *departmentHandler {
	return &departmentHandler{service: svc}
}

// Create godoc
// @Summary      Create department
// @Description  Create a new department (HR only)
// @Tags         Departments
// @Accept       json
// @Produce      json
// @Security     Bearer
// @Param        body  body  dto.CreateDepartmentRequest  true  "Department name"
// @Success      201  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]interface{}
// @Router       /hr/departments [post]
func (h *departmentHandler) Create(c *gin.Context) {
	var req dto.CreateDepartmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.RespError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}
	data, err := h.service.Create(req)
	if err != nil {
		util.RespError(c, http.StatusBadRequest, err.Error(), nil)
		return
	}
	util.RespSuccess(c, http.StatusCreated, "Department berhasil dibuat", data)
}

// GetAll godoc
// @Summary      Get all departments
// @Description  Get list of all departments (HR only)
// @Tags         Departments
// @Produce      json
// @Security     Bearer
// @Success      200  {object}  map[string]interface{}
// @Failure      500  {object}  map[string]interface{}
// @Router       /hr/departments [get]
func (h *departmentHandler) GetAll(c *gin.Context) {
	data, err := h.service.GetAll()
	if err != nil {
		util.RespError(c, http.StatusInternalServerError, "Gagal mengambil data", err.Error())
		return
	}
	util.RespSuccess(c, http.StatusOK, "Success get all department", data)
}

// GetByID godoc
// @Summary      Get department by ID
// @Description  Get a single department by its ID (HR only)
// @Tags         Departments
// @Produce      json
// @Security     Bearer
// @Param        id  path  int  true  "Department ID"
// @Success      200  {object}  map[string]interface{}
// @Failure      404  {object}  map[string]interface{}
// @Router       /hr/departments/{id} [get]
func (h *departmentHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		util.RespError(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	data, err := h.service.GetByID(uint(id))
	if err != nil {
		util.RespError(c, http.StatusNotFound, err.Error(), nil)
		return
	}
	util.RespSuccess(c, http.StatusOK, "Success", data)
}

// Update godoc
// @Summary      Update department
// @Description  Update an existing department name (HR only)
// @Tags         Departments
// @Accept       json
// @Produce      json
// @Security     Bearer
// @Param        id    path  int                          true  "Department ID"
// @Param        body  body  dto.UpdateDepartmentRequest  true  "Department data"
// @Success      200  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]interface{}
// @Router       /hr/departments/{id} [put]
func (h *departmentHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		util.RespError(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req dto.UpdateDepartmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.RespError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}
	data, err := h.service.Update(uint(id), req)
	if err != nil {
		util.RespError(c, http.StatusBadRequest, err.Error(), nil)
		return
	}
	util.RespSuccess(c, http.StatusOK, "Department berhasil diupdate", data)
}

// Delete godoc
// @Summary      Delete department
// @Description  Delete a department by ID (HR only)
// @Tags         Departments
// @Produce      json
// @Security     Bearer
// @Param        id  path  int  true  "Department ID"
// @Success      200  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]interface{}
// @Router       /hr/departments/{id} [delete]
func (h *departmentHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		util.RespError(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.service.Delete(uint(id)); err != nil {
		util.RespError(c, http.StatusBadRequest, err.Error(), nil)
		return
	}
	util.RespSuccess(c, http.StatusOK, "Department berhasil dihapus", nil)
}