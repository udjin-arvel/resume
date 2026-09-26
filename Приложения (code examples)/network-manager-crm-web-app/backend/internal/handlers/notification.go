package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/radar-crm/backend/internal/middleware"
	"github.com/radar-crm/backend/internal/models/dto"
	"github.com/radar-crm/backend/internal/services"
)

type NotificationHandler struct {
	notifications *services.NotificationService
}

func NewNotificationHandler(notifications *services.NotificationService) *NotificationHandler {
	return &NotificationHandler{notifications: notifications}
}

func (h *NotificationHandler) RegisterRoutes(rg *gin.RouterGroup, jwt gin.HandlerFunc, active gin.HandlerFunc) {
	group := rg.Group("/notifications", jwt)
	{
		group.GET("", active, h.List)
		group.PUT("/:id/read", active, h.MarkRead)
		group.POST("/send", middleware.RequireRole("manager"), h.Send)
	}
}

func (h *NotificationHandler) List(c *gin.Context) {
	resp, err := h.notifications.ListForUser(c.Request.Context(), middleware.UserID(c))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *NotificationHandler) MarkRead(c *gin.Context) {
	resp, err := h.notifications.MarkRead(c.Request.Context(), c.Param("id"), middleware.UserID(c))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *NotificationHandler) Send(c *gin.Context) {
	var req dto.SendNotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.notifications.SendManual(c.Request.Context(), req)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}
