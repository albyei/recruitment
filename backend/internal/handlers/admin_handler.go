package handler

import (
	"net/http"
	"strconv"

	"wowrack-recruitment/internal/middleware"
	"wowrack-recruitment/internal/model"
	"wowrack-recruitment/internal/repository"

	"github.com/gin-gonic/gin"
)

// AdminHandler handles admin requests for user-role management
type AdminHandler struct {
	userRepo     repository.Repository
	userRoleRepo repository.UserRoleRepository
}

// NewAdminHandler creates a new AdminHandler
func NewAdminHandler(userRepo repository.Repository, userRoleRepo repository.UserRoleRepository) *AdminHandler {
	return &AdminHandler{
		userRepo:     userRepo,
		userRoleRepo: userRoleRepo,
	}
}

// GetUserRoles godoc
// @Summary      Get user roles
// @Description  Get all roles assigned to a specific user
// @Tags         Admin Roles
// @Produce      json
// @Security     Bearer
// @Param        id  path  int  true  "User ID"
// @Success      200  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]interface{}
// @Failure      401  {object}  map[string]interface{}
// @Failure      403  {object}  map[string]interface{}
// @Router       /admin/users/{id}/roles [get]
func (h *AdminHandler) GetUserRoles(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_id"})
		return
	}

	roles, err := h.userRoleRepo.FindByUserID(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal_error"})
		return
	}

	roleNames := make([]string, len(roles))
	for i, r := range roles {
		roleNames[i] = r.Role
	}

	c.JSON(http.StatusOK, gin.H{"user_id": id, "roles": roleNames})
}

// AddRoleRequest is the request body for adding a role to a user
type AddRoleRequest struct {
	Role string `json:"role" binding:"required" example:"hr"`
}

// AddUserRole godoc
// @Summary      Add role to user
// @Description  Assign a new role to a user (admin only)
// @Tags         Admin Roles
// @Accept       json
// @Produce      json
// @Security     Bearer
// @Param        id    path  int              true  "User ID"
// @Param        body  body  AddRoleRequest   true  "Role to add"
// @Success      201  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]interface{}
// @Failure      409  {object}  map[string]interface{}
// @Router       /admin/users/{id}/roles [post]
func (h *AdminHandler) AddUserRole(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_id"})
		return
	}

	var req AddRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_request", "message": err.Error()})
		return
	}

	// Validate against allowed roles
	validRoles := map[string]bool{
		"admin":          true,
		"hr":             true,
		"hiring_manager": true,
		"candidate":      true,
	}
	if !validRoles[req.Role] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_role", "message": "allowed roles: admin, hr, hiring_manager, candidate"})
		return
	}

	// Check if role already assigned
	roles, err := h.userRoleRepo.FindByUserID(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal_error"})
		return
	}
	for _, r := range roles {
		if r.Role == req.Role {
			c.JSON(http.StatusConflict, gin.H{"error": "role_already_exists", "message": "user already has this role"})
			return
		}
	}

	userRole := &model.UserRole{
		UserID: uint(id),
		Role:   req.Role,
	}
	if err := h.userRoleRepo.Create(userRole); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal_error"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Role added successfully"})
}

// RemoveUserRole godoc
// @Summary      Remove role from user
// @Description  Remove a specific role from a user (admin only). Cannot remove the last role.
// @Tags         Admin Roles
// @Produce      json
// @Security     Bearer
// @Param        id    path  int     true  "User ID"
// @Param        role  path  string  true  "Role to remove"
// @Success      200  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]interface{}
// @Router       /admin/users/{id}/roles/{role} [delete]
func (h *AdminHandler) RemoveUserRole(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_id"})
		return
	}

	role := c.Param("role")

	// Prevent removing last role
	roles, err := h.userRoleRepo.FindByUserID(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal_error"})
		return
	}
	if len(roles) <= 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot_remove_last_role", "message": "user must retain at least one role"})
		return
	}

	// Prevent admin from removing their own admin role
	requesterID := middleware.GetUserID(c)
	if requesterID == uint(id) && role == "admin" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot_remove_own_admin_role", "message": "you cannot remove your own admin role"})
		return
	}

	if err := h.userRoleRepo.Delete(uint(id), role); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal_error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Role removed successfully"})
}
