package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type NewsCulture struct {
	ID string `gorm:"type:uuid;primaryKey"`
	Title       string         `gorm:"type:text;not null" validate:"required,min=5,max=200" json:"title"`	
	Slug        string         `gorm:"type:text;uniqueIndex:idx_news_culture_slug;not null" validate:"required,alphanumdash" json:"slug"`
	Content     string         `gorm:"type:text;not null" validate:"required" json:"content"`
	Excerpt     string         `gorm:"type:text;not null" validate:"required,max=500" json:"excerpt"`

	ImageURL    string         `gorm:"type:text;not null"`
	GalleryURLs []string `gorm:"type:jsonb;default:'[]';serializer:json" json:"gallery_urls"`	

	Published     bool       `gorm:"default:false" json:"published"`
	PublishedAt   *time.Time `gorm:"index" json:"published_at,omitempty"`

	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`

	CreatedByID uint `gorm:"not null;index" json:"-"`
	UpdatedByID uint `gorm:"index" json:"-"`

	CreatedBy     User   `gorm:"foreignKey:CreatedByID;references:ID" json:"created_by,omitempty"`
	UpdatedBy     User   `gorm:"foreignKey:UpdatedByID;references:ID" json:"updated_by,omitempty"`
}

// TableName untuk nama tabel yang jelas dan konsisten
func (NewsCulture) TableName() string {
	return "news_culture"
}

// BeforeCreate hook: pastikan ID terisi (jaga-jaga kalau DB tidak pakai gen_random_uuid)
func (n *NewsCulture) BeforeCreate(tx *gorm.DB) error {
	if n.ID == "" {
		n.ID = uuid.New().String()
	}
	return nil
}

// BeforeUpdate: otomatis set PublishedAt saat pertama kali dipublish
func (n *NewsCulture) BeforeUpdate(tx *gorm.DB) error {
	if tx.Statement.Changed("Published") && n.Published && n.PublishedAt == nil {
		now := time.Now()
		n.PublishedAt = &now
	}
	return nil
}