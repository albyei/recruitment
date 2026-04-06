package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetActiveJobs(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "List job aktif → nanti diisi", "data": []string{}})
}

func GetJobDetail(c *gin.Context) {
	id := c.Param("id")
	c.JSON(http.StatusOK, gin.H{"message": "Detail job " + id})
}

func QuickApply(c *gin.Context) {
	c.JSON(http.StatusAccepted, gin.H{
		"message":        "Quick Apply diterima! CV sedang diproses...",
		"status":         "uploaded",
		"next":           "AI Scoring sedang berjalan di background",
		"check_asynqmon": "http://localhost:7889",
	})
}

func GetMyApplications(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Daftar lamaran saya"})
}

func GetApplicationDetail(c *gin.Context) {
	id := c.Param("id")
	c.JSON(http.StatusOK, gin.H{"message": "Detail lamaran ID: " + id})
}