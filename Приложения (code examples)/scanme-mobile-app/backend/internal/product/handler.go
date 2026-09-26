package product

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
	service *Service
}

func NewHandler(service *Service) Handler {
	return Handler{service: service}
}

func (h Handler) Routes() http.Handler {
	r := chi.NewRouter()
	r.Get("/{barcode}", h.getByBarcode)
	return r
}

func (h Handler) AdminRoutes() http.Handler {
	r := chi.NewRouter()
	r.Get("/", h.adminList)
	r.Post("/", h.adminCreate)
	r.Patch("/{barcode}", h.adminUpdate)
	r.Delete("/{barcode}", h.adminDelete)
	return r
}

func (h Handler) getByBarcode(w http.ResponseWriter, r *http.Request) {
	barcode := strings.TrimSpace(chi.URLParam(r, "barcode"))
	if barcode == "" || len(barcode) > 64 {
		response.ErrorJSON(w, http.StatusBadRequest, "INVALID_BARCODE", "barcode is required")
		return
	}

	product, err := h.service.GetByBarcode(r.Context(), barcode)
	if err != nil {
		if errors.Is(err, ErrProductNotFound) {
			response.ErrorJSON(w, http.StatusNotFound, "PRODUCT_NOT_FOUND", "product was not found")
			return
		}
		response.ErrorJSON(w, http.StatusBadGateway, "PRODUCT_FETCH_FAILED", "failed to fetch product")
		return
	}

	response.JSON(w, http.StatusOK, product)
}

func (h Handler) adminList(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	result, err := h.service.ListAdmin(r.Context(), ListOptions{
		Query: strings.TrimSpace(r.URL.Query().Get("q")),
		Limit: limit,
	})
	if err != nil {
		response.ErrorJSON(w, http.StatusInternalServerError, "ADMIN_PRODUCTS_LIST_FAILED", "failed to list products")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h Handler) adminCreate(w http.ResponseWriter, r *http.Request) {
	var input UpsertInput
	if err := response.DecodeJSON(r, &input); err != nil {
		response.ErrorJSON(w, http.StatusBadRequest, "INVALID_JSON", "invalid request body")
		return
	}

	product, err := h.service.CreateAdmin(r.Context(), input, authmw.UserID(r.Context()))
	if err != nil {
		writeAdminMutationError(w, err)
		return
	}
	response.JSON(w, http.StatusCreated, product)
}

func (h Handler) adminUpdate(w http.ResponseWriter, r *http.Request) {
	var input UpsertInput
	if err := response.DecodeJSON(r, &input); err != nil {
		response.ErrorJSON(w, http.StatusBadRequest, "INVALID_JSON", "invalid request body")
		return
	}

	product, err := h.service.UpdateAdmin(r.Context(), chi.URLParam(r, "barcode"), input, authmw.UserID(r.Context()))
	if err != nil {
		writeAdminMutationError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, product)
}

func (h Handler) adminDelete(w http.ResponseWriter, r *http.Request) {
	if err := h.service.DeleteAdmin(r.Context(), chi.URLParam(r, "barcode"), authmw.UserID(r.Context())); err != nil {
		writeAdminMutationError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func writeAdminMutationError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, ErrInvalidProduct):
		response.ErrorJSON(w, http.StatusBadRequest, "INVALID_PRODUCT", "product payload is invalid")
	case errors.Is(err, ErrProductNotFound):
		response.ErrorJSON(w, http.StatusNotFound, "PRODUCT_NOT_FOUND", "product was not found")
	default:
		response.ErrorJSON(w, http.StatusInternalServerError, "ADMIN_PRODUCT_MUTATION_FAILED", "failed to mutate product")
	}
}
