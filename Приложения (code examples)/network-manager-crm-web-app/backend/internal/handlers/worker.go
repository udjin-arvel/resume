package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/radar-crm/backend/internal/middleware"
	"github.com/radar-crm/backend/internal/models/dto"
	"github.com/radar-crm/backend/internal/services"
)

type WorkerHandler struct {
	workers *services.WorkerService
}

func NewWorkerHandler(workers *services.WorkerService) *WorkerHandler {
	return &WorkerHandler{workers: workers}
}

func (h *WorkerHandler) RegisterRoutes(rg *gin.RouterGroup, jwt gin.HandlerFunc) {
	manager := middleware.RequireRole("manager")
	workers := rg.Group("/workers", jwt, manager)
	{
		workers.GET("/resources", h.Resources)
		workers.GET("/available", h.Available)
		workers.GET("", h.List)
		workers.POST("", h.Create)
		workers.GET("/:id/projects", h.ListProjects)
		workers.GET("/:id", h.Get)
		workers.PUT("/:id", h.Update)
		workers.POST("/:id/approve", h.Approve)
		workers.POST("/:id/reject", h.Reject)
		workers.POST("/:id/return", h.ReturnApplication)
		workers.POST("/:id/block", h.Block)
		workers.POST("/:id/unblock", h.Unblock)
	}
}

func (h *WorkerHandler) List(c *gin.Context) {
	var q dto.WorkerListQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.workers.List(c.Request.Context(), q)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *WorkerHandler) Get(c *gin.Context) {
	resp, err := h.workers.GetByID(c.Request.Context(), c.Param("id"))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *WorkerHandler) ListProjects(c *gin.Context) {
	resp, err := h.workers.ListProjects(c.Request.Context(), c.Param("id"))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *WorkerHandler) Create(c *gin.Context) {
	var req dto.CreateWorkerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.workers.Create(c.Request.Context(), req)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusCreated, resp)
}

func (h *WorkerHandler) Update(c *gin.Context) {
	var req dto.UpdateWorkerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.workers.Update(c.Request.Context(), c.Param("id"), req)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *WorkerHandler) Approve(c *gin.Context) {
	resp, err := h.workers.Approve(c.Request.Context(), c.Param("id"))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *WorkerHandler) Reject(c *gin.Context) {
	var req dto.RejectWorkerApplicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.workers.Reject(c.Request.Context(), c.Param("id"), req)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *WorkerHandler) ReturnApplication(c *gin.Context) {
	var req dto.ReturnWorkerApplicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.workers.ReturnApplication(c.Request.Context(), c.Param("id"), req)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *WorkerHandler) Block(c *gin.Context) {
	var req dto.BlockWorkerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.workers.Block(c.Request.Context(), c.Param("id"), req)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *WorkerHandler) Unblock(c *gin.Context) {
	resp, err := h.workers.Unblock(c.Request.Context(), c.Param("id"))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *WorkerHandler) Resources(c *gin.Context) {
	resp, err := h.workers.Resources(c.Request.Context())
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *WorkerHandler) Available(c *gin.Context) {
	resp, err := h.workers.Available(c.Request.Context(), c.Query("projectId"))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}
