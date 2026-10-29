package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/radar-crm/backend/internal/apperrors"
	"github.com/radar-crm/backend/internal/models/dto"
)

func writeError(c *gin.Context, err error) {
	var appErr *apperrors.AppError
	if errors.As(err, &appErr) {
		switch {
		case errors.Is(appErr.Code, apperrors.ErrNotFound):
			c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: appErr.Error()})
		case errors.Is(appErr.Code, apperrors.ErrUnauthorized):
			c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: appErr.Error()})
		case errors.Is(appErr.Code, apperrors.ErrForbidden),
			errors.Is(appErr.Code, apperrors.ErrRegistrationDisabled):
			c.JSON(http.StatusForbidden, dto.ErrorResponse{Error: appErr.Error()})
		case errors.Is(appErr.Code, apperrors.ErrConflict):
			c.JSON(http.StatusConflict, dto.ErrorResponse{Error: appErr.Error()})
		case errors.Is(appErr.Code, apperrors.ErrValidation):
			c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: appErr.Error()})
		default:
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "internal server error"})
		}
		return
	}

	switch {
	case errors.Is(err, apperrors.ErrNotFound):
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: err.Error()})
	case errors.Is(err, apperrors.ErrUnauthorized):
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: err.Error()})
	default:
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "internal server error"})
	}
}
