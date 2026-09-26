package services

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"

	"github.com/radar-crm/backend/internal/apperrors"
	"github.com/radar-crm/backend/internal/auth"
	"github.com/radar-crm/backend/internal/config"
	"github.com/radar-crm/backend/internal/models"
	"github.com/radar-crm/backend/internal/models/dto"
	"github.com/radar-crm/backend/internal/telegram"
)

const bcryptCost = 12

type userStore interface {
	FindByID(ctx context.Context, id string) (*models.User, error)
	FindByEmail(ctx context.Context, email string) (*models.User, error)
	FindByTelegramID(ctx context.Context, telegramID int64) (*models.User, error)
	EmailExists(ctx context.Context, email string) (bool, error)
	Create(ctx context.Context, u *models.User) error
	Update(ctx context.Context, u *models.User) error
	ClearApplicationReview(ctx context.Context, id string) error
	ResubmitApplication(ctx context.Context, id string) error
	GetProjectName(ctx context.Context, projectID string) (string, error)
}

type AuthService struct {
	cfg   config.Config
	users userStore
}

func NewAuthService(cfg config.Config, users userStore) *AuthService {
	return &AuthService{cfg: cfg, users: users}
}

func normalizeTimezone(tz string) (string, error) {
	tz = strings.TrimSpace(tz)
	if tz == "" {
		return "UTC", nil
	}
	if _, err := time.LoadLocation(tz); err != nil {
		return "", apperrors.New(apperrors.ErrValidation, "invalid timezone")
	}
	return tz, nil
}

func normalizeLanguage(lang string) string {
	lang = strings.TrimSpace(strings.ToLower(lang))
	switch {
	case strings.HasPrefix(lang, "pt"):
		return "pt"
	case strings.HasPrefix(lang, "ru"):
		return "ru"
	case strings.HasPrefix(lang, "en"):
		return "en"
	default:
		return "en"
	}
}

func (s *AuthService) validateWorkerInvite(inviteCode string) error {
	if !s.cfg.RegistrationEnabled {
		return apperrors.New(apperrors.ErrRegistrationDisabled, "registration is disabled")
	}
	secret := strings.TrimSpace(s.cfg.WorkerInviteSecret)
	if secret != "" && strings.TrimSpace(inviteCode) != secret {
		return apperrors.New(apperrors.ErrForbidden, "worker registration requires valid invite code")
	}
	return nil
}

func (s *AuthService) LoginTelegram(ctx context.Context, initData, inviteCode, language string) (*dto.AuthResponse, error) {
	tgUser, err := telegram.ValidateInitData(initData, s.cfg.TelegramBotToken)
	if err != nil {
		return nil, apperrors.New(apperrors.ErrUnauthorized, "invalid telegram credentials")
	}

	user, err := s.users.FindByTelegramID(ctx, tgUser.ID)
	if errors.Is(err, apperrors.ErrNotFound) {
		if err := s.validateWorkerInvite(inviteCode); err != nil {
			return nil, err
		}
		user = &models.User{
			TelegramID: &tgUser.ID,
			Role:       models.UserRoleWorker,
			Status:     models.UserStatusPending,
			FirstName:  tgUser.FirstName,
			LastName:   tgUser.LastName,
			Language:   normalizeLanguage(language),
		}
		if err := s.users.Create(ctx, user); err != nil {
			return nil, fmt.Errorf("create telegram user: %w", err)
		}
	} else if err != nil {
		return nil, err
	}

	if !user.CanLogin() {
		return nil, apperrors.New(apperrors.ErrForbidden, "account is not allowed to login")
	}

	return s.buildAuthResponse(user)
}

func (s *AuthService) Login(ctx context.Context, email, password string) (*dto.AuthResponse, error) {
	user, err := s.users.FindByEmail(ctx, email)
	if errors.Is(err, apperrors.ErrNotFound) {
		return nil, apperrors.New(apperrors.ErrUnauthorized, "invalid email or password")
	}
	if err != nil {
		return nil, err
	}

	if user.PasswordHash == "" {
		return nil, apperrors.New(apperrors.ErrUnauthorized, "invalid email or password")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, apperrors.New(apperrors.ErrUnauthorized, "invalid email or password")
	}

	if !user.CanLogin() {
		return nil, apperrors.New(apperrors.ErrForbidden, "account is not allowed to login")
	}

	return s.buildAuthResponse(user)
}

func (s *AuthService) Register(ctx context.Context, req dto.RegisterRequest) (*dto.AuthResponse, error) {
	role := strings.TrimSpace(req.Role)
	if role == "" {
		role = string(models.UserRoleWorker)
	}

	switch models.UserRole(role) {
	case models.UserRoleWorker:
		if err := s.validateWorkerInvite(req.InviteCode); err != nil {
			return nil, err
		}
	case models.UserRoleManager:
		managerSecret := strings.TrimSpace(s.cfg.ManagerInviteSecret)
		if managerSecret == "" || strings.TrimSpace(req.InviteCode) != managerSecret {
			return nil, apperrors.New(apperrors.ErrForbidden, "manager registration requires valid invite code")
		}
	default:
		return nil, apperrors.New(apperrors.ErrValidation, "invalid role")
	}

	exists, err := s.users.EmailExists(ctx, req.Email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, apperrors.New(apperrors.ErrConflict, "email already registered")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcryptCost)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	status := models.UserStatusPending
	if models.UserRole(role) == models.UserRoleManager {
		status = models.UserStatusActive
	}

	user := &models.User{
		Role:         models.UserRole(role),
		Status:       status,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Phone:        req.Phone,
		Email:        strings.TrimSpace(req.Email),
		PasswordHash: string(hash),
		Language:     normalizeLanguage(req.Language),
	}
	if err := s.users.Create(ctx, user); err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}

	return s.buildAuthResponse(user)
}

func (s *AuthService) Me(ctx context.Context, userID string) (*dto.UserResponse, error) {
	user, err := s.users.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	resp := user.ToResponse()
	s.enrichBlockProjectName(ctx, &resp)
	return &resp, nil
}

func (s *AuthService) enrichBlockProjectName(ctx context.Context, resp *dto.UserResponse) {
	if resp.BlockProjectID == "" {
		return
	}
	name, err := s.users.GetProjectName(ctx, resp.BlockProjectID)
	if err == nil {
		resp.BlockProjectName = name
	}
}

func (s *AuthService) UpdateProfile(ctx context.Context, userID string, req dto.UpdateProfileRequest) (*dto.UserResponse, error) {
	user, err := s.users.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user.Role != models.UserRoleWorker && user.Role != models.UserRoleSupervisor && user.Role != models.UserRoleManager {
		return nil, apperrors.New(apperrors.ErrForbidden, "cannot update profile")
	}
	if user.Status == models.UserStatusBlocked {
		if req.Language == "" {
			return nil, apperrors.New(apperrors.ErrForbidden, "profile is read-only")
		}
		user.Language = normalizeLanguage(req.Language)
		if err := s.users.Update(ctx, user); err != nil {
			return nil, err
		}
		resp := user.ToResponse()
		s.enrichBlockProjectName(ctx, &resp)
		return &resp, nil
	}
	if req.FirstName != "" {
		user.FirstName = req.FirstName
	}
	if req.LastName != "" {
		user.LastName = req.LastName
	}
	if req.Phone != "" {
		user.Phone = req.Phone
	}
	if req.Email != "" {
		email := strings.TrimSpace(req.Email)
		if !strings.EqualFold(email, user.Email) {
			exists, err := s.users.EmailExists(ctx, email)
			if err != nil {
				return nil, err
			}
			if exists {
				return nil, apperrors.New(apperrors.ErrConflict, "email already registered")
			}
		}
		user.Email = email
	}
	if req.Country != "" {
		user.Country = req.Country
	}
	if req.Position != "" {
		user.Position = req.Position
	}
	if req.Specialization != "" {
		user.Specialization = req.Specialization
	}
	if req.HourlyRate != "" {
		user.HourlyRate = req.HourlyRate
	}
	if req.Language != "" {
		user.Language = normalizeLanguage(req.Language)
	}
	if req.Timezone != "" {
		tz, err := normalizeTimezone(req.Timezone)
		if err != nil {
			return nil, err
		}
		user.Timezone = tz
	}
	if req.TelegramUsername != "" {
		user.TelegramUsername = strings.TrimPrefix(strings.TrimSpace(req.TelegramUsername), "@")
	}
	if err := s.users.Update(ctx, user); err != nil {
		return nil, err
	}
	if user.Status == models.UserStatusPending && user.ApplicationCorrectionsNeeded {
		if err := s.users.ClearApplicationReview(ctx, userID); err != nil {
			return nil, err
		}
		user.ApplicationCorrectionsNeeded = false
		user.ApplicationFeedback = dto.ApplicationFeedback{}
	}
	if user.Status == models.UserStatusRejected {
		if err := s.users.ResubmitApplication(ctx, userID); err != nil {
			return nil, err
		}
		user.Status = models.UserStatusPending
		user.ApplicationCorrectionsNeeded = false
		user.ApplicationFeedback = dto.ApplicationFeedback{}
	}
	resp := user.ToResponse()
	return &resp, nil
}

func (s *AuthService) buildAuthResponse(user *models.User) (*dto.AuthResponse, error) {
	token, err := auth.GenerateToken(user, s.cfg.JWTSecret)
	if err != nil {
		return nil, err
	}
	resp := user.ToResponse()
	return &dto.AuthResponse{Token: token, User: resp}, nil
}

func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcryptCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}
