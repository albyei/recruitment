package util

import "strings"

// IsNotFound checks if the error is a 'record not found' or search failure
func IsNotFound(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "not found") || strings.Contains(msg, "tidak ditemukan")
}

// IsJobNotAvailable checks if the error is related to a job being closed or archived
func IsJobNotAvailable(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "archived") || strings.Contains(msg, "closed") || strings.Contains(msg, "ditutup") || strings.Contains(msg, "di-arsip")
}

// IsDuplicate checks if the error is a duplicate resource error
func IsDuplicate(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "duplicate") || strings.Contains(msg, "already exists") || strings.Contains(msg, "sudah ada") || strings.Contains(msg, "sudah melamar")
}
