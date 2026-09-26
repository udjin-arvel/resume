package apperrors

import "errors"

var (
	ErrNotFound            = errors.New("not found")
	ErrUnauthorized        = errors.New("unauthorized")
	ErrForbidden           = errors.New("forbidden")
	ErrConflict            = errors.New("conflict")
	ErrValidation          = errors.New("validation")
	ErrRegistrationDisabled = errors.New("registration disabled")
)

type AppError struct {
	Code    error
	Message string
}

func (e *AppError) Error() string {
	if e.Message != "" {
		return e.Message
	}
	return e.Code.Error()
}

func New(code error, message string) *AppError {
	return &AppError{Code: code, Message: message}
}
