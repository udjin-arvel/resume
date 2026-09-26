package auth

import (
	"errors"
	"net/http"
	"strings"

	"scanme/backend/internal/httpserver/response"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) Handler {
	return Handler{service: service}
}

func (h Handler) Routes() http.Handler {
	r := chi.NewRouter()
	r.Post("/device", h.device)
	r.Post("/refresh", h.refresh)
	return r
}

type deviceRequest struct {
	DeviceID string `json:"deviceId"`
}

type refreshRequest struct {
	RefreshToken string `json:"refreshToken"`
}

func (h Handler) device(w http.ResponseWriter, r *http.Request) {
	var req deviceRequest
	if err := response.DecodeJSON(r, &req); err != nil {
		response.ErrorJSON(w, http.StatusBadRequest, "INVALID_JSON", "invalid request body")
		return
	}

	req.DeviceID = strings.TrimSpace(req.DeviceID)
	if req.DeviceID == "" || len(req.DeviceID) > 200 {
		response.ErrorJSON(w, http.StatusBadRequest, "INVALID_DEVICE_ID", "deviceId is required")
		return
	}

	tokens, err := h.service.AuthenticateDevice(r.Context(), req.DeviceID)
	if err != nil {
		response.ErrorJSON(w, http.StatusInternalServerError, "AUTH_FAILED", "failed to authenticate device")
		return
	}

	response.JSON(w, http.StatusOK, tokens)
}

func (h Handler) refresh(w http.ResponseWriter, r *http.Request) {
	var req refreshRequest
	if err := response.DecodeJSON(r, &req); err != nil {
		response.ErrorJSON(w, http.StatusBadRequest, "INVALID_JSON", "invalid request body")
		return
	}

	req.RefreshToken = strings.TrimSpace(req.RefreshToken)
	if req.RefreshToken == "" {
		response.ErrorJSON(w, http.StatusBadRequest, "INVALID_REFRESH_TOKEN", "refreshToken is required")
		return
	}

	tokens, err := h.service.Refresh(r.Context(), req.RefreshToken)
	if err != nil {
		if errors.Is(err, ErrInvalidRefreshToken) {
			response.ErrorJSON(w, http.StatusUnauthorized, "INVALID_REFRESH_TOKEN", "refresh token is invalid")
			return
		}
		response.ErrorJSON(w, http.StatusInternalServerError, "REFRESH_FAILED", "failed to refresh token")
		return
	}

	response.JSON(w, http.StatusOK, tokens)
}
