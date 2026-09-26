package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/radar-crm/backend/internal/middleware"
	"github.com/radar-crm/backend/internal/models/dto"
	"github.com/radar-crm/backend/internal/services"
)

type EstimateHandler struct {
	estimates  *services.EstimateService
	templates  *services.EstimateTemplateService
	export     *services.EstimateExportService
}

func NewEstimateHandler(
	estimates *services.EstimateService,
	templates *services.EstimateTemplateService,
	export *services.EstimateExportService,
) *EstimateHandler {
	return &EstimateHandler{estimates: estimates, templates: templates, export: export}
}

func (h *EstimateHandler) RegisterRoutes(rg *gin.RouterGroup, jwt gin.HandlerFunc) {
	manager := middleware.RequireRole("manager")

	estimates := rg.Group("/estimates", jwt, manager)
	{
		estimates.GET("", h.List)
		estimates.POST("", h.Create)
		estimates.POST("/from-template", h.CreateFromTemplate)
		estimates.GET("/:id/export/pdf", h.ExportPDF)
		estimates.GET("/:id/export/excel", h.ExportExcel)
		estimates.GET("/:id", h.Get)
		estimates.PUT("/:id", h.Update)
		estimates.DELETE("/:id", h.Delete)
		estimates.POST("/:id/status", h.UpdateStatus)
	}

	templates := rg.Group("/estimate-templates", jwt, manager)
	{
		templates.GET("", h.ListTemplates)
		templates.POST("", h.CreateTemplate)
	}
}

func (h *EstimateHandler) List(c *gin.Context) {
	var q dto.EstimateListQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.estimates.List(c.Request.Context(), q)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *EstimateHandler) Get(c *gin.Context) {
	resp, err := h.estimates.GetByID(c.Request.Context(), c.Param("id"))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *EstimateHandler) Create(c *gin.Context) {
	var req dto.CreateEstimateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.estimates.Create(c.Request.Context(), req, middleware.UserID(c))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusCreated, resp)
}

func (h *EstimateHandler) Update(c *gin.Context) {
	var req dto.UpdateEstimateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.estimates.Update(c.Request.Context(), c.Param("id"), req)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *EstimateHandler) Delete(c *gin.Context) {
	if err := h.estimates.Delete(c.Request.Context(), c.Param("id")); err != nil {
		writeError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *EstimateHandler) UpdateStatus(c *gin.Context) {
	var req dto.EstimateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.estimates.UpdateStatus(c.Request.Context(), c.Param("id"), req)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *EstimateHandler) ExportPDF(c *gin.Context) {
	data, filename, err := h.export.ExportPDF(c.Request.Context(), c.Param("id"))
	if err != nil {
		writeError(c, err)
		return
	}
	c.Header("Content-Disposition", "attachment; filename=\""+filename+"\"")
	c.Data(http.StatusOK, "application/pdf", data)
}

func (h *EstimateHandler) ExportExcel(c *gin.Context) {
	data, filename, err := h.export.ExportExcel(c.Request.Context(), c.Param("id"))
	if err != nil {
		writeError(c, err)
		return
	}
	c.Header("Content-Disposition", "attachment; filename=\""+filename+"\"")
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", data)
}

func (h *EstimateHandler) ListTemplates(c *gin.Context) {
	resp, err := h.templates.List(c.Request.Context())
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *EstimateHandler) CreateTemplate(c *gin.Context) {
	var req dto.CreateEstimateTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.templates.Create(c.Request.Context(), req, middleware.UserID(c))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusCreated, resp)
}

func (h *EstimateHandler) CreateFromTemplate(c *gin.Context) {
	var req dto.CreateFromTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.templates.CreateEstimateFromTemplate(c.Request.Context(), req, middleware.UserID(c))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusCreated, resp)
}
