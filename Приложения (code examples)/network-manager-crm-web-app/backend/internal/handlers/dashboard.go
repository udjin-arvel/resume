package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/radar-crm/backend/internal/middleware"
	"github.com/radar-crm/backend/internal/models/dto"
	"github.com/radar-crm/backend/internal/services"
)

type DashboardHandler struct {
	dashboard *services.DashboardService
}

func NewDashboardHandler(dashboard *services.DashboardService) *DashboardHandler {
	return &DashboardHandler{dashboard: dashboard}
}

func (h *DashboardHandler) RegisterRoutes(rg *gin.RouterGroup, jwt gin.HandlerFunc) {
	group := rg.Group("/dashboard", jwt, middleware.RequireRole("manager"))
	{
		group.GET("/urgent", h.Urgent)
		group.GET("/problem-projects", h.ProblemProjects)
		group.GET("/activity", h.Activity)
	}
}

func (h *DashboardHandler) Urgent(c *gin.Context) {
	resp, err := h.dashboard.Urgent(c.Request.Context(), middleware.GetLocale(c))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *DashboardHandler) ProblemProjects(c *gin.Context) {
	resp, err := h.dashboard.ProblemProjects(c.Request.Context())
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *DashboardHandler) Activity(c *gin.Context) {
	var q dto.PaginationQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.dashboard.Activity(c.Request.Context(), q.Page, q.PageSize)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}
