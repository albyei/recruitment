package config

import (
	"fmt"
	"os"
)

// ValidateDBEnv validates that all required database environment variables are set
func ValidateDBEnv() error {
	required := []string{"DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"}
	for _, key := range required {
		if os.Getenv(key) == "" {
			return fmt.Errorf("required environment variable %s is not set", key)
		}
	}
	return nil
}
