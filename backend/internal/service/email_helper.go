package service

import (
	"wowrack-recruitment/internal/model"
	"wowrack-recruitment/internal/repository"
)

func GetHREmails(repo repository.Repository) []string {
	var users []model.User
	repo.GetDB().Where("role = ? AND receive_notification = ?", "hr", true).Find(&users)

	emails := make([]string, 0)
	for _, u := range users {
		if u.Email != "" {
			emails = append(emails, u.Email)
		}
	}
	return emails
}