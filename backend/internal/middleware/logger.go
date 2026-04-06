package middleware

import (
	"log"

	"github.com/gin-gonic/gin"
)

func Logger() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		log.Printf("[%s] %s %s %d %s",
			param.TimeStamp.Format("02/Jan/2006:15:04:05"),
			param.Method,
			param.Path,
			param.StatusCode,
			param.Latency,
		)
		return ""
	})
}