package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// HasRole checks if user has specific role
func HasRole(role string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roles := GetRoles(c)
		for _, r := range roles {
			if r == role {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden", "message": "role '" + role + "' required"})
		c.Abort()
	}
}

// HasAnyRole checks if user has any of the specified roles
func HasAnyRole(allowedRoles []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roles := GetRoles(c)
		for _, userRole := range roles {
			for _, allowedRole := range allowedRoles {
				if userRole == allowedRole {
					c.Next()
					return
				}
			}
		}

		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden", "message": "one of the following roles required: " + strings.Join(allowedRoles, ", ")})
		c.Abort()
	}
}

// HasAllRoles checks if user has all of the specified roles
func HasAllRoles(requiredRoles []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roles := GetRoles(c)
		roleMap := make(map[string]bool)
		for _, r := range roles {
			roleMap[r] = true
		}

		for _, required := range requiredRoles {
			if !roleMap[required] {
				c.JSON(http.StatusForbidden, gin.H{"error": "forbidden", "message": "all of the following roles required: " + strings.Join(requiredRoles, ", ")})
				c.Abort()
				return
			}
		}

		c.Next()
	}
}
