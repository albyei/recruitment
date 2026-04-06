package util

import (
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"
)

// FileType represents the type of file to validate
type FileType string

const (
	FileTypeCV    FileType = "cv"
	FileTypePhoto FileType = "photo"
)

// Constants for file size limits
const (
	MaxCVSize    int64 = 10 * 1024 * 1024  // 10MB
	MaxImageSize int64 = 5 * 1024 * 1024   // 5MB
)

// AllowedCVExtensions maps valid CV file extensions to true (case-insensitive)
var AllowedCVExtensions = map[string]bool{
	".pdf":  true,
	".doc":  true,
	".docx": true,
}

// AllowedCVMIMETypes maps valid CV MIME types to true
var AllowedCVMIMETypes = map[string]bool{
	"application/pdf":  true,
	"application/msword": true,
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
	"application/zip": true, // DOCX files are ZIP-based, http.DetectContentType() may detect them as ZIP
}

// AllowedImageExtensions maps valid image file extensions to true (case-insensitive)
var AllowedImageExtensions = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".webp": true,
}

// AllowedImageMIMETypes maps valid image MIME types to true
var AllowedImageMIMETypes = map[string]bool{
	"image/jpeg": true,
	"image/png":  true,
	"image/webp": true,
}

// ValidateFile validates a file based on the specified file type (CV or Photo)
// It checks:
// 1. File size limits
// 2. File extension validity
// 3. MIME type detection (actual content sniffing, not just header)
func ValidateFile(fileHeader interface{}, fileType FileType) error {
	var header *multipart.FileHeader
	var fileContent []byte

	// Handle both *multipart.FileHeader and *TestFileHeader (for testing)
	switch v := fileHeader.(type) {
	case *multipart.FileHeader:
		header = v
		file, err := header.Open()
		if err != nil {
			return fmt.Errorf("failed to open file: %w", err)
		}
		defer file.Close()

		// Read first 512 bytes for MIME type detection
		buffer := make([]byte, 512)
		n, err := file.Read(buffer)
		if err != nil && !errors.Is(err, io.EOF) {
			return fmt.Errorf("failed to read file: %w", err)
		}
		fileContent = buffer[:n]
	case interface{ GetSize() int64; GetFilename() string; Open() (multipart.File, error) }:
		// Handle TestFileHeader or similar types with GetSize and GetFilename methods
		header = &multipart.FileHeader{
			Size:     v.GetSize(),
			Filename: v.GetFilename(),
			Header:   make(map[string][]string),
		}
		file, err := v.Open()
		if err != nil {
			return fmt.Errorf("failed to open file: %w", err)
		}
		defer file.Close()

		// Read first 512 bytes for MIME type detection
		buffer := make([]byte, 512)
		n, err := file.Read(buffer)
		if err != nil && !errors.Is(err, io.EOF) {
			return fmt.Errorf("failed to read file: %w", err)
		}
		fileContent = buffer[:n]
	default:
		return fmt.Errorf("invalid file header type")
	}

	// Check file size
	if header.Size <= 0 {
		return fmt.Errorf("file is empty")
	}

	var maxSize int64
	var allowedExts map[string]bool
	var allowedMIMETypes map[string]bool

	switch fileType {
	case FileTypeCV:
		maxSize = MaxCVSize
		allowedExts = AllowedCVExtensions
		allowedMIMETypes = AllowedCVMIMETypes
	case FileTypePhoto:
		maxSize = MaxImageSize
		allowedExts = AllowedImageExtensions
		allowedMIMETypes = AllowedImageMIMETypes
	default:
		return fmt.Errorf("invalid file type: %s", fileType)
	}

	// Check file size limit
	if header.Size > maxSize {
		return fmt.Errorf("file size exceeds maximum limit of %dMB", maxSize/(1024*1024))
	}

	// Get and validate file extension
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if !allowedExts[ext] {
		return fmt.Errorf("invalid file extension: %s. Allowed extensions: %s",
			ext, getAllowedExtensions(allowedExts))
	}

	// Detect MIME type from actual file content (MIME sniffing)
	detectedMIMEType := http.DetectContentType(fileContent)

	// For DOCX files, http.DetectContentType() may return application/zip
	// This is valid because DOCX files are actually ZIP archives
	if ext == ".docx" && detectedMIMEType == "application/zip" {
		detectedMIMEType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	}

	// For WEBP files, use magic number detection
	if ext == ".webp" && detectedMIMEType == "application/octet-stream" {
		if isWebPFile(fileContent) {
			detectedMIMEType = "image/webp"
		}
	}

	// For DOC files, use magic number detection
	if ext == ".doc" && detectedMIMEType == "application/octet-stream" {
		if isOLEFile(fileContent) {
			detectedMIMEType = "application/msword"
		}
	}

	// Validate detected MIME type
	if !allowedMIMETypes[detectedMIMEType] {
		return fmt.Errorf("invalid file type detected: %s. File content does not match extension %s",
			detectedMIMEType, ext)
	}

	return nil
}

// isWebPFile checks if the file content is a valid WEBP file
// WEBP files start with RIFF....WEBP
func isWebPFile(content []byte) bool {
	if len(content) < 12 {
		return false
	}
	// Check RIFF header
	if string(content[0:4]) != "RIFF" {
		return false
	}
	// Check WEBP signature at position 8
	if string(content[8:12]) != "WEBP" {
		return false
	}
	return true
}

// isOLEFile checks if the file content is a valid OLE file (used by DOC files)
// OLE files start with 0xD0 0xCF 0x11 0xE0 0xA1 0xB1 0x1A 0xE1
func isOLEFile(content []byte) bool {
	if len(content) < 8 {
		return false
	}
	oleSignature := []byte{0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1}
	for i, b := range oleSignature {
		if content[i] != b {
			return false
		}
	}
	return true
}

// getAllowedExtensions returns a comma-separated string of allowed extensions
func getAllowedExtensions(exts map[string]bool) string {
	var result []string
	for ext := range exts {
		result = append(result, ext)
	}
	return strings.Join(result, ", ")
}
