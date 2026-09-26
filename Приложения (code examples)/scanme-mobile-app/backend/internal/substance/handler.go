package substance

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

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

func (h Handler) PublicRoutes() http.Handler {
	r := chi.NewRouter()
	r.Get("/", h.list)
	r.Get("/search", h.search)
	return r
}

func (h Handler) AdminRoutes() http.Handler {
	r := chi.NewRouter()
	r.Get("/", h.adminList)
	r.Post("/", h.create)
	r.Post("/import", h.importItems)
	r.Get("/export", h.export)
	r.Get("/{id}/audit-history", h.auditHistory)
	r.Post("/{id}/rollback", h.rollback)
	r.Patch("/{id}", h.update)
	r.Delete("/{id}", h.delete)
	return r
}

func (h Handler) list(w http.ResponseWriter, r *http.Request) {
	opts := listOptionsFromRequest(r, false)
	result, err := h.service.List(r.Context(), opts)
	if err != nil {
		response.ErrorJSON(w, http.StatusInternalServerError, "SUBSTANCES_LIST_FAILED", "failed to list substances")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h Handler) search(w http.ResponseWriter, r *http.Request) {
	opts := listOptionsFromRequest(r, false)
	opts.Query = strings.TrimSpace(r.URL.Query().Get("q"))
	result, err := h.service.List(r.Context(), opts)
	if err != nil {
		response.ErrorJSON(w, http.StatusInternalServerError, "SUBSTANCES_SEARCH_FAILED", "failed to search substances")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h Handler) adminList(w http.ResponseWriter, r *http.Request) {
	opts := listOptionsFromRequest(r, true)
	result, err := h.service.List(r.Context(), opts)
	if err != nil {
		response.ErrorJSON(w, http.StatusInternalServerError, "ADMIN_SUBSTANCES_LIST_FAILED", "failed to list substances")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h Handler) export(w http.ResponseWriter, r *http.Request) {
	opts := listOptionsFromRequest(r, true)
	opts.Limit = 200
	result, err := h.service.List(r.Context(), opts)
	if err != nil {
		response.ErrorJSON(w, http.StatusInternalServerError, "ADMIN_SUBSTANCES_EXPORT_FAILED", "failed to export substances")
		return
	}
	response.JSON(w, http.StatusOK, result.Items)
}

func (h Handler) auditHistory(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	items, err := h.service.ListAuditHistory(r.Context(), chi.URLParam(r, "id"), limit)
	if err != nil {
		response.ErrorJSON(w, http.StatusInternalServerError, "SUBSTANCE_AUDIT_HISTORY_FAILED", "failed to load audit history")
		return
	}
	response.JSON(w, http.StatusOK, map[string]any{"items": items})
}

type rollbackRequest struct {
	AuditID string `json:"auditId"`
}

func (h Handler) rollback(w http.ResponseWriter, r *http.Request) {
	var body rollbackRequest
	if err := response.DecodeJSON(r, &body); err != nil {
		response.ErrorJSON(w, http.StatusBadRequest, "INVALID_JSON", "invalid request body")
		return
	}
	item, err := h.service.RollbackToAudit(r.Context(), chi.URLParam(r, "id"), body.AuditID, authmw.UserID(r.Context()))
	if err != nil {
		writeMutationError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, item)
}

func (h Handler) create(w http.ResponseWriter, r *http.Request) {
	var input UpsertInput
	if err := response.DecodeJSON(r, &input); err != nil {
		response.ErrorJSON(w, http.StatusBadRequest, "INVALID_JSON", "invalid request body")
		return
	}

	item, err := h.service.Create(r.Context(), input, authmw.UserID(r.Context()))
	if err != nil {
		writeMutationError(w, err)
		return
	}
	response.JSON(w, http.StatusCreated, item)
}

func (h Handler) update(w http.ResponseWriter, r *http.Request) {
	var input UpsertInput
	if err := response.DecodeJSON(r, &input); err != nil {
		response.ErrorJSON(w, http.StatusBadRequest, "INVALID_JSON", "invalid request body")
		return
	}

	item, err := h.service.Update(r.Context(), chi.URLParam(r, "id"), input, authmw.UserID(r.Context()))
	if err != nil {
		writeMutationError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, item)
}

func (h Handler) delete(w http.ResponseWriter, r *http.Request) {
	if err := h.service.Delete(r.Context(), chi.URLParam(r, "id"), authmw.UserID(r.Context())); err != nil {
		writeMutationError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h Handler) importItems(w http.ResponseWriter, r *http.Request) {
	var inputs []UpsertInput
	if err := response.DecodeJSON(r, &inputs); err != nil {
		response.ErrorJSON(w, http.StatusBadRequest, "INVALID_JSON", "invalid request body")
		return
	}

	items, err := h.service.Import(r.Context(), inputs, authmw.UserID(r.Context()))
	if err != nil {
		writeMutationError(w, err)
		return
	}
	response.JSON(w, http.StatusCreated, items)
}

func listOptionsFromRequest(r *http.Request, admin bool) ListOptions {
	query := r.URL.Query()
	since, _ := strconv.ParseInt(query.Get("since"), 10, 64)
	limit, _ := strconv.Atoi(query.Get("limit"))

	var isActive *bool
	if raw := strings.TrimSpace(query.Get("isActive")); raw != "" {
		parsed, err := strconv.ParseBool(raw)
		if err == nil {
			isActive = &parsed
		}
	} else if !admin {
		active := true
		isActive = &active
	}

	return ListOptions{
		Since:       since,
		Limit:       limit,
		Query:       strings.TrimSpace(query.Get("q")),
		Category:    strings.TrimSpace(query.Get("category")),
		DangerLevel: strings.TrimSpace(query.Get("dangerLevel")),
		IsActive:    isActive,
		IncludeAll:  admin,
	}
}

func writeMutationError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, ErrInvalidSubstance):
		response.ErrorJSON(w, http.StatusBadRequest, "INVALID_SUBSTANCE", "substance payload is invalid")
	case errors.Is(err, ErrNotFound):
		response.ErrorJSON(w, http.StatusNotFound, "SUBSTANCE_NOT_FOUND", "substance was not found")
	default:
		response.ErrorJSON(w, http.StatusInternalServerError, "SUBSTANCE_MUTATION_FAILED", "failed to mutate substance")
	}
}
