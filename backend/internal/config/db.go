// internal/config/db.go
package config

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	// Validate required environment variables
	if err := ValidateDBEnv(); err != nil {
		log.Fatal("Database configuration error:", err)
	}

	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")
	sslmode := getEnv("DB_SSLMODE", "require")

	// DSN standar PostgreSQL
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=Asia/Jakarta",
		host,
		user,
		password,
		dbname,
		port,
		sslmode,
	)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Gagal konek ke PostgreSQL:", err)
	}

	sqlDB, err := DB.DB()
	if err != nil {
		log.Fatalf("Failed to get underlying SQL DB: %v", err)
	}
	if err = sqlDB.Ping(); err != nil {
		log.Fatal("Ping PostgreSQL gagal:", err)
	}

	// Run index migrations
	if err := RunIndexMigrations(); err != nil {
		log.Println("Warning: Failed to create some indexes:", err)
	}

	fmt.Println("")
	fmt.Println("╔══════════════════════════════════════════════════╗")
	fmt.Println("║        POSTGRESQL BERHASIL TERHUBUNG!            ║")
	fmt.Println("║        Host:", host, "                           ║")
	fmt.Println("║        Database:", dbname, "                     ║")
	fmt.Println("║        User    :", user, "                       ║")
	fmt.Println("╚══════════════════════════════════════════════════╝")
	fmt.Println("")
}

// RunIndexMigrations creates database indexes for performance
func RunIndexMigrations() error {
	type Application struct{}
	type Job struct{}
	type User struct{}

	// Create index on applications
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON applications(candidate_id)").Error; err != nil {
		log.Printf("Warning: Failed to create idx_applications_candidate_id: %v", err)
	}
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id)").Error; err != nil {
		log.Printf("Warning: Failed to create idx_applications_job_id: %v", err)
	}
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)").Error; err != nil {
		log.Printf("Warning: Failed to create idx_applications_status: %v", err)
	}
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at)").Error; err != nil {
		log.Printf("Warning: Failed to create idx_applications_created_at: %v", err)
	}

	// Create index on jobs
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id)").Error; err != nil {
		log.Printf("Warning: Failed to create idx_jobs_company_id: %v", err)
	}
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)").Error; err != nil {
		log.Printf("Warning: Failed to create idx_jobs_status: %v", err)
	}
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at)").Error; err != nil {
		log.Printf("Warning: Failed to create idx_jobs_created_at: %v", err)
	}

	// Create index on users
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)").Error; err != nil {
		log.Printf("Warning: Failed to create idx_users_email: %v", err)
	}
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)").Error; err != nil {
		log.Printf("Warning: Failed to create idx_users_role: %v", err)
	}

	return nil
}

// Helper getEnv for optional env vars with fallback
func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
