package services_test

import (
	"context"
	"errors"
	"testing"

	"github.com/radar-crm/backend/internal/apperrors"
	"github.com/radar-crm/backend/internal/config"
	"github.com/radar-crm/backend/internal/models"
	"github.com/radar-crm/backend/internal/models/dto"
	"github.com/radar-crm/backend/internal/services"
	"golang.org/x/crypto/bcrypt"
)

type mockUserRepo struct {
	byEmail    map[string]*models.User
	byTelegram map[int64]*models.User
	created    []*models.User
}

func (m *mockUserRepo) FindByID(_ context.Context, id string) (*models.User, error) {
	for _, u := range m.byEmail {
		if u.ID == id {
			return u, nil
		}
	}
	return nil, apperrors.ErrNotFound
}

func (m *mockUserRepo) FindByEmail(_ context.Context, email string) (*models.User, error) {
	if u, ok := m.byEmail[email]; ok {
		return u, nil
	}
	return nil, apperrors.ErrNotFound
}

func (m *mockUserRepo) FindByTelegramID(_ context.Context, id int64) (*models.User, error) {
	if u, ok := m.byTelegram[id]; ok {
		return u, nil
	}
	return nil, apperrors.ErrNotFound
}

func (m *mockUserRepo) EmailExists(_ context.Context, email string) (bool, error) {
	_, ok := m.byEmail[email]
	return ok, nil
}

func (m *mockUserRepo) Create(_ context.Context, u *models.User) error {
	u.ID = "generated-id"
	m.created = append(m.created, u)
	if u.Email != "" {
		if m.byEmail == nil {
			m.byEmail = map[string]*models.User{}
		}
		m.byEmail[u.Email] = u
	}
	if u.TelegramID != nil {
		if m.byTelegram == nil {
			m.byTelegram = map[int64]*models.User{}
		}
		m.byTelegram[*u.TelegramID] = u
	}
	return nil
}

func (m *mockUserRepo) Update(_ context.Context, u *models.User) error {
	for email, existing := range m.byEmail {
		if existing.ID == u.ID {
			copied := *u
			m.byEmail[email] = &copied
			return nil
		}
	}
	return nil
}

func (m *mockUserRepo) ClearApplicationReview(_ context.Context, _ string) error { return nil }

func (m *mockUserRepo) ResubmitApplication(_ context.Context, id string) error {
	for _, u := range m.byEmail {
		if u.ID == id && u.Status == models.UserStatusRejected {
			u.Status = models.UserStatusPending
			u.ApplicationCorrectionsNeeded = false
			u.ApplicationFeedback = dto.ApplicationFeedback{}
			return nil
		}
	}
	return apperrors.ErrNotFound
}

func (m *mockUserRepo) GetProjectName(_ context.Context, _ string) (string, error) {
	return "", apperrors.ErrNotFound
}

func TestHashPassword(t *testing.T) {
	hash, err := services.HashPassword("password123")
	if err != nil {
		t.Fatalf("hash password: %v", err)
	}
	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte("password123")); err != nil {
		t.Fatalf("compare hash: %v", err)
	}
}

func TestRegisterWorkerDisabled(t *testing.T) {
	repo := &mockUserRepo{byEmail: map[string]*models.User{}}
	svc := services.NewAuthService(config.Config{RegistrationEnabled: false}, repo)

	_, err := svc.Register(context.Background(), dto.RegisterRequest{
		Email:     "w@example.com",
		Password:  "password123",
		FirstName: "W",
		LastName:  "1",
	})
	var appErr *apperrors.AppError
	if !errors.As(err, &appErr) || !errors.Is(appErr.Code, apperrors.ErrRegistrationDisabled) {
		t.Fatalf("expected registration disabled, got %v", err)
	}
}

func TestLoginRejectedUser(t *testing.T) {
	hash, _ := services.HashPassword("password123")
	repo := &mockUserRepo{byEmail: map[string]*models.User{
		"rejected@example.com": {
			ID:           "u2",
			Email:        "rejected@example.com",
			PasswordHash: hash,
			Status:       models.UserStatusRejected,
			Role:         models.UserRoleWorker,
		},
	}}
	svc := services.NewAuthService(config.Config{JWTSecret: "secret"}, repo)

	resp, err := svc.Login(context.Background(), "rejected@example.com", "password123")
	if err != nil {
		t.Fatalf("expected successful login, got %v", err)
	}
	if resp.User.Status != string(models.UserStatusRejected) {
		t.Fatalf("expected rejected status, got %s", resp.User.Status)
	}
	if resp.Token == "" {
		t.Fatal("expected token")
	}
}

func TestLoginBlockedUser(t *testing.T) {
	hash, _ := services.HashPassword("password123")
	repo := &mockUserRepo{byEmail: map[string]*models.User{
		"blocked@example.com": {
			ID:           "u1",
			Email:        "blocked@example.com",
			PasswordHash: hash,
			Status:       models.UserStatusBlocked,
			Role:         models.UserRoleWorker,
		},
	}}
	svc := services.NewAuthService(config.Config{JWTSecret: "secret"}, repo)

	resp, err := svc.Login(context.Background(), "blocked@example.com", "password123")
	if err != nil {
		t.Fatalf("expected successful login, got %v", err)
	}
	if resp.User.Status != string(models.UserStatusBlocked) {
		t.Fatalf("expected blocked status, got %s", resp.User.Status)
	}
	if resp.Token == "" {
		t.Fatal("expected token")
	}
}

func TestRegisterWorkerPending(t *testing.T) {
	repo := &mockUserRepo{byEmail: map[string]*models.User{}}
	svc := services.NewAuthService(config.Config{
		RegistrationEnabled: true,
		JWTSecret:           "secret",
	}, repo)

	resp, err := svc.Register(context.Background(), dto.RegisterRequest{
		Email:     "w@example.com",
		Password:  "password123",
		FirstName: "Worker",
		LastName:  "One",
	})
	if err != nil {
		t.Fatalf("register: %v", err)
	}
	if resp.User.Status != string(models.UserStatusPending) {
		t.Fatalf("expected pending status, got %s", resp.User.Status)
	}
	if resp.Token == "" {
		t.Fatal("expected token")
	}
}

func TestRegisterWorkerInvalidInvite(t *testing.T) {
	repo := &mockUserRepo{byEmail: map[string]*models.User{}}
	svc := services.NewAuthService(config.Config{
		RegistrationEnabled: true,
		WorkerInviteSecret:  "secret-for-worker-registration",
		JWTSecret:           "secret",
	}, repo)

	_, err := svc.Register(context.Background(), dto.RegisterRequest{
		Email:      "w@example.com",
		Password:   "password123",
		FirstName:  "Worker",
		LastName:   "One",
		InviteCode: "wrong",
	})
	var appErr *apperrors.AppError
	if !errors.As(err, &appErr) || !errors.Is(appErr.Code, apperrors.ErrForbidden) {
		t.Fatalf("expected forbidden, got %v", err)
	}
}

func TestRegisterWorkerValidInvite(t *testing.T) {
	repo := &mockUserRepo{byEmail: map[string]*models.User{}}
	svc := services.NewAuthService(config.Config{
		RegistrationEnabled: true,
		WorkerInviteSecret:  "secret-for-worker-registration",
		JWTSecret:           "secret",
	}, repo)

	resp, err := svc.Register(context.Background(), dto.RegisterRequest{
		Email:      "w@example.com",
		Password:   "password123",
		FirstName:  "Worker",
		LastName:   "One",
		InviteCode: " secret-for-worker-registration ",
		Language:   "en",
	})
	if err != nil {
		t.Fatalf("register: %v", err)
	}
	if resp.User.Language != "en" {
		t.Fatalf("expected language en, got %s", resp.User.Language)
	}
}

func TestRegisterWorkerPortugueseLanguage(t *testing.T) {
	repo := &mockUserRepo{byEmail: map[string]*models.User{}}
	svc := services.NewAuthService(config.Config{
		RegistrationEnabled: true,
		WorkerInviteSecret:  "secret-for-worker-registration",
		JWTSecret:           "secret",
	}, repo)

	resp, err := svc.Register(context.Background(), dto.RegisterRequest{
		Email:      "pt@example.com",
		Password:   "password123",
		FirstName:  "Worker",
		LastName:   "PT",
		InviteCode: "secret-for-worker-registration",
		Language:   "pt-PT",
	})
	if err != nil {
		t.Fatalf("register: %v", err)
	}
	if resp.User.Language != "pt" {
		t.Fatalf("expected language pt, got %s", resp.User.Language)
	}
}

func TestRegisterWorkerEmptyLanguageDefaultsToEnglish(t *testing.T) {
	repo := &mockUserRepo{byEmail: map[string]*models.User{}}
	svc := services.NewAuthService(config.Config{
		RegistrationEnabled: true,
		WorkerInviteSecret:  "secret-for-worker-registration",
		JWTSecret:           "secret",
	}, repo)

	resp, err := svc.Register(context.Background(), dto.RegisterRequest{
		Email:      "default@example.com",
		Password:   "password123",
		FirstName:  "Worker",
		LastName:   "Default",
		InviteCode: "secret-for-worker-registration",
	})
	if err != nil {
		t.Fatalf("register: %v", err)
	}
	if resp.User.Language != "en" {
		t.Fatalf("expected language en, got %s", resp.User.Language)
	}
}

func TestUpdateProfileTimezone(t *testing.T) {
	user := &models.User{
		ID:        "user-1",
		Role:      models.UserRoleWorker,
		Status:    models.UserStatusActive,
		Email:     "tz@example.com",
		FirstName: "Tz",
		LastName:  "User",
		Language:  "en",
		Timezone:  "UTC",
	}
	repo := &mockUserRepo{byEmail: map[string]*models.User{user.Email: user}}
	svc := services.NewAuthService(config.Config{JWTSecret: "secret"}, repo)

	resp, err := svc.UpdateProfile(context.Background(), user.ID, dto.UpdateProfileRequest{
		Timezone: "Europe/Lisbon",
	})
	if err != nil {
		t.Fatalf("update profile: %v", err)
	}
	if resp.Timezone != "Europe/Lisbon" {
		t.Fatalf("expected Europe/Lisbon, got %s", resp.Timezone)
	}

	_, err = svc.UpdateProfile(context.Background(), user.ID, dto.UpdateProfileRequest{
		Timezone: "Not/AZone",
	})
	if err == nil {
		t.Fatal("expected invalid timezone error")
	}
}
