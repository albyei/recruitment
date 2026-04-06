package util

import "regexp"

// whatsappPattern accepts Indonesian WhatsApp numbers: 08xx, +628xx, 628xx
var whatsappPattern = regexp.MustCompile(`^(\+62|62|0)8[1-9][0-9]{7,10}$`)

// ValidateWhatsApp validates an Indonesian phone / WhatsApp number.
// Accepts 08xx, +628xx, and 628xx prefixes.
func ValidateWhatsApp(number string) bool {
	return whatsappPattern.MatchString(number)
}
