// internal/service/news_culture_service.go
package service

import (
	"context"
	"errors"
	"fmt"
	"log"
	"mime/multipart"
	"net/url"
	"path/filepath"
	"strconv"
	"time"
    "os"
    "sync"
	"wowrack-recruitment/internal/dto"
	"wowrack-recruitment/internal/model"
	"wowrack-recruitment/internal/repository"
	"wowrack-recruitment/internal/response"

	"gorm.io/gorm"

	"github.com/gosimple/slug"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"  
)

var (
    onceNews   sync.Once
    minioClientNews *minio.Client // Bisa pakai client yang sama dengan auth, atau terpisah
    bucketNews string
)

func initMinioClientNews() {
    onceNews.Do(func() {
        endpoint := os.Getenv("S3_ENDPOINT")
        if endpoint == "" {
            endpoint = "127.0.0.1:9000" // fallback kalau env kosong
        }
        accessKey := os.Getenv("S3_ACCESS_KEY")
        secretKey := os.Getenv("S3_SECRET_KEY")
        useSSLStr := os.Getenv("S3_USE_SSL")
        useSSL := useSSLStr == "true"
       

        var err error
        minioClientNews, err = minio.New(endpoint, &minio.Options{
            Creds:        credentials.NewStaticV4(accessKey, secretKey, ""),
            Secure:       useSSL,
            BucketLookup: minio.BucketLookupPath,
        })
        if err != nil {
            panic("RustFS/MinIO gagal terkoneksi: " + err.Error())
        }

        bucketNews = os.Getenv("S3_BUCKET_NewsCulture")
        if bucketNews == "" {
            bucketNews = "news"
        }

        // Cek & buat bucket kalau belum ada
        ctx := context.Background()
        exists, err := minioClient.BucketExists(ctx, bucketNews)
        if err != nil {
            panic("Gagal cek bucket profiles: " + err.Error())
        }
        if !exists {
            err = minioClient.MakeBucket(ctx, bucketNews, minio.MakeBucketOptions{})
            if err != nil {
                panic("Gagal buat bucket profiles: " + err.Error())
            }
        }
    })
}

type NewsCultureService interface {
    Create(ctx context.Context, input *dto.CreateNewsCultureRequest, userID interface{}, image *multipart.FileHeader, gallery []*multipart.FileHeader) (*response.NewsCultureResponse, error)
	Delete(ctx context.Context, newsID string, userID interface{}) error   // ← BARU
	GetAll(ctx context.Context, page, limit int, published *bool, search string) ([]response.NewsCultureResponse, int64, error)
    GetByID(ctx context.Context, id string) (*response.NewsCultureResponse, error)
    Update(ctx context.Context, newsID string, input *dto.UpdateNewsCultureRequest, userID interface{}, image *multipart.FileHeader, gallery []*multipart.FileHeader) (*response.NewsCultureResponse, error) // ← BARU
}

type newsCultureService struct {
	repo       repository.Repository
	minio      *minio.Client
	bucketName string
}

func NewNewsCultureService(repo repository.Repository) NewsCultureService {
    initMinioClientNews() // atau pakai initMinioClient() kalau client sama
    return &newsCultureService{repo: repo}
}

func (s *newsCultureService) uploadFile(file *multipart.FileHeader, folder string) (string, error) {
	if file == nil {
		return "", nil
	}
	src, err := file.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	filename := fmt.Sprintf("%s/%d%s", folder, time.Now().UnixNano(), filepath.Ext(file.Filename))
	_, err = minioClientNews.PutObject(context.Background(), bucketNews, filename, src, file.Size, minio.PutObjectOptions{
		ContentType: file.Header.Get("Content-Type"),
	})
	if err != nil {
		return "", err
	}
	return filename, nil
}

func (s *newsCultureService) getFileURL(filename string) string {
	if filename == "" {
		return ""
	}
	reqParams := make(url.Values)
	u, _ := minioClientNews.PresignedGetObject(context.Background(), bucketNews, filename, time.Hour*24*7, reqParams)
	return u.String()
}

// GANTI SELURUH FUNGSI Create jadi seperti ini (hanya bagian ini yang berubah)

func (s *newsCultureService) Create(
    ctx context.Context,
    input *dto.CreateNewsCultureRequest,
    userID interface{},                         // ← GANTI dari string jadi interface{}
    image *multipart.FileHeader,
    gallery []*multipart.FileHeader,
) (*response.NewsCultureResponse, error) {
    var result response.NewsCultureResponse

    // === KONVERSI userID ke uint SECARA AMAN ===
    var creatorID uint
    switch id := userID.(type) {
    case string:
        if id == "" {
            return nil, errors.New("invalid user id")
        }
        parsed, err := strconv.ParseUint(id, 10, 64)
        if err != nil {
            return nil, errors.New("invalid user id")
        }
        creatorID = uint(parsed)
    case uint:
        creatorID = id
    case int:
        creatorID = uint(id)
    case int64:
        creatorID = uint(id)
    case uint64:
        creatorID = uint(id)
    default:
        return nil, errors.New("invalid user id type")
    }

    // 1. Slug otomatis & unik
    baseSlug := slug.Make(input.Title)
    finalSlug := baseSlug
    i := 1
    for {
        var count int64
        s.repo.GetDB().Model(&model.NewsCulture{}).Where("slug = ?", finalSlug).Count(&count)
        if count == 0 {
            break
        }
        finalSlug = fmt.Sprintf("%s-%d", baseSlug, i)
        i++
    }

    // 2. Upload cover
    imageFilename, err := s.uploadFile(image, "cover")
    if err != nil {
        return nil, err
    }

    // 3. Upload gallery
    var galleryFilenames []string
    for _, f := range gallery {
        name, err := s.uploadFile(f, "gallery")
        if err != nil {
            return nil, err
        }
        galleryFilenames = append(galleryFilenames, name)
    }

    // 4. Simpan ke DB
    news := model.NewsCulture{
        Title:       input.Title,
        Slug:        finalSlug,
        Content:     input.Content,
        Excerpt:     input.Excerpt,
        ImageURL:    imageFilename,
        GalleryURLs: galleryFilenames,
        Published:   input.Published,
        CreatedByID: creatorID,  // ← sudah pasti uint
        UpdatedByID: creatorID,
    }

    if input.Published {
        now := time.Now()
        news.PublishedAt = &now
    }

    if err := s.repo.GetDB().Create(&news).Error; err != nil {
        return nil, err
    }

    s.repo.GetDB().Preload("CreatedBy").First(&news, "id = ?", news.ID)

    // Build response (sama seperti sebelumnya)
    result = response.NewsCultureResponse{
        ID:          news.ID,
        Title:       news.Title,
        Slug:        news.Slug,
        Content:     news.Content,
        Excerpt:     news.Excerpt,
        ImageURL:    s.getFileURL(news.ImageURL),
        GalleryURLs: func() []string {
            urls := make([]string, len(news.GalleryURLs))
            for i, f := range news.GalleryURLs {
                urls[i] = s.getFileURL(f)
            }
            return urls
        }(),
        Published:   news.Published,
        PublishedAt: news.PublishedAt,
        CreatedAt:   news.CreatedAt.Format("2006-01-02 15:04:05"),
        UpdatedAt:   news.UpdatedAt.Format("2006-01-02 15:04:05"),
        CreatedBy: &response.SimpleUser{
            ID:   fmt.Sprintf("%d", news.CreatedBy.ID),
            Name: news.CreatedBy.Name,
        },
    }

    return &result, nil
}


func (s *newsCultureService) Delete(ctx context.Context, newsID string, userID interface{}) error {
    // Konversi userID ke uint (sama seperti Create)
    switch v := userID.(type) {
    case string:
        parsed, err := strconv.ParseUint(v, 10, 64)
        if err != nil {
            return errors.New("invalid user id")
        }
        _ = uint(parsed)
    case uint:
        // _ = v
    case int:
        // _ = uint(v)
    default:
        return errors.New("invalid user id type")
    }

    // Cari news + preload GalleryURLs
    var news model.NewsCulture
    if err := s.repo.GetDB().Preload("CreatedBy").First(&news, "id = ?", newsID).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return errors.New("news not found")
        }
        return err
    }

    // Optional: cek apakah user boleh hapus (misal hanya creator atau admin)
    // if news.CreatedByID != actorID { // kalau mau ketat
    //     return errors.New("forbidden: you can only delete your own news")
    // }

    // HAPUS FILE COVER DARI MINIO
    if news.ImageURL != "" {
        err := minioClientNews.RemoveObject(context.Background(), bucketNews, news.ImageURL, minio.RemoveObjectOptions{})
        if err != nil {
            log.Printf("Gagal hapus cover dari MinIO: %v (file: %s)", err, news.ImageURL)
            // JANGAN GAGALKAN DELETE DB meskipun file gagal dihapus
        }
    }

    // HAPUS SEMUA FILE GALLERY DARI MINIO
    for _, filename := range news.GalleryURLs {
        if filename == "" {
            continue
        }
        err := minioClientNews.RemoveObject(context.Background(), bucketNews, filename, minio.RemoveObjectOptions{})
        if err != nil {
            log.Printf("Gagal hapus gallery dari MinIO: %v (file: %s)", err, filename)
        }
    }

    // HAPUS DARI DATABASE (soft delete atau hard delete?)
    // Soft delete (recommended)
    if err := s.repo.GetDB().Delete(&news).Error; err != nil {
        return err
    }

    // Kalau mau HARD DELETE permanen:
    // if err := s.repo.GetDB().Unscoped().Delete(&news).Error; err != nil {
    //     return err
    // }

    return nil
}

// GET ALL NEWS + Pagination + Filter
func (s *newsCultureService) GetAll(ctx context.Context, page, limit int, published *bool, search string) ([]response.NewsCultureResponse, int64, error) {
    var newsList []model.NewsCulture
    var total int64

    query := s.repo.GetDB().Model(&model.NewsCulture{})

    // Filter published
    if published != nil {
        query = query.Where("published = ?", *published)
    }

    // Search title / excerpt
    if search != "" {
        searchPattern := "%" + search + "%"
        query = query.Where("title ILIKE ? OR excerpt ILIKE ?", searchPattern, searchPattern)
    }

    // Count total
    query.Count(&total)

    // Pagination
    if page < 1 {
        page = 1
    }
    if limit < 1 {
        limit = 10
    }
    if limit > 100 {
        limit = 100
    }
    offset := (page - 1) * limit

    // Order terbaru dulu
    query = query.Order("created_at DESC").Offset(offset).Limit(limit)

    // Preload CreatedBy
    if err := query.Preload("CreatedBy").Find(&newsList).Error; err != nil {
        return nil, 0, err
    }

    // Build response
    result := make([]response.NewsCultureResponse, len(newsList))
    for i, n := range newsList {
        result[i] = response.NewsCultureResponse{
            ID:          n.ID,
            Title:       n.Title,
            Slug:        n.Slug,
            Content:     n.Content,
            Excerpt:     n.Excerpt,
            ImageURL:    s.getFileURL(n.ImageURL),
            GalleryURLs: func() []string {
                urls := make([]string, len(n.GalleryURLs))
                for j, f := range n.GalleryURLs {
                    urls[j] = s.getFileURL(f)
                }
                return urls
            }(),
            Published:   n.Published,
            PublishedAt: n.PublishedAt,
            CreatedAt:   n.CreatedAt.Format("2006-01-02 15:04:05"),
            UpdatedAt:   n.UpdatedAt.Format("2006-01-02 15:04:05"),
            CreatedBy: &response.SimpleUser{
                ID:   fmt.Sprintf("%d", n.CreatedBy.ID),
                Name: n.CreatedBy.Name,
            },
        }
    }

    return result, total, nil
}

// GET BY ID
func (s *newsCultureService) GetByID(ctx context.Context, id string) (*response.NewsCultureResponse, error) {
    var news model.NewsCulture
    if err := s.repo.GetDB().Preload("CreatedBy").First(&news, "id = ?", id).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, errors.New("news not found")
        }
        return nil, err
    }

    resp := response.NewsCultureResponse{
        ID:          news.ID,
        Title:       news.Title,
        Slug:        news.Slug,
        Content:     news.Content,
        Excerpt:     news.Excerpt,
        ImageURL:    s.getFileURL(news.ImageURL),
        GalleryURLs: func() []string {
            urls := make([]string, len(news.GalleryURLs))
            for i, f := range news.GalleryURLs {
                urls[i] = s.getFileURL(f)
            }
            return urls
        }(),
        Published:   news.Published,
        PublishedAt: news.PublishedAt,
        CreatedAt:   news.CreatedAt.Format("2006-01-02 15:04:05"),
        UpdatedAt:   news.UpdatedAt.Format("2006-01-02 15:04:05"),
        CreatedBy: &response.SimpleUser{
            ID:   fmt.Sprintf("%d", news.CreatedBy.ID),
            Name: news.CreatedBy.Name,
        },
    }

    return &resp, nil
}

func (s *newsCultureService) Update(ctx context.Context, newsID string, input *dto.UpdateNewsCultureRequest, userID interface{}, image *multipart.FileHeader, gallery []*multipart.FileHeader) (*response.NewsCultureResponse, error) {
    // Konversi userID ke uint (sama seperti sebelumnya)
    var actorID uint
    switch id := userID.(type) {
    case string:
        parsed, err := strconv.ParseUint(id, 10, 64)
        if err != nil {
            return nil, errors.New("invalid user id")
        }
        actorID = uint(parsed)
    case uint:
        actorID = id
    default:
        return nil, errors.New("invalid user id")
    }

    // Cari news lama
    var news model.NewsCulture
    if err := s.repo.GetDB().Preload("CreatedBy").First(&news, "id = ?", newsID).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, errors.New("news not found")
        }
        return nil, err
    }

    // Optional: cek izin (hanya creator atau admin)
    // if news.CreatedByID != actorID {
    //     return nil, errors.New("forbidden: you can only edit your own news")
    // }

    // Update field jika dikirim (jika nil, tidak ubah)
    if input.Title != nil {
        news.Title = *input.Title
    }
    if input.Content != nil {
        news.Content = *input.Content
    }
    if input.Excerpt != nil {
        news.Excerpt = *input.Excerpt
    }
    if input.Published != nil {
        news.Published = *input.Published
        if *input.Published && news.PublishedAt == nil {
            now := time.Now()
            news.PublishedAt = &now
        }
    }

    // Handle image: kalau dikirim, upload baru + hapus lama
    if image != nil {
        // Upload baru
        newImageFilename, err := s.uploadFile(image, "cover")
        if err != nil {
            return nil, err
        }
        // Hapus lama dari MinIO kalau ada
        if news.ImageURL != "" {
            err := minioClientNews.RemoveObject(ctx, bucketNews, news.ImageURL, minio.RemoveObjectOptions{})
            if err != nil {
                log.Printf("Gagal hapus image lama: %v", err)
            }
        }
        news.ImageURL = newImageFilename
    }
    // Kalau tidak dikirim → biarkan lama tetap ada

    // Handle gallery: kalau dikirim, ganti semua + hapus lama
    if len(gallery) > 0 {
        // Hapus semua gallery lama dari MinIO
        for _, oldFile := range news.GalleryURLs {
            err := minioClientNews.RemoveObject(ctx, bucketNews, oldFile, minio.RemoveObjectOptions{})
            if err != nil {
                log.Printf("Gagal hapus gallery lama: %v", err)
            }
        }
        // Upload baru
        var newGallery []string
        for _, f := range gallery {
            name, err := s.uploadFile(f, "gallery")
            if err != nil {
                return nil, err
            }
            newGallery = append(newGallery, name)
        }
        news.GalleryURLs = newGallery
    }
    // Kalau tidak dikirim → biarkan lama tetap ada

    // Update slug kalau title berubah (optional, tapi direkomendasikan untuk unik)
    if input.Title != nil {
        baseSlug := slug.Make(news.Title)
        finalSlug := baseSlug
        i := 1
        for {
            var count int64
            s.repo.GetDB().Model(&model.NewsCulture{}).Where("slug = ? AND id != ?", finalSlug, newsID).Count(&count)
            if count == 0 {
                break
            }
            finalSlug = fmt.Sprintf("%s-%d", baseSlug, i)
            i++
        }
        news.Slug = finalSlug
    }

    // Update timestamp
    news.UpdatedByID = actorID
    news.UpdatedAt = time.Now()

    // Simpan update ke DB
    if err := s.repo.GetDB().Save(&news).Error; err != nil {
        return nil, err
    }

    // Build response (sama seperti GetByID)
    resp := response.NewsCultureResponse{
        ID:          news.ID,
        Title:       news.Title,
        Slug:        news.Slug,
        Content:     news.Content,
        Excerpt:     news.Excerpt,
        ImageURL:    s.getFileURL(news.ImageURL),
        GalleryURLs: func() []string {
            urls := make([]string, len(news.GalleryURLs))
            for i, f := range news.GalleryURLs {
                urls[i] = s.getFileURL(f)
            }
            return urls
        }(),
        Published:   news.Published,
        PublishedAt: news.PublishedAt,
        CreatedAt:   news.CreatedAt.Format("2006-01-02 15:04:05"),
        UpdatedAt:   news.UpdatedAt.Format("2006-01-02 15:04:05"),
        CreatedBy: &response.SimpleUser{
            ID:   fmt.Sprintf("%d", news.CreatedBy.ID),
            Name: news.CreatedBy.Name,
        },
    }

    return &resp, nil
}