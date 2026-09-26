package dto

type TelegramAuthRequest struct {
	InitData   string `json:"initData" binding:"required"`
	InviteCode string `json:"inviteCode,omitempty"`
	Language   string `json:"language,omitempty"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type RegisterRequest struct {
	Email      string `json:"email" binding:"required,email"`
	Password   string `json:"password" binding:"required,min=8"`
	FirstName  string `json:"firstName" binding:"required"`
	LastName   string `json:"lastName" binding:"required"`
	Phone      string `json:"phone"`
	Role       string `json:"role"` // worker by default; manager requires invite secret
	InviteCode string `json:"inviteCode,omitempty"`
	Language   string `json:"language,omitempty"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refreshToken" binding:"required"`
}

type AuthResponse struct {
	Token        string       `json:"token"`
	RefreshToken string       `json:"refreshToken,omitempty"`
	User         UserResponse `json:"user"`
}

type UserResponse struct {
	ID                           string               `json:"id"`
	TelegramID                   *int64               `json:"telegramId,omitempty"`
	Role                         string               `json:"role"`
	Status                       string               `json:"status"`
	FirstName                    string               `json:"firstName"`
	LastName                     string               `json:"lastName"`
	Phone                        string               `json:"phone"`
	Email                        string               `json:"email"`
	Country                      string               `json:"country"`
	Position                     string               `json:"position"`
	Specialization               string               `json:"specialization"`
	HourlyRate                   string               `json:"hourlyRate"`
	Language                     string               `json:"language"`
	Timezone                     string               `json:"timezone"`
	CreatedAt                    string               `json:"createdAt,omitempty"`
	TelegramUsername             string               `json:"telegramUsername,omitempty"`
	BlockReason                  string               `json:"blockReason,omitempty"`
	BlockedAt                    string               `json:"blockedAt,omitempty"`
	BlockProjectID               string               `json:"blockProjectId,omitempty"`
	BlockProjectName             string               `json:"blockProjectName,omitempty"`
	ApplicationCorrectionsNeeded bool                 `json:"applicationCorrectionsNeeded,omitempty"`
	ApplicationFeedback          *ApplicationFeedback `json:"applicationFeedback,omitempty"`
}

type UpdateProfileRequest struct {
	FirstName        string `json:"firstName"`
	LastName         string `json:"lastName"`
	Phone            string `json:"phone"`
	Email            string `json:"email"`
	Country          string `json:"country"`
	Position         string `json:"position"`
	Specialization   string `json:"specialization"`
	HourlyRate       string `json:"hourlyRate"`
	Language         string `json:"language"`
	Timezone         string `json:"timezone"`
	TelegramUsername string `json:"telegramUsername"`
}
