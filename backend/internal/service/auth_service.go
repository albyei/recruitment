// internal/service/auth_service.go
package service

import (
	"context"
	"errors"
	"fmt"
	"mime/multipart"
	"net/url"
	"os"
	"path/filepath"
	"sync"
	"time"

	"wowrack-recruitment/internal/dto"
	"wowrack-recruitment/internal/model"
	"wowrack-recruitment/internal/repository"
	"wowrack-recruitment/internal/response"
	"wowrack-recruitment/internal/util"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

var (
    once       sync.Once
    minioClient *minio.Client
    bucketProfiles string
)

func initMinioClient() {
    once.Do(func() {
        endpoint := os.Getenv("S3_ENDPOINT")
	if endpoint == "" {
    panic("S3_ENDPOINT tidak ditemukan di .env! Harus seperti '103.187.146.62:9000'")
}
        accessKey := os.Getenv("S3_ACCESS_KEY")
        secretKey := os.Getenv("S3_SECRET_KEY")
        useSSLStr := os.Getenv("S3_USE_SSL")
        useSSL := useSSLStr == "true"

        var err error
        minioClient, err = minio.New(endpoint, &minio.Options{
            Creds:        credentials.NewStaticV4(accessKey, secretKey, ""),
            Secure:       useSSL,
            BucketLookup: minio.BucketLookupPath,
        })
        if err != nil {
            panic("RustFS/MinIO gagal terkoneksi: " + err.Error())
        }

        bucketProfiles = os.Getenv("S3_BUCKET_PROFILES")
        if bucketProfiles == "" {
            bucketProfiles = "profiles"
        }

        // Cek & buat bucket kalau belum ada
        ctx := context.Background()
        exists, err := minioClient.BucketExists(ctx, bucketProfiles)
        if err != nil {
            panic("Gagal cek bucket profiles: " + err.Error())
        }
        if !exists {
            err = minioClient.MakeBucket(ctx, bucketProfiles, minio.MakeBucketOptions{})
            if err != nil {
                panic("Gagal buat bucket profiles: " + err.Error())
            }
        }
    })
}



type Service interface {
	Register(input *dto.RegisterRequest, photo *multipart.FileHeader) (*model.User, error)
	Login(input *dto.LoginRequest) (*response.LoginResponse, error)
	UpdateMyProfile(userID uint, input *dto.UpdateMyProfileRequest, photo *multipart.FileHeader) (*model.User, error)
	DeleteMyAccount(userID uint, password string) error
	GetAllUsers(currentUserRoles []string, page, limit int) ([]response.UserResponse, int64, error)
	GetMyProfile(userID uint) (*dto.MyProfileResponse, error)
	CreateUserByAdminRequest(input *dto.CreateUserByAdminRequest, photo *multipart.FileHeader) (*model.User, error)
	GetPhotoURL (filename string) string
}

type service struct {
	repository repository.Repository
	logger     *zap.Logger
}
func (s *service) GetPhotoURL (filename string) string {
	return s.getPhotoURL(filename)
}
func NewService(logger *zap.Logger, repo repository.Repository) Service {
    initMinioClient() // Init client sekali

    return &service{
        repository: repo,
        logger:     logger,
    }
}

// Upload foto → return nama file saja
func (s *service) uploadPhoto(file *multipart.FileHeader) (string, error) {
	if file == nil {
		return "", nil
	}

	// Validate photo file using file validation utility
	if err := util.ValidateFile(file, util.FileTypePhoto); err != nil {
		return "", fmt.Errorf("photo file validation failed: %w", err)
	}

	src, err := file.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	filename := fmt.Sprintf("profiles/profile-%d%s", time.Now().UnixNano(), filepath.Ext(file.Filename))
	_, err = minioClient.PutObject(context.Background(), bucketProfiles, filename, src, file.Size, minio.PutObjectOptions{
		ContentType: file.Header.Get("Content-Type"),
	})
	if err != nil {
		return "", err
	}
	return filename, nil
}

// Generate URL publik
func (s *service) getPhotoURL(filename string) string {
    if filename == "" {
        return ""
    }
    reqParams := make(url.Values)
    presignedURL, err := minioClient.PresignedGetObject(
        context.Background(),
        bucketProfiles,
        filename,
        time.Hour*24*7, // 7 hari
        reqParams,
    )
    if err != nil {
        return "" // atau return error kalau mau
    }
    return presignedURL.String()
}

// REGISTER
func (s *service) Register(input *dto.RegisterRequest, photo *multipart.FileHeader) (*model.User, error) {
	_, err := s.repository.FindByEmail(input.Email)
	if err == nil {
		return nil, errors.New("email sudah terdaftar")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}
	photoFilename, err := s.uploadPhoto(photo)
	if err != nil {
    return nil, fmt.Errorf("gagal upload foto: %w", err)
}

	user := model.User{
		Name:     input.Name,
		Email:    input.Email,
		Password: string(hashed),
		Phone:    input.Phone,
		LinkedIn: input.LinkedIn,
		Address:  input.Address,
		Gender:   input.Gender,   
		Photo:    photoFilename,  
	}

	newUser, err := s.repository.Create(&user)
	return newUser, err
}

// LOGIN — WAJIB ADA!
func (s *service) Login(input *dto.LoginRequest) (*response.LoginResponse, error) {
	user, err := s.repository.FindByEmail(input.Email)
	if err != nil {
		return nil, errors.New("email atau password salah")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		return nil, errors.New("email atau password salah")
	}

	// Fetch user roles from user_roles table using Preload
	var userWithRoles model.User
	if err := s.repository.GetDB().Preload("Roles").First(&userWithRoles, user.ID).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch user roles: %w", err)
	}

	// Validate that user has at least one role
	if len(userWithRoles.Roles) == 0 {
		return nil, errors.New("user has no assigned roles")
	}

	// Extract role names from UserRole array
	roleNames := make([]string, len(userWithRoles.Roles))
	for i, r := range userWithRoles.Roles {
		roleNames[i] = r.Role
	}

	token, err := util.GenerateToken(user.ID, user.Email, roleNames)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return &response.LoginResponse{
		Token: token,
		User: response.UserResponse{
			ID:    user.ID,
			Name:  user.Name,
			Email: user.Email,
			Role:  user.Role, // Keep for backward compatibility
			Roles: roleNames, // Add roles array
			CreatedAt: user.CreatedAt.Format("2006-01-02 15:04:05"),
		},
	}, nil
}

// UPDATE MY PROFILE
func (s *service) UpdateMyProfile(userID uint, input *dto.UpdateMyProfileRequest, photo *multipart.FileHeader) (*model.User, error) {
	user, err := s.repository.FindByID(userID)
	if err != nil {
		return nil, errors.New("user tidak ditemukan")
	}

	// Update kalau dikirim (ketentuan 1: kalau nil, tidak ubah)
	if input.Name != nil {
		user.Name = *input.Name
	}
	if input.Email != nil {
		if *input.Email != "" && *input.Email != user.Email {
			var count int64
			if err := s.repository.GetDB().Model(&model.User{}).Where("email = ? AND id != ?", *input.Email, userID).Count(&count).Error; err != nil {
				return nil, fmt.Errorf("failed to check email uniqueness: %w", err)
			}
			if count > 0 {
				return nil, errors.New("email sudah digunakan")
			}
			user.Email = *input.Email
		}
	}
	if input.Password != nil {
		hashed, err := bcrypt.GenerateFromPassword([]byte(*input.Password), bcrypt.DefaultCost)
		if err != nil {
			return nil, err
		}
		user.Password = string(hashed)
	}
	if input.Phone != nil {
		user.Phone = *input.Phone
	}
	if input.LinkedIn != nil {
		user.LinkedIn = *input.LinkedIn
	}
	if input.Address != nil {
		user.Address = *input.Address
	}
	if input.Gender != nil {
		user.Gender = *input.Gender
	}

	// Ketentuan 2: Kalau photo dikirim → upload baru + hapus lama
	if photo != nil {
		// Hapus lama kalau ada
		if user.Photo != "" {
			err := minioClient.RemoveObject(context.Background(), bucketProfiles, user.Photo, minio.RemoveObjectOptions{})
			if err != nil {
				s.logger.Error("Failed to delete old photo",
					zap.Error(err),
					zap.String("filename", user.Photo))
				// Lanjut meskipun gagal hapus
			}
		}
		// Upload baru
		photoFilename, err := s.uploadPhoto(photo)
		if err != nil {
			return nil, err
		}
		user.Photo = photoFilename
	}
	// Kalau tidak dikirim → biarkan lama tetap ada

	updatedUser, err := s.repository.Update(user)
	return updatedUser, err
}

// GET MY PROFILE
func (s *service) GetMyProfile(userID uint) (*dto.MyProfileResponse, error) {
	user, err := s.repository.FindByID(userID)
	if err != nil {
		return nil, errors.New("user tidak ditemukan")
	}

	// Fetch user roles
	var userWithRoles model.User
	if err := s.repository.GetDB().Preload("Roles").First(&userWithRoles, userID).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch user roles: %w", err)
	}

	// Extract role names
	roleNames := make([]string, len(userWithRoles.Roles))
	for i, r := range userWithRoles.Roles {
		roleNames[i] = r.Role
	}

	return &dto.MyProfileResponse{
		ID:        user.ID,
		Name:      user.Name,
		Email:     user.Email,
		Role:      user.Role, // Keep for backward compatibility
		Roles:     roleNames, // Add roles array
		Phone:     user.Phone,
		LinkedIn:  user.LinkedIn,
		Address:   user.Address,
		Gender:    user.Gender,
		PhotoURL:  s.getPhotoURL(user.Photo),
		CreatedAt: user.CreatedAt.Format("2006-01-02 15:04:05"),
	}, nil
}

// CREATE USER BY ADMIN
func (s *service) CreateUserByAdminRequest(input *dto.CreateUserByAdminRequest, photo *multipart.FileHeader) (*model.User, error) {
	// Cek email sudah ada atau belum
	var count int64
	if err := s.repository.GetDB().Model(&model.User{}).Where("email = ?", input.Email).Count(&count).Error; err != nil {
		return nil, fmt.Errorf("failed to check email existence: %w", err)
	}
	if count > 0 {
		return nil, errors.New("email sudah digunakan")
	}

	// Generate password random jika tidak diisi
	var password string
	if input.Password != nil && *input.Password != "" {
		password = *input.Password
	} else {
		password = util.GenerateRandomPassword() // pakai fungsi yang sama seperti candidate
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Upload photo jika ada
	photoFilename, err := s.uploadPhoto(photo)
	if err != nil {
		return nil, fmt.Errorf("gagal upload foto: %w", err)
	}

	user := model.User{
		Name:     input.Name,
		Email:    input.Email,
		Password: string(hashed),
		Role:     input.Role,
		Phone:    nullString(&input.Phone),
		LinkedIn: nullString(&input.LinkedIn),
		Address:  nullString(&input.Address),
		Gender:   nullString(&input.Gender),
		Photo:    photoFilename,
	}

	newUser, err := s.repository.Create(&user)
	if err != nil {
		return nil, err
	}

	// === KIRIM EMAIL KE USER BARU + CC KE ADMIN ===
	go func() {
		roleName := "HR"
		if input.Role == "hiring_manager" {
			roleName = "Hiring Manager"
		}

		body := fmt.Sprintf(`
			<h2>Selamat Datang di Sistem Recruitment Wowrack!</h2>
			<p>Halo <strong>%s</strong>,</p>
			<p>Akun %s Anda telah berhasil dibuat oleh Admin.</p>
			<p>Silakan login menggunakan credential berikut:</p>
			<ul>
				<li><strong>Email:</strong> %s</li>
				<li><strong>Password:</strong> %s</li>
			</ul>
			<p><a href="https://recruitment.wowrack.com/login">Login di sini</a></p>
			<p>Disarankan untuk mengganti password setelah login pertama.</p>
			<p>— Tim Talent Acquisition<br>Wowrack</p>
		`, input.Name, roleName, input.Email, password)

		// Kirim ke user baru
		if err := util.SendEmail(input.Email, "Akun Recruitment Wowrack Telah Dibuat", body); err != nil {
			s.logger.Error("Failed to send email to new user",
				zap.Error(err),
				zap.String("email", input.Email))
		}

		// CC ke email admin/HR tetap (misal hr@wowrack.com)
		ccBody := fmt.Sprintf("[NOTIF] Akun baru dibuat: %s (%s) dengan role %s", input.Name, input.Email, roleName)
		if err := util.SendEmail("hr@wowrack.com", "[ADMIN] Akun Baru Dibuat", ccBody); err != nil {
			s.logger.Error("Failed to send CC to HR",
				zap.Error(err))
		}
	}()

	return newUser, nil
}

// Helper untuk handle pointer to string → string
func nullString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

// DELETE MY ACCOUNT
func (s *service) DeleteMyAccount(userID uint, password string) error {
	user, err := s.repository.FindByID(userID)
	if err != nil {
		return errors.New("user tidak ditemukan")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return errors.New("password salah")
	}
	// HAPUS FOTO DARI MINIO KALAU ADA
	if user.Photo != "" {
		// Hapus object dari bucket
		err := minioClient.RemoveObject(
			context.Background(),
			bucketProfiles,
			user.Photo, // nama file yang tersimpan di DB
			minio.RemoveObjectOptions{},
		)
		if err != nil {
			// JANGAN GAGALKAN DELETE USER meski foto gagal dihapus
			s.logger.Error("Failed to delete photo from MinIO",
				zap.Error(err),
				zap.String("filename", user.Photo))
			// Bisa lanjut, atau simpan log untuk cleanup manual
		} else {
			s.logger.Info("Successfully deleted photo from MinIO",
				zap.String("filename", user.Photo))
		}
	}

	return s.repository.GetDB().Unscoped().Delete(&model.User{}, userID).Error
}

// GET ALL USERS
func (s *service) GetAllUsers(currentUserRoles []string, page, limit int) ([]response.UserResponse, int64, error) {
	valid := false
	for _, r := range currentUserRoles {
		if r == "admin" || r == "hiring_manager" || r == "hr" {
			valid = true
			break
		}
	}
	
	if !valid {
		return nil, 0, errors.New("akses ditolak")
	}
	users, total, err := s.repository.FindAllWithPagination(page, limit)
	if err != nil {
		return nil, 0, err
	}
	var resp []response.UserResponse
	for _, u := range users {
		resp = append(resp, response.UserResponse{
			ID:        u.ID,
			Name:      u.Name,
			Email:     u.Email,
			Role:      u.Role,
			Phone:     u.Phone,
			LinkedIn:  u.LinkedIn,
			Address:   u.Address,
			Gender:    u.Gender,
			PhotoProfile: s.getPhotoURL(u.Photo),
			CreatedAt: u.CreatedAt.Format("2006-01-02 15:04"),
		})
	}
	return resp, total, nil
}