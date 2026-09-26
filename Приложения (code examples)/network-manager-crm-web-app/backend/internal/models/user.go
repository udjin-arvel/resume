package models

import (
	"time"

	"github.com/radar-crm/backend/internal/models/dto"
)

type UserRole string

const (
	UserRoleManager    UserRole = "manager"
	UserRoleWorker     UserRole = "worker"
	UserRoleSupervisor UserRole = "supervisor"
)

type UserStatus string

const (
	UserStatusPending  UserStatus = "pending"
	UserStatusActive   UserStatus = "active"
	UserStatusBlocked  UserStatus = "blocked"
	UserStatusRejected UserStatus = "rejected"
)

type User struct {
	ID                           string
	TelegramID                   *int64
	Role                         UserRole
	Status                       UserStatus
	FirstName                    string
	LastName                     string
	Phone                        string
	Email                        string
	Country                      string
	PasswordHash                 string
	Position                     string
	Specialization               string
	HourlyRate                   string
	Language                     string
	Timezone                     string
	InternalComment              string
	TelegramUsername             string
	BlockReason                  string
	BlockedAt                    *time.Time
	BlockProjectID               *string
	ApplicationCorrectionsNeeded bool
	ApplicationFeedback          dto.ApplicationFeedback
	CreatedAt                    time.Time
	UpdatedAt                    time.Time
	DeletedAt                    *time.Time
}

func (u *User) ToResponse() dto.UserResponse {
	resp := dto.UserResponse{
		ID:               u.ID,
		TelegramID:       u.TelegramID,
		Role:             string(u.Role),
		Status:           string(u.Status),
		FirstName:        u.FirstName,
		LastName:         u.LastName,
		Phone:            u.Phone,
		Email:            u.Email,
		Country:          u.Country,
		Position:         u.Position,
		Specialization:   u.Specialization,
		HourlyRate:       u.HourlyRate,
		Language:         u.Language,
		Timezone:         u.Timezone,
		CreatedAt:        u.CreatedAt.Format("2006-01-02"),
		TelegramUsername: u.TelegramUsername,
		BlockReason:      u.BlockReason,
	}
	if u.BlockedAt != nil {
		resp.BlockedAt = u.BlockedAt.UTC().Format(time.RFC3339)
	}
	if u.BlockProjectID != nil {
		resp.BlockProjectID = *u.BlockProjectID
	}
	resp.ApplicationCorrectionsNeeded = u.ApplicationCorrectionsNeeded
	resp.ApplicationFeedback = applicationFeedbackPtr(u.ApplicationFeedback)
	return resp
}

func applicationFeedbackPtr(fb dto.ApplicationFeedback) *dto.ApplicationFeedback {
	if fb.Action == "" && len(fb.Reasons) == 0 && fb.Comment == "" {
		return nil
	}
	cp := fb
	return &cp
}

func (u *User) ToWorkerResponse() dto.WorkerResponse {
	resp := dto.WorkerResponse{
		ID:               u.ID,
		FirstName:        u.FirstName,
		LastName:         u.LastName,
		Phone:            u.Phone,
		Email:            u.Email,
		Country:          u.Country,
		Position:         u.Position,
		Specialization:   u.Specialization,
		HourlyRate:       u.HourlyRate,
		Status:           string(u.Status),
		Role:             string(u.Role),
		Language:         u.Language,
		Timezone:         u.Timezone,
		CreatedAt:        u.CreatedAt.Format("2006-01-02"),
		InternalComment:  u.InternalComment,
		TelegramUsername: u.TelegramUsername,
		BlockReason:      u.BlockReason,
	}
	if u.BlockedAt != nil {
		resp.BlockedAt = u.BlockedAt.UTC().Format(time.RFC3339)
	}
	if u.BlockProjectID != nil {
		resp.BlockProjectID = *u.BlockProjectID
	}
	resp.ApplicationCorrectionsNeeded = u.ApplicationCorrectionsNeeded
	resp.ApplicationFeedback = applicationFeedbackPtr(u.ApplicationFeedback)
	return resp
}

func (u *User) CanLogin() bool {
	return u.DeletedAt == nil
}
