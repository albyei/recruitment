package util

import (
	"errors"
	"io"
	"mime/multipart"
	"net/textproto"
	"testing"
)

// TestFileHeader wraps multipart.FileHeader to provide custom content for testing
type TestFileHeader struct {
	*multipart.FileHeader
	content []byte
	filename string
	contentType string
}

// CreateTestFileHeader creates a test file header with the given content
func CreateTestFileHeader(filename string, content []byte, contentType string) *TestFileHeader {
	return &TestFileHeader{
		FileHeader: &multipart.FileHeader{
			Filename: filename,
			Size:     int64(len(content)),
			Header:   textproto.MIMEHeader{"Content-Type": []string{contentType}},
		},
		content:     content,
		filename:    filename,
		contentType: contentType,
	}
}

// GetSize returns the size of the test file
func (t *TestFileHeader) GetSize() int64 {
	return int64(len(t.content))
}

// GetFilename returns the filename of the test file
func (t *TestFileHeader) GetFilename() string {
	return t.filename
}

// Open returns a multipart.File that provides the test content
func (t *TestFileHeader) Open() (multipart.File, error) {
	return &testFile{content: t.content}, nil
}

// testFile implements multipart.File interface
type testFile struct {
	content []byte
	pos     int64
}

func (f *testFile) Read(p []byte) (n int, err error) {
	if f.pos >= int64(len(f.content)) {
		return 0, io.EOF
	}
	n = copy(p, f.content[f.pos:])
	f.pos += int64(n)
	return n, nil
}

func (f *testFile) ReadAt(p []byte, off int64) (n int, err error) {
	if off < 0 || off >= int64(len(f.content)) {
		return 0, io.EOF
	}
	n = copy(p, f.content[off:])
	if n < len(p) {
		return n, io.EOF
	}
	return n, nil
}

func (f *testFile) Seek(offset int64, whence int) (int64, error) {
	var newPos int64
	switch whence {
	case io.SeekStart:
		newPos = offset
	case io.SeekCurrent:
		newPos = f.pos + offset
	case io.SeekEnd:
		newPos = int64(len(f.content)) + offset
	default:
		return 0, errors.New("invalid whence")
	}
	if newPos < 0 || newPos > int64(len(f.content)) {
		return 0, io.ErrUnexpectedEOF
	}
	f.pos = newPos
	return f.pos, nil
}

func (f *testFile) Close() error {
	return nil
}

func TestValidateCV_ValidPDF(t *testing.T) {
	// Minimal valid PDF header
	pdfContent := []byte("%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\n%%EOF")

	fileHeader := CreateTestFileHeader("resume.pdf", pdfContent, "application/pdf")

	err := ValidateFile(fileHeader, FileTypeCV)
	if err != nil {
		t.Errorf("Expected no error for valid PDF, got: %v", err)
	}
}

func TestValidateCV_ValidDOCX(t *testing.T) {
	// DOCX files are ZIP files, use ZIP magic number
	docxContent := []byte{
		0x50, 0x4B, 0x03, 0x04, // ZIP magic number
		0x14, 0x00, 0x00, 0x00, 0x08, 0x00,
	}

	fileHeader := CreateTestFileHeader("resume.docx", docxContent, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")

	err := ValidateFile(fileHeader, FileTypeCV)
	if err != nil {
		t.Errorf("Expected no error for valid DOCX, got: %v", err)
	}
}

func TestValidateCV_InvalidExtension(t *testing.T) {
	pdfContent := []byte("%PDF-1.4\n%%EOF")

	fileHeader := CreateTestFileHeader("resume.txt", pdfContent, "text/plain")

	err := ValidateFile(fileHeader, FileTypeCV)
	if err == nil {
		t.Error("Expected error for invalid CV extension (.txt), got nil")
	}
}

func TestValidateCV_InvalidImageExtension(t *testing.T) {
	pdfContent := []byte("%PDF-1.4\n%%EOF")

	fileHeader := CreateTestFileHeader("resume.jpg", pdfContent, "image/jpeg")

	err := ValidateFile(fileHeader, FileTypeCV)
	if err == nil {
		t.Error("Expected error for CV with image extension, got nil")
	}
}

func TestValidateCV_ExceedsSizeLimit(t *testing.T) {
	// Create content larger than 10MB (10MB + 1 byte)
	largeContent := make([]byte, MaxCVSize+1)
	// Fill with some PDF-like header
	copy(largeContent, "%PDF-1.4\n")

	fileHeader := CreateTestFileHeader("large_cv.pdf", largeContent, "application/pdf")

	err := ValidateFile(fileHeader, FileTypeCV)
	if err == nil {
		t.Error("Expected error for CV exceeding 10MB limit, got nil")
	}
}

func TestValidateCV_MimeTypeMismatch(t *testing.T) {
	// File has .pdf extension but actual content is JPEG
	jpegContent := []byte{
		0xFF, 0xD8, 0xFF, 0xE0, // JPEG magic number
		0x00, 0x10, 0x4A, 0x46, 0x49, 0x46,
	}

	fileHeader := CreateTestFileHeader("fake.pdf", jpegContent, "application/pdf")

	err := ValidateFile(fileHeader, FileTypeCV)
	if err == nil {
		t.Error("Expected error for CV with mismatched MIME type, got nil")
	}
}

func TestValidatePhoto_ValidJPG(t *testing.T) {
	jpegContent := []byte{
		0xFF, 0xD8, 0xFF, 0xE0, // JPEG magic number
		0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
	}

	fileHeader := CreateTestFileHeader("photo.jpg", jpegContent, "image/jpeg")

	err := ValidateFile(fileHeader, FileTypePhoto)
	if err != nil {
		t.Errorf("Expected no error for valid JPG, got: %v", err)
	}
}

func TestValidatePhoto_ValidPNG(t *testing.T) {
	pngContent := []byte{
		0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG magic number
	}

	fileHeader := CreateTestFileHeader("photo.png", pngContent, "image/png")

	err := ValidateFile(fileHeader, FileTypePhoto)
	if err != nil {
		t.Errorf("Expected no error for valid PNG, got: %v", err)
	}
}

func TestValidatePhoto_ValidWEBP(t *testing.T) {
	webpContent := []byte{
		0x52, 0x49, 0x46, 0x46, // RIFF
		0x00, 0x00, 0x00, 0x00,
		0x57, 0x45, 0x42, 0x50, // WEBP
	}

	fileHeader := CreateTestFileHeader("photo.webp", webpContent, "image/webp")

	err := ValidateFile(fileHeader, FileTypePhoto)
	if err != nil {
		t.Errorf("Expected no error for valid WEBP, got: %v", err)
	}
}

func TestValidatePhoto_InvalidExtension(t *testing.T) {
	jpegContent := []byte{
		0xFF, 0xD8, 0xFF, 0xE0,
		0x00, 0x10, 0x4A, 0x46, 0x49, 0x46,
	}

	fileHeader := CreateTestFileHeader("photo.pdf", jpegContent, "application/pdf")

	err := ValidateFile(fileHeader, FileTypePhoto)
	if err == nil {
		t.Error("Expected error for photo with PDF extension, got nil")
	}
}

func TestValidatePhoto_ExceedsSizeLimit(t *testing.T) {
	// Create content larger than 5MB (5MB + 1 byte)
	largeContent := make([]byte, MaxImageSize+1)
	// Fill with JPEG header
	copy(largeContent, []byte{0xFF, 0xD8, 0xFF, 0xE0})

	fileHeader := CreateTestFileHeader("large_photo.jpg", largeContent, "image/jpeg")

	err := ValidateFile(fileHeader, FileTypePhoto)
	if err == nil {
		t.Error("Expected error for photo exceeding 5MB limit, got nil")
	}
}

func TestValidatePhoto_MimeTypeMismatch(t *testing.T) {
	// File has .jpg extension but actual content is PDF
	pdfContent := []byte{
		0x25, 0x50, 0x44, 0x46, // %PDF
	}

	fileHeader := CreateTestFileHeader("fake.jpg", pdfContent, "image/jpeg")

	err := ValidateFile(fileHeader, FileTypePhoto)
	if err == nil {
		t.Error("Expected error for photo with mismatched MIME type, got nil")
	}
}

func TestValidateCV_EmptyFile(t *testing.T) {
	emptyContent := []byte{}

	fileHeader := CreateTestFileHeader("empty.pdf", emptyContent, "application/pdf")

	err := ValidateFile(fileHeader, FileTypeCV)
	if err == nil {
		t.Error("Expected error for empty CV file, got nil")
	}
}

func TestValidatePhoto_EmptyFile(t *testing.T) {
	emptyContent := []byte{}

	fileHeader := CreateTestFileHeader("empty.jpg", emptyContent, "image/jpeg")

	err := ValidateFile(fileHeader, FileTypePhoto)
	if err == nil {
		t.Error("Expected error for empty photo file, got nil")
	}
}

func TestValidateCV_ValidCaseInsensitiveExtension(t *testing.T) {
	pdfContent := []byte("%PDF-1.4\n%%EOF")

	// Test uppercase extension
	fileHeader := CreateTestFileHeader("resume.PDF", pdfContent, "application/pdf")

	err := ValidateFile(fileHeader, FileTypeCV)
	if err != nil {
		t.Errorf("Expected no error for PDF with uppercase extension, got: %v", err)
	}
}

func TestValidatePhoto_ValidCaseInsensitiveExtension(t *testing.T) {
	jpegContent := []byte{
		0xFF, 0xD8, 0xFF, 0xE0,
		0x00, 0x10, 0x4A, 0x46, 0x49, 0x46,
	}

	// Test uppercase extension
	fileHeader := CreateTestFileHeader("photo.JPG", jpegContent, "image/jpeg")

	err := ValidateFile(fileHeader, FileTypePhoto)
	if err != nil {
		t.Errorf("Expected no error for JPG with uppercase extension, got: %v", err)
	}
}

func TestValidateCV_ValidDOC(t *testing.T) {
	// DOC files (old format) - use OLE magic number
	docContent := []byte{
		0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1, // OLE magic number
	}

	fileHeader := CreateTestFileHeader("resume.doc", docContent, "application/msword")

	err := ValidateFile(fileHeader, FileTypeCV)
	if err != nil {
		t.Errorf("Expected no error for valid DOC, got: %v", err)
	}
}

func TestValidatePhoto_ValidJPEG(t *testing.T) {
	jpegContent := []byte{
		0xFF, 0xD8, 0xFF, 0xE0,
		0x00, 0x10, 0x4A, 0x46, 0x49, 0x46,
	}

	fileHeader := CreateTestFileHeader("photo.jpeg", jpegContent, "image/jpeg")

	err := ValidateFile(fileHeader, FileTypePhoto)
	if err != nil {
		t.Errorf("Expected no error for valid JPEG, got: %v", err)
	}
}
