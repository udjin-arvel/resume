package adminauth

import (
	"errors"
	"net/http"

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
	r.Post("/login", h.login)
	return r
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h Handler) login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := response.DecodeJSON(r, &req); err != nil {
		response.ErrorJSON(w, http.StatusBadRequest, "INVALID_JSON", "invalid request body")
		return
	}

	result, err := h.service.Login(r.Context(), req.Email, req.Password)
	if err != nil {
		if errors.Is(err, ErrInvalidCredentials) {
			response.ErrorJSON(w, http.StatusUnauthorized, "INVALID_CREDENTIALS", "invalid email or password")
			return
		}
		response.ErrorJSON(w, http.StatusInternalServerError, "ADMIN_LOGIN_FAILED", "failed to login")
		return
	}

	response.JSON(w, http.StatusOK, result)
}
