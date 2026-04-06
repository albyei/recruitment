package config

import (
	"os"
	"testing"
)

func TestRequiredEnvVars(t *testing.T) {
	// Save original env vars
	requiredVars := []string{"DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"}
	originalValues := make(map[string]string)
	for _, key := range requiredVars {
		originalValues[key] = os.Getenv(key)
	}
	defer func() {
		for key, value := range originalValues {
			if value != "" {
				os.Setenv(key, value)
			} else {
				os.Unsetenv(key)
			}
		}
	}()

	t.Run("should validate all required DB env vars", func(t *testing.T) {
		os.Setenv("DB_HOST", "localhost")
		os.Setenv("DB_PORT", "5432")
		os.Setenv("DB_USER", "testuser")
		os.Setenv("DB_PASSWORD", "testpass")
		os.Setenv("DB_NAME", "testdb")

		err := ValidateDBEnv()
		if err != nil {
			t.Errorf("ValidateDBEnv should pass with valid env vars: %v", err)
		}
	})

	t.Run("should fail when DB_HOST not set", func(t *testing.T) {
		os.Unsetenv("DB_HOST")
		os.Setenv("DB_PORT", "5432")
		os.Setenv("DB_USER", "testuser")
		os.Setenv("DB_PASSWORD", "testpass")
		os.Setenv("DB_NAME", "testdb")

		err := ValidateDBEnv()
		if err == nil {
			t.Error("ValidateDBEnv should fail when DB_HOST not set")
		}
	})
}
