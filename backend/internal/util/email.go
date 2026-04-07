package util

import (
	"crypto/rand"
	"log"
	"math/big"
	"os"

	"gopkg.in/gomail.v2"
)

func SendEmail(to, subject, body string) error {
	m := gomail.NewMessage()
	m.SetHeader("From", os.Getenv("EMAIL_FROM"))
	m.SetHeader("To", to)
	m.SetHeader("Subject", subject)
	m.SetBody("text/html", body)

	d := gomail.NewDialer(os.Getenv("EMAIL_SMTP_HOST"), 587, os.Getenv("EMAIL_FROM"), os.Getenv("EMAIL_PASSWORD"))

	if err := d.DialAndSend(m); err != nil {
    log.Printf("GAGAL KIRIM EMAIL ke %s | Subject: %s | Error: %v", to, subject, err)
    return err
}
log.Printf("EMAIL BERHASIL DIKIRIM ke %s | Subject: %s", to, subject)
	return nil
}

func GenerateRandomPassword() string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%"
	result := make([]byte, 12)
	for i := range result {
		n, _ := rand.Int(rand.Reader, big.NewInt(int64(len(chars))))
		result[i] = chars[n.Int64()]
	}
	return string(result)
}
