package application

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type AIScoringService interface {
	ScoreCV(cvURL, jdURL string) (int, []string, []string, string, error)
}

type aiScoringService struct {
	client *http.Client
	url    string
}

func NewAIScoringService() AIScoringService {
	return &aiScoringService{
		client: &http.Client{Timeout: 60 * time.Second},
		url:    "http://host.docker.internal:5001/get_score",
	}
}

func (a *aiScoringService) ScoreCV(cvURL, jdURL string) (int, []string, []string, string, error) {
	payload := map[string]string{
		"cv_url": cvURL,
		"jd_url": jdURL,
	}
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return 0, nil, nil, "", fmt.Errorf("failed to marshal AI payload: %w", err)
	}

	req, err := http.NewRequest("POST", a.url, bytes.NewBuffer(jsonData))
	if err != nil {
		return 0, nil, nil, "", fmt.Errorf("failed to create AI request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := a.client.Do(req)
	if err != nil {
		return 0, nil, nil, "", fmt.Errorf("AI service request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return 0, nil, nil, "", fmt.Errorf("AI service error: status %d", resp.StatusCode)
	}

	var result struct {
		Score          int      `json:"score"`
		MatchedSkills  []string `json:"matched_skills"`
		MissingSkills  []string `json:"missing_skills"`
		Explanation    string   `json:"explanation"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return 0, nil, nil, "", fmt.Errorf("failed to decode AI response: %w", err)
	}

	return result.Score, result.MatchedSkills, result.MissingSkills, result.Explanation, nil
}