// internal/util/response.go
package util

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

func ValidationError(err error) map[string]string {
	result := make(map[string]string)

	if validationErrors, ok := err.(validator.ValidationErrors); ok {
		for _, e := range validationErrors {
			field := strings.ToLower(e.Field())

			switch e.Tag() {
			case "required":
				result[field] = "Field ini wajib diisi"
			case "email":
				result[field] = "Format email tidak valid"
			case "min":
				result[field] = fmt.Sprintf("Minimal %s karakter", e.Param())
			case "max":
				result[field] = fmt.Sprintf("Maksimal %s karakter", e.Param())
			case "url":
				result[field] = "Harus berupa URL yang valid"
			case "phone":
				result[field] = "Format nomor HP tidak valid (contoh: 081234567890 atau +6281234567890)"
			case "startswith":
				result[field] = "Link LinkedIn harus dimulai dengan https://www.linkedin.com/"
			case "oneof":
				result[field] = fmt.Sprintf("Harus salah satu dari: %s", e.Param())
			default:
				result[field] = fmt.Sprintf("Validasi gagal: %s", e.Tag())
			}
		}
	}

	return result
}

func RespError(c *gin.Context, status int, message string, details any) {
	c.JSON(status, gin.H{
		"error":   message,
		"details": details,
	})
}

func RespSuccess(c *gin.Context, status int, message string, data any) {
	c.JSON(status, gin.H{
		"message": message,
		"data":    data,
	})
}

func StrToUint(s string) uint {
	u, _ := strconv.ParseUint(s, 10, 32)
	return uint(u)
}