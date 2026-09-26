package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/radar-crm/backend/internal/middleware"
	"github.com/radar-crm/backend/internal/models"
	"github.com/radar-crm/backend/internal/models/dto"
	"github.com/radar-crm/backend/internal/services"
)

type FinanceHandler struct {
	finance *services.FinanceService
}

func NewFinanceHandler(finance *services.FinanceService) *FinanceHandler {
	return &FinanceHandler{finance: finance}
}

func (h *FinanceHandler) RegisterRoutes(rg *gin.RouterGroup, jwt gin.HandlerFunc, active gin.HandlerFunc) {
	worker := rg.Group("/finance", jwt, middleware.RequireRole(
		string(models.UserRoleWorker),
		string(models.UserRoleSupervisor),
	))
	{
		worker.GET("/mine", active, h.Mine)
	}

	group := rg.Group("/finance", jwt, middleware.RequireRole("manager"))
	{
		group.GET("/overview", h.Overview)
		group.GET("/projects", h.Projects)
		group.GET("/projects/:id", h.ProjectByID)
		group.GET("/workers", h.Workers)
		group.GET("/workers/:id", h.WorkerByID)
		group.GET("/categories", h.Categories)
	}
}

func (h *FinanceHandler) Mine(c *gin.Context) {
	userID := middleware.UserID(c)
	resp, err := h.finance.Mine(c.Request.Context(), userID)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *FinanceHandler) Overview(c *gin.Context) {
	var q dto.FinanceScopeQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.finance.Overview(c.Request.Context(), q)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *FinanceHandler) Projects(c *gin.Context) {
	var q dto.FinanceScopeQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.finance.Projects(c.Request.Context(), q)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *FinanceHandler) ProjectByID(c *gin.Context) {
	resp, err := h.finance.ProjectByID(c.Request.Context(), c.Param("id"))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *FinanceHandler) Workers(c *gin.Context) {
	var q dto.FinanceScopeQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.finance.Workers(c.Request.Context(), q)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *FinanceHandler) WorkerByID(c *gin.Context) {
	resp, err := h.finance.WorkerByID(c.Request.Context(), c.Param("id"))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *FinanceHandler) Categories(c *gin.Context) {
	var q dto.FinanceCategoryQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.finance.Categories(c.Request.Context(), q)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}
