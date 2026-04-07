package dto

type RegisterRequest struct {
	Name     string `json:"name"     form:"name"     binding:"required,min=3,max=100"`
	Email    string `json:"email"    form:"email"    binding:"required,email,max=100"`
	Password string `json:"password" form:"password" binding:"required,min=8,containsany=!@#$%^&*()_+"`
	Phone    string `json:"phone"    form:"phone"    binding:"omitempty,phone"`
	LinkedIn string `json:"linkedin" form:"linkedin" binding:"omitempty,url,startswith=https://www.linkedin.com/"`
	Address  string `json:"address"  form:"address"  binding:"omitempty,min=5,max=255"`
	Gender   string `json:"gender"   form:"gender"   binding:"omitempty,oneof=male female"`
}

type LoginRequest struct {
	Email    string `json:"email" form:"email" binding:"required,email"`
	Password string `json:"password" form:"password" binding:"required"`
}

type UpdateMyProfileRequest struct {
	Name     *string `json:"name"     form:"name"     binding:"required,min=3,max=100"`
	Email    *string `json:"email"    form:"email"    binding:"required,email,max=100"`
	Password *string `json:"password" form:"password" binding:"omitempty,min=8,containsany=!@#$%^&*()_+"`
	Phone    *string `json:"phone"    form:"phone"    binding:"omitempty,phone"`
	LinkedIn *string `json:"linkedin" form:"linkedin" binding:"omitempty,url,startswith=https://www.linkedin.com/"`
	Address  *string `json:"address"  form:"address"  binding:"omitempty,min=5,max=255"`
	Gender   *string `json:"gender"   form:"gender"   binding:"omitempty,oneof=male female"`
}

type AdminUpdateUserRequest struct {
	Name     string `json:"name"     form:"name"     binding:"required,min=3,max=100"`
	Email    string `json:"email"    form:"email"    binding:"required,email,max=100"`
	Password string `json:"password" form:"password" binding:"omitempty,min=8,containsany=!@#$%^&*()_+"`
	Phone    string `json:"phone"    form:"phone"    binding:"omitempty,phone"`
	LinkedIn string `json:"linkedin" form:"linkedin" binding:"omitempty,url,startswith=https://www.linkedin.com/"`
	Address  string `json:"address"  form:"address"  binding:"omitempty,min=5,max=255"`
	Role     string `json:"role"     form:"role"     binding:"omitempty,oneof=admin recruiter candidate"`
	Gender   string `json:"gender"   form:"gender"   binding:"omitempty,oneof=male female"`
}
type DeleteMyAccountRequest struct {
	Password string `json:"password" binding:"required,min=6"`
	Reason   string `json:"reason,omitempty" binding:"omitempty,max=500"`
}

type MyProfileResponse struct {
	ID        uint     `json:"id"`
	Name      string   `json:"name"`
	Email     string   `json:"email"`
	Role      string   `json:"role"`      // Kept for backward compatibility
	Roles     []string `json:"roles"`     // New: array of roles
	Phone     string   `json:"phone,omitempty"`
	LinkedIn  string   `json:"linkedin,omitempty"`
	Address   string   `json:"address,omitempty"`
	Gender    string   `json:"gender,omitempty"`
	PhotoURL  string   `json:"photo_url,omitempty"`
	CreatedAt string   `json:"created_at"`
}

type CreateUserByAdminRequest struct {
	Name     string  `json:"name"     form:"name"     binding:"required,min=3,max=100"`
	Email    string  `json:"email"    form:"email"    binding:"required,email,max=100"`
	Password *string `json:"password,omitempty"`
	Role     string  `json:"role"     form:"role"     binding:"required,oneof=hr hiring_manager"`
	Phone    string  `json:"phone"    form:"phone"    binding:"omitempty,phone"`
	LinkedIn string  `json:"linkedin" form:"linkedin" binding:"omitempty,url,startswith=https://www.linkedin.com/"`
	Address  string  `json:"address"  form:"address"  binding:"omitempty,min=5,max=255"`
	Gender   string  `json:"gender"   form:"gender"   binding:"omitempty,oneof=male female"`
	
}
