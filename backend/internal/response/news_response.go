package response

import "time"

type NewsCultureResponse struct {
	ID          string      `json:"id"`
	Title       string      `json:"title"`
	Slug        string      `json:"slug"`
	Content     string      `json:"content"`
	Excerpt     string      `json:"excerpt"`
	ImageURL    string      `json:"image_url"`
	GalleryURLs []string    `json:"gallery_urls"`
	Published   bool        `json:"published"`
	PublishedAt *time.Time  `json:"published_at,omitempty"`
	CreatedAt   string   `json:"created_at"`
	UpdatedAt   string   `json:"updated_at"`
	CreatedBy   *SimpleUser `json:"created_by,omitempty"`
}

type NewsCultureCardResponse struct {
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	Slug        string   `json:"slug"`
	Excerpt     string   `json:"excerpt"`
	ImageURL    string   `json:"image_url"`
	Published   bool     `json:"published"`
	PublishedAt *time.Time `json:"published_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

type SimpleUser struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}