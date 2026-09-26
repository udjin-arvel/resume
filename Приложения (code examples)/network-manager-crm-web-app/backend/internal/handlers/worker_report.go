package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/radar-crm/backend/internal/middleware"
	"github.com/radar-crm/backend/internal/models/dto"
	"github.com/radar-crm/backend/internal/services"
)

type WorkerReportHandler struct {
	reports *services.WorkerReportService
}

func NewWorkerReportHandler(reports *services.WorkerReportService) *WorkerReportHandler {
	return &WorkerReportHandler{reports: reports}
}

func (h *WorkerReportHandler) RegisterRoutes(rg *gin.RouterGroup, jwt gin.HandlerFunc, active gin.HandlerFunc) {
	group := rg.Group("/reports/worker", jwt)
	{
		group.GET("", h.List)
		worker := middleware.RequireRole("worker", "supervisor")
		group.POST("", worker, active, h.Create)
		group.GET("/:id", h.Get)
		group.PUT("/:id", worker, active, h.Update)
		group.POST("/:id/approve", middleware.RequireRole("manager"), h.Approve)
		group.POST("/:id/reject", middleware.RequireRole("manager"), h.Reject)
		group.POST("/:id/revert-return", middleware.RequireRole("manager"), h.RevertReturn)
		group.POST("/:id/remind", middleware.RequireRole("manager"), h.Remind)
	}
}

func (h *WorkerReportHandler) List(c *gin.Context) {
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

func (h *WorkerReportHandler) Get(c *gin.Context) {
	resp, err := h.reports.GetByID(c.Request.Context(), c.Param("id"), middleware.Role(c), middleware.UserID(c))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *WorkerReportHandler) Create(c *gin.Context) {
	var req dto.CreateWorkerReportRequest
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

func (h *WorkerReportHandler) Update(c *gin.Context) {
	var req dto.UpdateWorkerReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.reports.Update(c.Request.Context(), c.Param("id"), req, middleware.UserID(c), middleware.Role(c))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *WorkerReportHandler) Approve(c *gin.Context) {
	resp, err := h.reports.Approve(c.Request.Context(), c.Param("id"))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *WorkerReportHandler) Reject(c *gin.Context) {
	var req dto.RejectWorkerReportRequest
	_ = c.ShouldBindJSON(&req)
	resp, err := h.reports.Reject(c.Request.Context(), c.Param("id"), req.Comment)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *WorkerReportHandler) RevertReturn(c *gin.Context) {
	resp, err := h.reports.RevertReturn(c.Request.Context(), c.Param("id"))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *WorkerReportHandler) Remind(c *gin.Context) {
	resp, err := h.reports.Remind(c.Request.Context(), c.Param("id"))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}
