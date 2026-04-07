package util

import (
	"testing"
)

// TestJWTSecretFromEnv tests JWT token generation and validation.
// Note: JWT_SECRET must be set when running tests, e.g.:
//   JWT_SECRET="test-secret-32-characters-long" go test ./internal/util -v
func TestJWTSecretFromEnv(t *testing.T) {
	// The package init() function runs before this test and validates JWT_SECRET
	// This test verifies that token generation and validation work correctly
	// with the secret loaded from the environment

	t.Run("should generate and validate token successfully", func(t *testing.T) {
		token, err := GenerateToken(1, "test@example.com", []string{"admin"})
		if err != nil {
			t.Fatalf("GenerateToken failed: %v", err)
		}
		if token == "" {
			t.Fatal("Token should not be empty")
		}

		// Verify token can be validated
		claims, err := ValidateToken(token)
		if err != nil {
			t.Fatalf("ValidateToken failed: %v", err)
		}
		if claims.Email != "test@example.com" {
			t.Errorf("Expected email test@example.com, got %s", claims.Email)
		}
		if claims.UserID != 1 {
			t.Errorf("Expected userID 1, got %d", claims.UserID)
		}
		if len(claims.Roles) != 1 || claims.Roles[0] != "admin" {
			t.Errorf("Expected roles [admin], got %v", claims.Roles)
		}
	})

	t.Run("should fail validation for invalid token", func(t *testing.T) {
		invalidToken := "invalid.token.here"
		_, err := ValidateToken(invalidToken)
		if err == nil {
			t.Fatal("Expected error for invalid token, got nil")
		}
	})
}

// TestJWTHelper tests JWT functionality using the test helper function.
// This test bypasses the package init() and directly sets the secret for testing.
func TestJWTHelper(t *testing.T) {
	// Use the test helper to set a secret without relying on package init
	testSecret := "test-secret-32-characters-long-for-testing"
	setSecretForTesting(testSecret)

	t.Run("should generate token with custom secret", func(t *testing.T) {
		token, err := GenerateToken(42, "user@test.com", []string{"hr"})
		if err != nil {
			t.Fatalf("GenerateToken failed: %v", err)
		}

		// Verify the token contains the correct claims
		claims, err := ValidateToken(token)
		if err != nil {
			t.Fatalf("ValidateToken failed: %v", err)
		}

		if claims.UserID != 42 {
			t.Errorf("Expected userID 42, got %d", claims.UserID)
		}
		if claims.Email != "user@test.com" {
			t.Errorf("Expected email user@test.com, got %s", claims.Email)
		}
		if len(claims.Roles) != 1 || claims.Roles[0] != "hr" {
			t.Errorf("Expected roles [hr], got %v", claims.Roles)
		}
	})

	t.Run("should fail validation for token with different secret", func(t *testing.T) {
		// Generate token with one secret
		setSecretForTesting("first-secret-32-characters-long-test")
		token, err := GenerateToken(1, "test@example.com", []string{"admin"})
		if err != nil {
			t.Fatalf("GenerateToken failed: %v", err)
		}

		// Try to validate with a different secret
		setSecretForTesting("second-secret-32-characters-long-test")
		_, err = ValidateToken(token)
		if err == nil {
			t.Fatal("Expected validation error for token signed with different secret")
		}
	})
}
