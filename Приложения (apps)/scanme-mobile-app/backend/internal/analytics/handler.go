package analytics

import (
	"encoding/json"
	"errors"
	"net/http"

	authmw "scanme/backend/internal/httpserver/middleware"
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
	r.Post("/", h.ingest)
	return r
}

func (h Handler) ingest(w http.ResponseWriter, r *http.Request) {
	var req BatchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ErrorJSON(w, http.StatusBadRequest, "INVALID_JSON", "request body is invalid")
		return
	}

	accepted, duplicate, err := h.service.Ingest(
		r.Context(),
		authmw.UserID(r.Context()),
		r.Header.Get("Idempotency-Key"),
		req,
	)
	if err != nil {
		if errors.Is(err, ErrBatchTooLarge) {
			response.ErrorJSON(w, http.StatusBadRequest, "EVENT_BATCH_TOO_LARGE", "batch exceeds 100 events")
			return
		}
		response.ErrorJSON(w, http.StatusInternalServerError, "EVENT_INGEST_FAILED", "failed to persist events")
		return
	}

	response.JSON(w, http.StatusOK, map[string]any{
		"accepted":   accepted,
		"idempotent": duplicate,
	})
}
