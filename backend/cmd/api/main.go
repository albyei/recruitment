// cmd/api/main.go
package main

import (
	"log"
	"os"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
	"github.com/joho/godotenv"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"

	"wowrack-recruitment/internal/config"
	_ "wowrack-recruitment/docs" // Swagger generated docs
	handler "wowrack-recruitment/internal/handlers"
	"wowrack-recruitment/internal/middleware"
	"wowrack-recruitment/internal/model"
	"wowrack-recruitment/internal/repository"
	"wowrack-recruitment/internal/service"
	"wowrack-recruitment/internal/service/application"
	"wowrack-recruitment/internal/util"
)

var phoneRegex = regexp.MustCompile(`^(\+62|62|0)8[1-9][0-9]{7,10}$`)

func validatePhone(fl validator.FieldLevel) bool {
	phone := fl.Field().String()
	if phone == "" {
		return true // omitempty
	}
	return phoneRegex.MatchString(phone)
}

func registerCustomValidations() {
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		if err := v.RegisterValidation("phone", validatePhone); err != nil {
			log.Fatal("GAGAL register validator phone:", err)
		}
		log.Println("Custom validator 'phone' berhasil didaftarkan")
	}
}

// @title           Wowrack Recruitment API
// @version         1.0
// @description     API untuk sistem rekrutmen Wowrack/Albyei Corp. Mendukung multi-role (Admin, HR, Hiring Manager, Candidate).
// @termsOfService  http://swagger.io/terms/

// @contact.name   Albyei Corp Engineering
// @contact.email  dev@albyeicorp.com

// @host      localhost:8080
// @BasePath  /api/v1

// @securityDefinitions.apikey Bearer
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.
func main() {
	// Load .env file di awal sekali (wajib!)
	err := godotenv.Load(".env")
	if err != nil {
		log.Printf("GAGAL load .env: %v", err)
		log.Println("Pastikan file .env ada di folder root project (sama dengan go.mod)")
		// Untuk dev, lanjut saja (fallback ke env sistem atau default)
	} else {
		log.Println("SUCCESS: File .env berhasil di-load")
	}

	// Initialize JWT - validate JWT_SECRET before proceeding
	if err := util.InitializeJWT(); err != nil {
		log.Fatal("JWT initialization failed:", err)
	}

	// Lanjut ke koneksi DB
	config.ConnectDB()
	db := config.DB

	if err := db.AutoMigrate(&model.User{}, &model.UserRole{}, &model.NewsCulture{}, &model.Department{}, &model.Job{}, &model.Application{}); err != nil {
		log.Fatal("GAGAL AutoMigrate:", err)
	}
	log.Println("AutoMigrate selesai → tabel users sudah punya kolom photo dan user_roles!")

	// Backfill existing users to user_roles table (idempotent)
	// This ensures existing users have their roles migrated to the new user_roles table
	result := db.Exec(`
		INSERT INTO user_roles (user_id, role, created_at)
		SELECT id, role, created_at FROM users
		WHERE role IS NOT NULL AND role != ''
		ON CONFLICT (user_id, role) DO NOTHING
	`)
	if result.Error != nil {
		log.Printf("WARNING: Backfill failed: %v", result.Error)
	} else {
		log.Printf("SUCCESS: Backfilled %d users to user_roles table", result.RowsAffected)
	}

	// Initialize logger
	logger, err := zap.NewProduction()
	if err != nil {
		log.Fatal("Failed to initialize logger:", err)
	}
	defer logger.Sync()

	// === INISIALISASI LAYER ===
	userRepo := repository.NewRepository(db)
	userService := service.NewService(logger, userRepo)
	userHandler := handler.NewUserHandler(userService)

	newsRepo := repository.NewRepository(db)
	newsService := service.NewNewsCultureService(newsRepo)
	newsHandler := handler.NewNewsHandler(newsService)

	departmentRepo := repository.NewDepartmentRepository()
	departmentService := service.NewDepartmentService(departmentRepo)
	departmentHandler := handler.NewDepartmentHandler(departmentService)

	jobRepo := repository.NewJobRepository()
	jobService := service.NewJobService(jobRepo)
	jobHandler := handler.NewJobHandler(jobService)

	applicationService := application.NewApplicationService(logger, jobRepo, userRepo)
	applicationHandler := handler.NewApplicationHandler(applicationService)

	userRoleRepo := repository.NewUserRoleRepository(db)
	adminHandler := handler.NewAdminHandler(userRepo, userRoleRepo)

	hrApplicationHandler := handler.NewHRApplicationHandler(applicationService, jobService)

	candidateApplicationHandler := handler.NewCandidateApplicationHandler(applicationService)

	// Gin setup
	r := gin.Default()
	r.MaxMultipartMemory = 10 << 20
	registerCustomValidations()

	// Global recovery middleware (handles panics)
	r.Use(middleware.RecoveryMiddleware())

	// CORS
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type,Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// ENDPOINT SETUP ADMIN PERTAMA (DISABLE IN PRODUCTION!)
	// Hanya aktif jika ENABLE_SETUP_ENDPOINT=true dan SETUP_SECRET di-set di environment
	if os.Getenv("ENABLE_SETUP_ENDPOINT") == "true" {
		r.POST("/setup-first-admin", func(c *gin.Context) {
			// Validasi setup secret dari environment
			setupSecret := os.Getenv("SETUP_SECRET")
			if setupSecret == "" {
				c.JSON(500, gin.H{"error": "Setup endpoint enabled but SETUP_SECRET not configured"})
				return
			}
			if c.GetHeader("X-Setup-Secret") != setupSecret {
				c.JSON(401, gin.H{"error": "Unauthorized"})
				return
			}

			// Cek apakah admin sudah ada
			var count int64
			if err := db.Model(&model.User{}).Where("role = ?", "admin").Count(&count).Error; err != nil {
				c.JSON(500, gin.H{"error": "Database error"})
				return
			}
			if count > 0 {
				c.JSON(400, gin.H{"error": "Admin sudah ada! Endpoint ini sudah mati."})
				return
			}

			// Input validation dengan custom check untuk whitespace-only values
			var input struct {
				Name     string `json:"name" binding:"required"`
				Email    string `json:"email" binding:"required,email"`
				Password string `json:"password" binding:"required,min=8"`
			}
			if err := c.ShouldBindJSON(&input); err != nil {
				c.JSON(400, gin.H{"error": err.Error()})
				return
			}

			// Validasi tambahan: pastikan name tidak whitespace-only
			if len(strings.TrimSpace(input.Name)) == 0 {
				c.JSON(400, gin.H{"error": "Name cannot be empty or whitespace only"})
				return
			}

			// Validasi tambahan: pastikan password tidak whitespace-only
			if len(strings.TrimSpace(input.Password)) == 0 {
				c.JSON(400, gin.H{"error": "Password cannot be empty or whitespace only"})
				return
			}

			// Password hashing dengan proper error handling
			hashed, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to hash password"})
				return
			}

			// Buat admin user
			admin := model.User{
				Name:     input.Name,
				Email:    input.Email,
				Password: string(hashed),
				Role:     "admin",
			}
			if err := db.Create(&admin).Error; err != nil {
				c.JSON(500, gin.H{"error": "Failed to create admin user"})
				return
			}

			c.JSON(201, gin.H{"message": "Admin pertama berhasil dibuat! Hapus endpoint ini sekarang."})
		})
	}

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Wowrack Recruitment API v1",
			"status":  "running",
		})
	})

	// Swagger UI - only enabled via environment variable
	if os.Getenv("ENABLE_SWAGGER") == "true" {
		r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
		log.Println("Swagger UI enabled at /swagger/index.html")
	}

	api := r.Group("/api/v1")
	{
		api.GET("/jobs", jobHandler.GetPublishedJobs)
		api.GET("/jobs/:slug", jobHandler.GetJobBySlug)
		api.POST("/jobs/:slug/apply", applicationHandler.Apply)
	}
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", userHandler.Register)
			auth.POST("/login", userHandler.Login)
		}
		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware())
		{
			protected.PUT("/profile", userHandler.UpdateMyProfile)
			protected.DELETE("/me", userHandler.DeleteMyAccount)
			protected.GET("/profile", userHandler.GetMyProfile)

			admin := protected.Group("/admin")
			admin.Use(middleware.HasRole("admin"))
			{
				admin.POST("/users", userHandler.CreateUserByAdmin)
				admin.GET("/users", userHandler.GetAllUsers)

				// Role management (Task 25)
				admin.GET("/users/:id/roles", adminHandler.GetUserRoles)
				admin.POST("/users/:id/roles", adminHandler.AddUserRole)
				admin.DELETE("/users/:id/roles/:role", adminHandler.RemoveUserRole)
			}
			hr := protected.Group("/hr")
			hr.Use(middleware.HasRole("hr"))
			{
				hr.POST("/news-cultures", newsHandler.CreateNews)
				hr.DELETE("/news-cultures/:id", newsHandler.DeleteNews)
				hr.GET("/news-cultures", newsHandler.GetAllNews)
				hr.GET("/news-cultures/:id", newsHandler.GetNewsByID)
				hr.PUT("/news-cultures/:id", newsHandler.UpdateNews)

				hr.GET("/departments", departmentHandler.GetAll)
				hr.POST("/departments", departmentHandler.Create)
				hr.GET("/departments/:id", departmentHandler.GetByID)
				hr.PUT("/departments/:id", departmentHandler.Update)
				hr.DELETE("/departments/:id", departmentHandler.Delete)

				hr.GET("/jobs", jobHandler.GetAllForHR)

				hr.DELETE("/jobs/:id", jobHandler.Delete)
				hr.PATCH("/jobs/:id/close", jobHandler.Close)
				hr.PATCH("/jobs/:id/approve", jobHandler.Approve)
				hr.PATCH("/jobs/:id/reject", jobHandler.Reject)

				hr.GET("/applications", hrApplicationHandler.GetAllApplications)
				hr.GET("/applications/:id", hrApplicationHandler.GetApplicationByID)
				hr.GET("/jobs/:id/applications", hrApplicationHandler.GetApplicationsByJob)
				hr.PATCH("/applications/:id/status", hrApplicationHandler.UpdateStatus)

				hr.GET("/active-vacancies", hrApplicationHandler.GetActiveVacancies)
				hr.GET("/active-vacancies/:id", hrApplicationHandler.GetActiveVacancyByID)
			}

			hiring_manager := protected.Group("/hiring_manager")
			hiring_manager.Use(middleware.HasRole("hiring_manager"))
			{
				hiring_manager.POST("/jobs", jobHandler.Create)
				hiring_manager.PATCH("/jobs/:id/submit", jobHandler.Submit)
				hiring_manager.PUT("/jobs/:id", jobHandler.Update)
				hiring_manager.GET("/jobs", jobHandler.GetAllForHiringManager)
				hiring_manager.PATCH("/jobs/:id/publish", jobHandler.Publish)
			}
			candidate := protected.Group("/candidate")
			{
				candidate.GET("/applications", candidateApplicationHandler.GetMyApplications)
				candidate.DELETE("/applications/:id", candidateApplicationHandler.WithdrawApplication)
				candidate.PUT("/applications/:id", candidateApplicationHandler.EditApplication)
			}
		}
	}

	// Jalankan server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server berjalan di http://localhost:%s", port)
	log.Fatal(r.Run(":" + port))
}
