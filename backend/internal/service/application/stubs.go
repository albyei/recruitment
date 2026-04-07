// internal/service/application/stubs.go (atau file baru)
package application

import (
    "time"
    "wowrack-recruitment/internal/model"
	"wowrack-recruitment/internal/repository"
)

type EmailService interface {
    SendNewApplicationHRNotification(app *model.Application) error
    SendStatusUpdateEmail(app *model.Application, notes string, meetingLink string, interviewDate *time.Time) error
}

type MeetingService interface {
    CreateOnlineMeeting(date time.Time, duration int, subject string) (string, error)
}

// Stub implementation (kosong dulu)
type dummyEmailService struct{}
func (d *dummyEmailService) SendNewApplicationHRNotification(app *model.Application) error { return nil }
func (d *dummyEmailService) SendStatusUpdateEmail(app *model.Application, notes string, meetingLink string, interviewDate *time.Time) error { return nil }

type dummyMeetingService struct{}
func (d *dummyMeetingService) CreateOnlineMeeting(date time.Time, duration int, subject string) (string, error) {
    return "https://dummy-meeting-link.com", nil
}

func NewEmailService(repo repository.Repository) EmailService {
    return &dummyEmailService{}
}

func NewMeetingService() (MeetingService, error) {
    return &dummyMeetingService{}, nil
}