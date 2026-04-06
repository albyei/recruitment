package storage

import (
	"context"
	"fmt"
	"mime/multipart"
	"os"
	"path/filepath"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type StorageService interface {
	UploadCV(ctx context.Context, file *multipart.FileHeader) (string, string, error)
	DeleteCV(ctx context.Context, filename string) error
	GetPresignedJDURL(ctx context.Context, jobFileURL string) (string, error)
}

type minioStorage struct {
	client *minio.Client
	bucket string
}

func NewMinIOClient() StorageService {
	endpoint := os.Getenv("S3_ENDPOINT")
	if endpoint == "" {
		endpoint = "127.0.0.1:9000"
	}
	accessKey := os.Getenv("S3_ACCESS_KEY")
	secretKey := os.Getenv("S3_SECRET_KEY")
	useSSL := os.Getenv("S3_USE_SSL") == "true"

	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		panic(fmt.Sprintf("Failed to create MinIO client: %v", err)) // Panic di init, atau handle di caller
	}

	bucket := os.Getenv("S3_BUCKET_APPLICATIONS")
	if bucket == "" {
		bucket = "applications"
	}

	exists, err := client.BucketExists(context.Background(), bucket)
	if err != nil {
		panic(fmt.Sprintf("Failed to check bucket: %v", err))
	}
	if !exists {
		err = client.MakeBucket(context.Background(), bucket, minio.MakeBucketOptions{})
		if err != nil {
			panic(fmt.Sprintf("Failed to create bucket: %v", err))
		}
	}

	return &minioStorage{client: client, bucket: bucket}
}

func (m *minioStorage) UploadCV(ctx context.Context, file *multipart.FileHeader) (string, string, error) {
	src, err := file.Open()
	if err != nil {
		return "", "", fmt.Errorf("failed to open CV file: %w", err)
	}
	defer src.Close()

	filename := fmt.Sprintf("cvs/%d%s", time.Now().UnixNano(), filepath.Ext(file.Filename))
	_, err = m.client.PutObject(ctx, m.bucket, filename, src, file.Size, minio.PutObjectOptions{
		ContentType: file.Header.Get("Content-Type"),
	})
	if err != nil {
		return "", "", fmt.Errorf("failed to upload CV to MinIO: %w", err)
	}

	u, err := m.client.PresignedGetObject(ctx, m.bucket, filename, time.Hour*24*7, nil)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate presigned CV URL: %w", err)
	}

	return filename, u.String(), nil
}

func (m *minioStorage) DeleteCV(ctx context.Context, filename string) error {
	err := m.client.RemoveObject(ctx, m.bucket, filename, minio.RemoveObjectOptions{})
	if err != nil {
		return fmt.Errorf("failed to delete CV from MinIO: %w", err)
	}
	return nil
}

func (m *minioStorage) GetPresignedJDURL(ctx context.Context, jobFileURL string) (string, error) {
	u, err := m.client.PresignedGetObject(ctx, "jobs", jobFileURL, time.Hour*24*7, nil) // Asumsi bucket "jobs" untuk JD
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned JD URL: %w", err)
	}
	return u.String(), nil
}