package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/radar-crm/backend/internal/middleware"
	"github.com/radar-crm/backend/internal/models/dto"
	"github.com/radar-crm/backend/internal/services"
)

type SupervisorReportHandler struct {
	reports *services.SupervisorReportService
}

func NewSupervisorReportHandler(reports *services.SupervisorReportService) *SupervisorReportHandler {
	return &SupervisorReportHandler{reports: reports}
}

func (h *SupervisorReportHandler) RegisterRoutes(rg *gin.RouterGroup, jwt gin.HandlerFunc, active gin.HandlerFunc) {
	group := rg.Group("/reports/supervisor", jwt)
	{
		group.GET("", h.List)
		worker := middleware.RequireRole("worker", "supervisor")
		group.POST("", worker, active, h.Create)
		group.GET("/:id", h.Get)
		group.PATCH("/:id", worker, active, h.Patch)
		group.POST("/:id/transcribe", worker, active, h.Transcribe)
		group.POST("/:id/approve", middleware.RequireRole("manager"), h.Approve)
		group.POST("/:id/attention", middleware.RequireRole("manager"), h.Attention)
		group.POST("/:id/comment", middleware.RequireRole("manager"), h.Comment)
	}
}

func (h *SupervisorReportHandler) List(c *gin.Context) {
	var q dto.ReportListQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.reports.List(c.Request.Context(), q, middleware.Role(c), middleware.UserID(c))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *SupervisorReportHandler) Get(c *gin.Context) {
	resp, err := h.reports.GetByID(c.Request.Context(), c.Param("id"), middleware.Role(c), middleware.UserID(c))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *SupervisorReportHandler) Patch(c *gin.Context) {
	var req dto.PatchSupervisorReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.reports.Patch(c.Request.Context(), c.Param("id"), req, middleware.Role(c), middleware.UserID(c))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *SupervisorReportHandler) Create(c *gin.Context) {
	var req dto.CreateSupervisorReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.reports.Create(c.Request.Context(), req, middleware.UserID(c), middleware.Role(c))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusCreated, resp)
}

func (h *SupervisorReportHandler) Transcribe(c *gin.Context) {
	var req dto.TranscribeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.reports.Transcribe(c.Request.Context(), c.Param("id"), req, middleware.Role(c), middleware.UserID(c))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *SupervisorReportHandler) Approve(c *gin.Context) {
	resp, err := h.reports.Approve(c.Request.Context(), c.Param("id"))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *SupervisorReportHandler) Attention(c *gin.Context) {
	resp, err := h.reports.Attention(c.Request.Context(), c.Param("id"))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *SupervisorReportHandler) Comment(c *gin.Context) {
	var req dto.ManagerCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.reports.Comment(c.Request.Context(), c.Param("id"), req)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}
