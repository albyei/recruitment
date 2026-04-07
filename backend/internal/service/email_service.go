package service

import (
	"fmt"
	"strings"
	"time"

	"wowrack-recruitment/internal/model"
	"wowrack-recruitment/internal/repository"
	"wowrack-recruitment/internal/util"
)

type EmailService interface {
	SendNewApplicationHRNotification(app *model.Application) error
	SendStatusUpdateEmail(app *model.Application, notes string, meetingLink string, interviewDate *time.Time) error
}

type emailService struct {
	repo repository.Repository
}

func NewEmailService(repo repository.Repository) EmailService {
	return &emailService{repo: repo}
}

// Helper untuk format status jadi rapi
func formatStatus(status model.ApplicationStatus) string {
	m := map[model.ApplicationStatus]string{
		model.AppApplied:                "Applied",
		model.AppScreening:              "Screening",
		model.AppContacted:              "Contacted",
		model.AppHRInterview:            "HR Interview",
		model.AppHiringManagerInterview: "Hiring Manager Interview",
		model.AppSalaryNegotiation:      "Salary Negotiation",
		model.AppHired:                  "Hired",
		model.AppRejected:               "Rejected",
	}
	if v, ok := m[status]; ok {
		return v
	}
	return strings.ReplaceAll(string(status), "_", " ")
}

// Kirim ke semua HR saat lamaran baru
func (s *emailService) SendNewApplicationHRNotification(app *model.Application) error {
	hrEmails := GetHREmails(s.repo)
	if len(hrEmails) == 0 {
		return nil // tidak ada HR aktif
	}

	subject := fmt.Sprintf("[LAMARAN BARU] %s - %s (Skor AI: %d%%)", app.Candidate.Name, app.Job.Title, app.AIScore)
	body := fmt.Sprintf(`
		<h2>Lamaran Baru Diterima</h2>
		<p><strong>Kandidat:</strong> %s (%s)</p>
		<p><strong>Posisi:</strong> %s</p>
		<p><strong>Skor AI:</strong> %d%%</p>
		<p><strong>Skill Cocok:</strong> %s</p>
		<p><strong>Skill Kurang:</strong> %s</p>
		<p><strong>Penjelasan AI:</strong> %s</p>
		<p><a href="%s">Lihat CV</a></p>
		<p>— Sistem Recruitment Wowrack</p>
	`, app.Candidate.Name, app.Candidate.Email, app.Job.Title, app.AIScore,
		strings.Join(app.MatchedSkills, ", "), strings.Join(app.MissingSkills, ", "),
		app.AIExplanation, app.CVURL)

	for _, email := range hrEmails {
		go util.SendEmail(email, subject, body)
	}
	return nil
}

// Kirim update status ke kandidat + HR/Hiring Manager sesuai kasus
func (s *emailService) SendStatusUpdateEmail(app *model.Application, notes string, meetingLink string, interviewDate *time.Time) error {
	candidateName := app.Candidate.Name
	jobTitle := app.Job.Title
	status := app.Status
	displayStatus := formatStatus(status)

	var statusMsg, extraInfo string

	switch status {
	case model.AppScreening:
		statusMsg = "Lamaran Anda sedang kami screening dan akan segera kami proses lebih lanjut."
	case model.AppContacted:
		return nil // silent
	case model.AppHRInterview:
		statusMsg = "Selamat! Anda lolos ke tahap Interview dengan HR."
	case model.AppHiringManagerInterview:
		statusMsg = "Selamat! Anda lolos ke tahap Interview dengan Hiring Manager."
	case model.AppSalaryNegotiation:
		statusMsg = "Selamat! Anda telah masuk tahap negosiasi gaji."
	case model.AppHired:
		statusMsg = "SELAMAT! Anda resmi diterima bekerja di Wowrack. Tim HR akan segera menghubungi Anda."
	case model.AppRejected:
		statusMsg = "Terima kasih atas lamaran Anda. Saat ini kami memutuskan untuk melanjutkan dengan kandidat lain."
		extraInfo = "<p>Kami menyimpan profil Anda untuk peluang di masa depan.</p>"
	default:
		statusMsg = "Status lamaran Anda telah diperbarui."
	}

	// Jadwal interview
	if interviewDate != nil {
		formattedDate := interviewDate.Format("Monday, 02 January 2006 15:04")
		extraInfo += fmt.Sprintf(`
			<p><strong>Jadwal Interview:</strong> %s</p>
			<p><strong>Link Meeting:</strong> <a href="%s">Join Microsoft Teams</a></p>
		`, formattedDate, meetingLink)
	}

	if notes != "" {
		extraInfo += fmt.Sprintf("<p><strong>Catatan dari HR:</strong><br>%s</p>", notes)
	}

	// Email ke kandidat
	candidateBody := fmt.Sprintf(`
		<h2>Update Status Lamaran - %s</h2>
		<p>Halo <strong>%s</strong>,</p>
		<p>%s untuk posisi <strong>%s</strong>.</p>
		%s
		<p>Terima kasih atas ketertarikan Anda!<br>— Tim Talent Acquisition Wowrack</p>
	`, displayStatus, candidateName, statusMsg, jobTitle, extraInfo)

	go util.SendEmail(app.Candidate.Email, "Update Status Lamaran - Wowrack", candidateBody)

	// Kirim ke semua HR untuk HR Interview
	if status == model.AppHRInterview {
		hrEmails := GetHREmails(s.repo)
		hrSubject := fmt.Sprintf("[JADWAL HR INTERVIEW] %s - %s", candidateName, jobTitle)
		hrBody := fmt.Sprintf(`
			<h2>Jadwal HR Interview</h2>
			<p><strong>Kandidat:</strong> %s (%s)</p>
			<p><strong>Posisi:</strong> %s</p>
			<p><strong>Waktu:</strong> %s</p>
			<p><a href="%s">Link Meeting Teams</a></p>
			<p><a href="%s">Lihat CV</a></p>
			<p><strong>Catatan:</strong> %s</p>
			<p>— Sistem Recruitment</p>
		`, candidateName, app.Candidate.Email, jobTitle,
			interviewDate.Format("Monday, 02 January 2006 15:04"), meetingLink, app.CVURL, notes)

		for _, email := range hrEmails {
			go util.SendEmail(email, hrSubject, hrBody)
		}
	}

	// Kirim ke Hiring Manager untuk Hiring Manager Interview
	if status == model.AppHiringManagerInterview && app.Job.CreatedBy.Email != "" {
		hmEmail := app.Job.CreatedBy.Email
		hmSubject := fmt.Sprintf("[JADWAL INTERVIEW] %s - %s", candidateName, jobTitle)
		hmBody := fmt.Sprintf(`
			<h2>Jadwal Interview dengan Anda</h2>
			<p><strong>Kandidat:</strong> %s (%s)</p>
			<p><strong>Posisi:</strong> %s</p>
			<p><strong>Waktu:</strong> %s</p>
			<p><a href="%s">Join Microsoft Teams Meeting</a></p>
			<p><a href="%s">Lihat CV Kandidat</a></p>
			<p><strong>Catatan dari HR:</strong> %s</p>
			<p>— Sistem Recruitment Wowrack</p>
		`, candidateName, app.Candidate.Email, jobTitle,
			interviewDate.Format("Monday, 02 January 2006 15:04"), meetingLink, app.CVURL, notes)

		go util.SendEmail(hmEmail, hmSubject, hmBody)
	}

	return nil
}