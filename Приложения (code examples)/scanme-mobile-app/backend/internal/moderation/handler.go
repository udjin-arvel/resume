package moderation

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"

	authmw "scanme/backend/internal/httpserver/middleware"
	"scanme/backend/internal/httpserver/response"
	"scanme/backend/internal/substance"

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
	r.Get("/queue", h.listQueue)
	r.Post("/{id}/approve", h.approve)
	r.Post("/{id}/reject", h.reject)
	return r
}

func (h Handler) listQueue(w http.ResponseWriter, r *http.Request) {
	status := strings.TrimSpace(r.URL.Query().Get("status"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	suggestions := strings.EqualFold(r.URL.Query().Get("suggestions"), "true") || r.URL.Query().Get("suggestions") == "1"

	out, err := h.service.ListQueue(r.Context(), status, limit, suggestions)
	if err != nil {
		response.ErrorJSON(w, http.StatusInternalServerError, "MODERATION_QUEUE_FAILED", "failed to load moderation queue")
		return
	}
	response.JSON(w, http.StatusOK, out)
}

func (h Handler) approve(w http.ResponseWriter, r *http.Request) {
	data, err := io.ReadAll(r.Body)
	if err != nil {
		response.ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "failed to read body")
		return
	}

	var overrides ApproveOverrides
	if len(bytes.TrimSpace(data)) > 0 {
		if err := json.Unmarshal(data, &overrides); err != nil {
			response.ErrorJSON(w, http.StatusBadRequest, "INVALID_JSON", "invalid request body")
			return
		}
	}

	item, err := h.service.Approve(r.Context(), chi.URLParam(r, "id"), authmw.UserID(r.Context()), overrides)
	if err != nil {
		writeModerationError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, item)
}

type rejectBody struct {
	Reason string `json:"reason"`
}

func (h Handler) reject(w http.ResponseWriter, r *http.Request) {
	var body rejectBody
	if err := response.DecodeJSON(r, &body); err != nil {
		response.ErrorJSON(w, http.StatusBadRequest, "INVALID_JSON", "invalid request body")
		return
	}

	if err := h.service.Reject(r.Context(), chi.URLParam(r, "id"), authmw.UserID(r.Context()), body.Reason); err != nil {
		writeModerationError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func writeModerationError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, ErrNotFound):
		response.ErrorJSON(w, http.StatusNotFound, "MODERATION_ITEM_NOT_FOUND", "queue item was not found")
	case errors.Is(err, ErrNotPending):
		response.ErrorJSON(w, http.StatusConflict, "MODERATION_ITEM_NOT_PENDING", "queue item is no longer pending")
	case errors.Is(err, ErrInvalidInput):
		response.ErrorJSON(w, http.StatusBadRequest, "MODERATION_INVALID_INPUT", "candidate payload is invalid")
	case errors.Is(err, substance.ErrInvalidSubstance):
		response.ErrorJSON(w, http.StatusBadRequest, "INVALID_SUBSTANCE", "substance payload is invalid")
	case errors.Is(err, substance.ErrNotFound):
		response.ErrorJSON(w, http.StatusNotFound, "SUBSTANCE_NOT_FOUND", "substance was not found")
	default:
		response.ErrorJSON(w, http.StatusInternalServerError, "MODERATION_ACTION_FAILED", "moderation action failed")
	}
}
