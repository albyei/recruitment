//go:build integration

package integration

import (
	"fmt"
	"os"
	"testing"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	
	"wowrack-recruitment/internal/config"
	"wowrack-recruitment/internal/model"
	"wowrack-recruitment/internal/util"
)

var (
	testDB *gorm.DB
)

// TestMain is main entry point for all integration tests
func TestMain(m *testing.M) {
	var err error
	
	// Setup JWT for tests
	os.Setenv("JWT_SECRET", "superdupersecretkeyforintegrationtests1234567890")
	if err := util.InitializeJWT(); err != nil {
		panic(fmt.Sprintf("Failed to initialize JWT: %v", err))
	}

	// Setup MinIO to use public play server for integration testing without Docker
	os.Setenv("S3_ENDPOINT", "play.min.io")
	os.Setenv("S3_ACCESS_KEY", "Q3AM3UQ867SPQQA43P2F")
	os.Setenv("S3_SECRET_KEY", "zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG")
	os.Setenv("S3_USE_SSL", "true")
	os.Setenv("S3_BUCKET_JOBS", "integration-jobs")
	os.Setenv("S3_BUCKET_PROFILES", "integration-profiles")

	// Connect to the test database (SQLite in-memory)
	testDB, err = gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	if err != nil {
		panic(fmt.Sprintf("Failed to connect to test database: %v", err))
	}
	config.DB = testDB

	// Run migrations on the test database
	if err := testDB.AutoMigrate(
		&model.User{},
		&model.UserRole{},
		&model.NewsCulture{},
		&model.Department{},
		&model.Job{},
		&model.Application{},
	); err != nil {
		sqlDB, _ := testDB.DB()
		if sqlDB != nil {
			sqlDB.Close()
		}
		panic(fmt.Sprintf("Failed to run migrations: %v", err))
	}

	fmt.Println("Integration tests setup complete - migrations applied successfully")

	// Run the test suite
	code := m.Run()

	// Cleanup: Close database connection
	if testDB != nil {
		sqlDB, _ := testDB.DB()
		if sqlDB != nil {
			_ = sqlDB.Close()
		}
	}

	fmt.Println("Integration tests cleanup complete")
	os.Exit(code)
}

// GetTestDB returns the test database instance for use in tests
func GetTestDB() *gorm.DB {
	return testDB
}
