package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/radar-crm/backend/internal/middleware"
	"github.com/radar-crm/backend/internal/models/dto"
	"github.com/radar-crm/backend/internal/services"
)

type ClientHandler struct {
	clients *services.ClientService
}

func NewClientHandler(clients *services.ClientService) *ClientHandler {
	return &ClientHandler{clients: clients}
}

func (h *ClientHandler) RegisterRoutes(rg *gin.RouterGroup, jwt gin.HandlerFunc) {
	clients := rg.Group("/clients", jwt, middleware.RequireRole("manager"))
	{
		clients.GET("", h.List)
		clients.POST("", h.Create)
		clients.GET("/:id", h.Get)
		clients.PUT("/:id", h.Update)
		clients.DELETE("/:id", h.Delete)
		clients.GET("/:id/projects", h.ListProjects)
		clients.GET("/:id/documents", h.ListDocuments)
		clients.GET("/:id/finance", h.Finance)
	}
}

func (h *ClientHandler) List(c *gin.Context) {
	var q dto.ClientListQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.clients.List(c.Request.Context(), q)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *ClientHandler) Get(c *gin.Context) {
	resp, err := h.clients.GetByID(c.Request.Context(), c.Param("id"))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *ClientHandler) Create(c *gin.Context) {
	var req dto.UpdateClientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	if req.Name == "" {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: "name is required"})
		return
	}
	resp, err := h.clients.Create(c.Request.Context(), req)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusCreated, resp)
}

func (h *ClientHandler) Update(c *gin.Context) {
	var req dto.UpdateClientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.clients.Update(c.Request.Context(), c.Param("id"), req)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *ClientHandler) Delete(c *gin.Context) {
	if err := h.clients.Delete(c.Request.Context(), c.Param("id")); err != nil {
		writeError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *ClientHandler) ListProjects(c *gin.Context) {
	resp, err := h.clients.ListProjects(c.Request.Context(), c.Param("id"))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *ClientHandler) ListDocuments(c *gin.Context) {
	resp, err := h.clients.ListDocuments(c.Request.Context(), c.Param("id"))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *ClientHandler) Finance(c *gin.Context) {
	resp, err := h.clients.Finance(c.Request.Context(), c.Param("id"))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}
