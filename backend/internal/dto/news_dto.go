package dto

import (
	"mime/multipart"
)


type CreateNewsCultureRequest struct {
	Title     string                  `form:"title"     validate:"required,min=5,max=200"`
	Content   string                  `form:"content"   validate:"required,min=20"`
	Excerpt   string                  `form:"excerpt"   validate:"required,max=500"`
	Published bool                    `form:"published" validate:"boolean"`

	Image   *multipart.FileHeader   `form:"image"     validate:"required"`
	Gallery []*multipart.FileHeader `form:"gallery"`
}

type UpdateNewsCultureRequest struct {
	Title     *string                 `form:"title"     validate:"omitempty,min=5,max=200"`
	Content   *string                 `form:"content"   validate:"omitempty,min=20"`
	Excerpt   *string                 `form:"excerpt"   validate:"omitempty,max=500"`
	Published *bool                   `form:"published"`

	Image   *multipart.FileHeader   `form:"image"`
	Gallery []*multipart.FileHeader `form:"gallery"`
}