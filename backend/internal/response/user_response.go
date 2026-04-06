package response

type LoginResponse struct {
	Token string       `json:"token"`
	User  UserResponse `json:"user"`
}

// user/response.go
type UserResponse struct {
	ID           uint     `json:"id"`
	Name         string   `json:"name"`
	Email        string   `json:"email"`
	Role         string   `json:"role"`         // Kept for backward compatibility
	Roles        []string `json:"roles"`        // New: array of roles
	Phone        string   `json:"phone,omitempty"`
	LinkedIn     string   `json:"linkedin,omitempty"`
	Address      string   `json:"address,omitempty"`
	Gender       string   `json:"gender,omitempty"`
	PhotoProfile string   `json:"photo,omitempty"`
	CreatedAt    string   `json:"created_at"`
}
