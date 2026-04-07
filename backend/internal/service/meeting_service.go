// package service

// import (
// 	"context"
// 	"fmt"
// 	"time"

// 	"github.com/microsoftgraph/msgraph-sdk-go"
// 	"github.com/microsoftgraph/msgraph-sdk-go/models"
// 	"github.com/microsoftgraph/msgraph-sdk-go/users"
// 	"golang.org/x/oauth2/clientcredentials"
// )

// type MeetingService interface {
// 	CreateOnlineMeeting(start time.Time, durationMinutes int, subject string) (string, error)
// }

// type meetingService struct {
// 	client *msgraph.GraphServiceClient
// }

// func NewMeetingService() (MeetingService, error) {
// 	conf := clientcredentials.Config{
// 		ClientID:     "YOUR_CLIENT_ID",     // ganti dari env
// 		ClientSecret: "YOUR_CLIENT_SECRET", // ganti dari env
// 		TokenURL:     "https://login.microsoftonline.com/YOUR_TENANT_ID/oauth2/v2.0/token",
// 		Scopes:       []string{"https://graph.microsoft.com/.default"},
// 	}

// 	token, err := conf.Token(context.Background())
// 	if err != nil {
// 		return nil, err
// 	}

// 	client := msgraph.NewGraphServiceClientWithCredentials(&conf, []string{})

// 	return &meetingService{client: client}, nil
// }

// func (s *meetingService) CreateOnlineMeeting(start time.Time, durationMinutes int, subject string) (string, error) {
// 	end := start.Add(time.Duration(durationMinutes) * time.Minute)

// 	meeting := models.NewOnlineMeeting()
// 	meeting.SetSubject(&subject)
// 	meeting.SetStartDateTime(&start)
// 	meeting.SetEndDateTime(&end)

// 	request := users.NewItemOnlineMeetingsRequestBuilder("", s.client.GetAdapter())
// 	created, err := request.Post(context.Background(), meeting, nil)
// 	if err != nil {
// 		return "", err
// 	}

// 	joinURL := created.GetJoinWebUrl()
// 	if joinURL == nil {
// 		return "", fmt.Errorf("join URL tidak ditemukan")
// 	}

// 	return *joinURL, nil
// }

// internal/service/meeting_service.go (VERSI STUB — TIDAK PAKAI GRAPH)

package service

import (
	"time"
)

type MeetingService interface {
	CreateOnlineMeeting(start time.Time, durationMinutes int, subject string) (string, error)
}

type meetingService struct{}

func NewMeetingService() (MeetingService, error) {
	return &meetingService{}, nil
}

func (s *meetingService) CreateOnlineMeeting(start time.Time, durationMinutes int, subject string) (string, error) {
	// Kembalikan link dummy atau kosong
	return "", nil // atau bisa return "https://teams.microsoft.com/..." sebagai contoh
}