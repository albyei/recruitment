package repository

import (
	"wowrack-recruitment/internal/model"

)

type NewsCultureRepository interface {
	Create(news *model.NewsCulture) (*model.NewsCulture, error)
	FindBySlug(slug string) (*model.NewsCulture, error)
	FindByID(id string) (*model.NewsCulture, error)
	Update(news *model.NewsCulture) (*model.NewsCulture, error)
	Delete(id string) error
	GetAllPaginated(page, limit int, published *bool) ([]model.NewsCulture, int64, error)
	CheckSlugExists(slug string) (bool, error)
}