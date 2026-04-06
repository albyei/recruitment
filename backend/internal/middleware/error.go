package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// AppError represents a standardized error response body
type AppError struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
	Field   string `json:"field,omitempty"`
}

// RecoveryMiddleware handles panics and returns a 500 response
func RecoveryMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				c.JSON(http.StatusInternalServerError, AppError{
					Error:   "internal_error",
					Message: "An unexpected error occurred",
				})
				c.Abort()
			}
		}()
		c.Next()
	}
}

// SendError sends a standardized error JSON response
func SendError(c *gin.Context, statusCode int, errCode, message string) {
	c.JSON(statusCode, AppError{
		Error:   errCode,
		Message: message,
	})
}

// SendValidationError sends a 400 validation error JSON response with field context
func SendValidationError(c *gin.Context, field, message string) {
	c.JSON(http.StatusBadRequest, AppError{
		Error:   "validation_failed",
		Field:   field,
		Message: message,
	})
}
