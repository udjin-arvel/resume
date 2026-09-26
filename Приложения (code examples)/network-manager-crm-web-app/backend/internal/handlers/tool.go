package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/radar-crm/backend/internal/middleware"
	"github.com/radar-crm/backend/internal/models/dto"
	"github.com/radar-crm/backend/internal/services"
)

type ToolHandler struct {
	tools *services.ToolService
}

func NewToolHandler(tools *services.ToolService) *ToolHandler {
	return &ToolHandler{tools: tools}
}

func (h *ToolHandler) RegisterRoutes(rg *gin.RouterGroup, jwt gin.HandlerFunc) {
	group := rg.Group("/tools", jwt, middleware.RequireRole("manager"))
	{
		group.GET("", h.List)
		group.POST("", h.Create)
		group.GET("/:id", h.Get)
		group.PUT("/:id", h.Update)
		group.POST("/:id/assign", h.Assign)
		group.POST("/:id/return", h.Return)
		group.POST("/:id/calibrate", h.Calibrate)
		group.POST("/:id/report-problem", h.ReportProblem)
		group.POST("/:id/resolve-problem", h.ResolveProblem)
	}
}

func (h *ToolHandler) List(c *gin.Context) {
	var q dto.ToolListQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.tools.List(c.Request.Context(), q)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *ToolHandler) Get(c *gin.Context) {
	resp, err := h.tools.GetByID(c.Request.Context(), c.Param("id"))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *ToolHandler) Create(c *gin.Context) {
	var req dto.CreateToolRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.tools.Create(c.Request.Context(), req)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusCreated, resp)
}

func (h *ToolHandler) Update(c *gin.Context) {
	var req dto.UpdateToolRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.tools.Update(c.Request.Context(), c.Param("id"), req)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *ToolHandler) Assign(c *gin.Context) {
	var req dto.AssignToolRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.tools.Assign(c.Request.Context(), c.Param("id"), req)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *ToolHandler) Return(c *gin.Context) {
	var req dto.ReturnToolRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.tools.Return(c.Request.Context(), c.Param("id"), req)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *ToolHandler) Calibrate(c *gin.Context) {
	var req dto.CalibrateToolRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.tools.Calibrate(c.Request.Context(), c.Param("id"), req, middleware.UserID(c))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *ToolHandler) ReportProblem(c *gin.Context) {
	var req dto.ReportToolProblemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	if err := h.tools.ReportProblem(c.Request.Context(), c.Param("id"), middleware.UserID(c), req); err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *ToolHandler) ResolveProblem(c *gin.Context) {
	resp, err := h.tools.ResolveProblem(c.Request.Context(), c.Param("id"), middleware.UserID(c))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}
