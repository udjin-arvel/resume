package reporting

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"scanme/backend/internal/httpserver/response"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	repo Repository
}

func NewHandler(repo Repository) Handler {
	return Handler{repo: repo}
}

func (h Handler) StatsRoutes() http.Handler {
	r := chi.NewRouter()
	r.Get("/overview", h.overview)
	return r
}

func (h Handler) UsersRoutes() http.Handler {
	r := chi.NewRouter()
	r.Get("/", h.listUsers)
	r.Patch("/{id}", h.patchUser)
	return r
}

func (h Handler) AuditRoutes() http.Handler {
	r := chi.NewRouter()
	r.Get("/", h.listAudit)
	return r
}

func (h Handler) overview(w http.ResponseWriter, r *http.Request) {
	data, err := h.repo.Overview(r.Context())
	if err != nil {
		response.ErrorJSON(w, http.StatusInternalServerError, "STATS_OVERVIEW_FAILED", "failed to load overview")
		return
	}
	response.JSON(w, http.StatusOK, data)
}

func (h Handler) listUsers(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	filter := strings.TrimSpace(r.URL.Query().Get("premium"))

	cursorCreatedAt, cursorID, err := DecodeUserCursor(r.URL.Query().Get("cursor"))
	if err != nil {
		response.ErrorJSON(w, http.StatusBadRequest, "INVALID_CURSOR", "cursor is invalid")
		return
	}

	result, err := h.repo.ListUsers(r.Context(), filter, limit, cursorCreatedAt, cursorID)
	if err != nil {
		response.ErrorJSON(w, http.StatusInternalServerError, "USERS_LIST_FAILED", "failed to list users")
		return
	}

	response.JSON(w, http.StatusOK, result)
}

type patchUserRequest struct {
	IsPremiumUntil *time.Time `json:"isPremiumUntil"`
}

func (h Handler) patchUser(w http.ResponseWriter, r *http.Request) {
	var req patchUserRequest
	if err := response.DecodeJSON(r, &req); err != nil {
		response.ErrorJSON(w, http.StatusBadRequest, "INVALID_JSON", "invalid request body")
		return
	}

	row, err := h.repo.UpdateUserPremium(r.Context(), chi.URLParam(r, "id"), req.IsPremiumUntil)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			response.ErrorJSON(w, http.StatusNotFound, "USER_NOT_FOUND", "user was not found")
			return
		}
		response.ErrorJSON(w, http.StatusBadRequest, "USER_UPDATE_FAILED", "failed to update user")
		return
	}

	response.JSON(w, http.StatusOK, row)
}

func (h Handler) listAudit(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	adminUserID := strings.TrimSpace(r.URL.Query().Get("adminUserId"))
	entityType := strings.TrimSpace(r.URL.Query().Get("entityType"))
	entityID := strings.TrimSpace(r.URL.Query().Get("entityId"))

	var from *time.Time
	if raw := strings.TrimSpace(r.URL.Query().Get("from")); raw != "" {
		parsed, err := time.Parse(time.RFC3339, raw)
		if err != nil {
			response.ErrorJSON(w, http.StatusBadRequest, "INVALID_FROM", "from must be RFC3339 timestamp")
			return
		}
		from = &parsed
	}

	var to *time.Time
	if raw := strings.TrimSpace(r.URL.Query().Get("to")); raw != "" {
		parsed, err := time.Parse(time.RFC3339, raw)
		if err != nil {
			response.ErrorJSON(w, http.StatusBadRequest, "INVALID_TO", "to must be RFC3339 timestamp")
			return
		}
		to = &parsed
	}

	cursorCreatedAt, cursorID, err := DecodeUserCursor(r.URL.Query().Get("cursor"))
	if err != nil {
		response.ErrorJSON(w, http.StatusBadRequest, "INVALID_CURSOR", "cursor is invalid")
		return
	}

	result, err := h.repo.ListAudit(r.Context(), adminUserID, entityType, entityID, from, to, limit, cursorCreatedAt, cursorID)
	if err != nil {
		response.ErrorJSON(w, http.StatusInternalServerError, "AUDIT_LIST_FAILED", "failed to list audit log")
		return
	}

	response.JSON(w, http.StatusOK, result)
}
