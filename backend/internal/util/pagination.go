package util

import (
	"fmt"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Pagination represents pagination parameters and metadata
type Pagination struct {
	Page  int   `json:"page"`
	Limit int   `json:"limit"`
	Total int64 `json:"total"`
}

// GetPagination extracts and validates pagination from Gin context
func GetPagination(c *gin.Context) (Pagination, error) {
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "20")

	page, err := strconv.Atoi(pageStr)
	if err != nil {
		return Pagination{}, fmt.Errorf("invalid page parameter: must be a number")
	}
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		return Pagination{}, fmt.Errorf("invalid limit parameter: must be a number")
	}

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	if limit > 100 {
		limit = 100 // Cap at 100 to prevent abuse
	}

	return Pagination{Page: page, Limit: limit}, nil
}

// Offset calculates the database offset for pagination
func (p Pagination) Offset() int {
	return (p.Page - 1) * p.Limit
}

// Paginate returns a GORM scope for applying pagination
func Paginate(p Pagination) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Offset(p.Offset()).Limit(p.Limit)
	}
}
