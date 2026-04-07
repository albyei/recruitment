package middleware

import "regexp"

// Indonesian phone / WhatsApp patterns.
// Supports formats: 08xxxxxxxxxx, +628xxxxxxxxxx, 628xxxxxxxxxx
var (
	// whatsappPattern only accepts the local 08xx format (strict)
	whatsappPattern = regexp.MustCompile(`^08[1-9][0-9]{7,10}$`)

	// indonesianPhonePattern accepts 08xx, +628xx, 628xx
	indonesianPhonePattern = regexp.MustCompile(`^(\+62|62|0)8[1-9][0-9]{7,10}$`)
)

// ValidateWhatsApp validates an Indonesian WhatsApp number (08xx format).
func ValidateWhatsApp(number string) bool {
	return whatsappPattern.MatchString(number)
}

// ValidateIndonesianPhone validates any Indonesian phone number format.
func ValidateIndonesianPhone(number string) bool {
	return indonesianPhonePattern.MatchString(number)
}
