package scan

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	authmw "scanme/backend/internal/httpserver/middleware"
	"scanme/backend/internal/httpserver/response"
	platformmetrics "scanme/backend/internal/platform/metrics"

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
	r.Post("/", h.create)
	r.Get("/", h.list)
	r.Delete("/{id}", h.delete)
	return r
}

func (h Handler) create(w http.ResponseWriter, r *http.Request) {
	var req CreateScanRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ErrorJSON(w, http.StatusBadRequest, "INVALID_JSON", "request body is invalid")
		return
	}

	item, err := h.service.Create(
		r.Context(),
		authmw.UserID(r.Context()),
		req,
		r.Header.Get("Idempotency-Key"),
	)
	if err != nil {
		if errors.Is(err, ErrInvalidBarcode) {
			response.ErrorJSON(w, http.StatusBadRequest, "INVALID_BARCODE", "barcode is required")
			return
		}
		response.ErrorJSON(w, http.StatusInternalServerError, "SCAN_CREATE_FAILED", "failed to save scan")
		return
	}

	platformmetrics.ScansRecorded.Inc()

	response.JSON(w, http.StatusCreated, item)
}

func (h Handler) list(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 || limit > 100 {
		limit = 30
	}
	var cursor *time.Time
	if rawCursor := r.URL.Query().Get("cursor"); rawCursor != "" {
		parsed, err := time.Parse(time.RFC3339Nano, rawCursor)
		if err != nil {
			response.ErrorJSON(w, http.StatusBadRequest, "INVALID_CURSOR", "cursor must be RFC3339 timestamp")
			return
		}
		cursor = &parsed
	}

	items, err := h.service.List(r.Context(), authmw.UserID(r.Context()), limit+1, cursor)
	if err != nil {
		response.ErrorJSON(w, http.StatusInternalServerError, "SCANS_FETCH_FAILED", "failed to fetch scans")
		return
	}

	nextCursor := ""
	if len(items) > limit {
		nextCursor = items[limit-1].ScannedAt.Format(time.RFC3339Nano)
		items = items[:limit]
	}

	response.JSON(w, http.StatusOK, ListResponse{
		Items:      items,
		NextCursor: nextCursor,
	})
}

func (h Handler) delete(w http.ResponseWriter, r *http.Request) {
	if err := h.service.Delete(r.Context(), authmw.UserID(r.Context()), chi.URLParam(r, "id")); err != nil {
		response.ErrorJSON(w, http.StatusInternalServerError, "SCAN_DELETE_FAILED", "failed to delete scan")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
