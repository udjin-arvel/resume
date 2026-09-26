package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/radar-crm/backend/internal/middleware"
	"github.com/radar-crm/backend/internal/models"
	"github.com/radar-crm/backend/internal/models/dto"
	"github.com/radar-crm/backend/internal/services"
)

type ProjectHandler struct {
	projects      *services.ProjectService
	docs          *services.DocumentService
	projectIssues *services.ProjectIssueService
}

func NewProjectHandler(projects *services.ProjectService, docs *services.DocumentService, projectIssues *services.ProjectIssueService) *ProjectHandler {
	return &ProjectHandler{projects: projects, docs: docs, projectIssues: projectIssues}
}

func (h *ProjectHandler) RegisterRoutes(rg *gin.RouterGroup, jwt gin.HandlerFunc, active gin.HandlerFunc) {
	projects := rg.Group("/projects", jwt)
	{
		worker := middleware.RequireRole(string(models.UserRoleWorker), string(models.UserRoleSupervisor))
		projectIssues := middleware.RequireRole(
			string(models.UserRoleWorker),
			string(models.UserRoleSupervisor),
			string(models.UserRoleManager),
		)
		projects.GET("/mine", worker, active, h.ListMine)
		projects.POST("/:id/confirm", worker, active, h.Confirm)
		projects.POST("/:id/decline", worker, active, h.Decline)
		projects.GET("/:id/crew", worker, active, h.GetCrew)
		projects.GET("/:id/issues", projectIssues, active, h.ListIssues)

		projects.GET("/:id", h.Get)

		manager := projects.Group("", middleware.RequireRole(string(models.UserRoleManager)))
		{
			manager.GET("", h.List)
			manager.POST("", h.Create)
			manager.POST("/from-estimate", h.CreateFromEstimate)
			manager.PUT("/:id", h.Update)
			manager.DELETE("/:id", h.Delete)
			manager.POST("/:id/workers", h.AssignWorker)
			manager.POST("/:id/workers/batch", h.AssignWorkersBatch)
			manager.POST("/:id/supervisor", h.SetSupervisor)
			manager.GET("/:id/supervisor-candidates", h.SupervisorCandidates)
			manager.DELETE("/:id/workers/:workerId", h.RemoveWorker)
			manager.POST("/:id/workers/:workerId/role", h.ChangeWorkerRole)
			manager.POST("/:id/invite", h.Invite)
			manager.POST("/:id/notifications", h.SendNotifications)
			manager.POST("/:id/documents", h.UploadDocument)
			manager.GET("/:id/worker-documents", h.ListWorkerDocuments)
			manager.GET("/:id/history", h.ListHistory)
			manager.PATCH("/:id/issues/:issueId/status", h.UpdateIssueStatus)
		}
	}
}

func (h *ProjectHandler) ListMine(c *gin.Context) {
	var q dto.MyProjectListQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.projects.ListMine(c.Request.Context(), middleware.UserID(c), q)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *ProjectHandler) Confirm(c *gin.Context) {
	if err := h.projects.ConfirmParticipation(c.Request.Context(), c.Param("id"), middleware.UserID(c)); err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "confirmed"})
}

func (h *ProjectHandler) Decline(c *gin.Context) {
	if err := h.projects.DeclineParticipation(c.Request.Context(), c.Param("id"), middleware.UserID(c)); err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "rejected"})
}

func (h *ProjectHandler) GetCrew(c *gin.Context) {
	resp, err := h.projects.GetCrew(c.Request.Context(), c.Param("id"), middleware.UserID(c))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *ProjectHandler) List(c *gin.Context) {
	var q dto.ProjectListQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.projects.List(c.Request.Context(), q)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *ProjectHandler) Get(c *gin.Context) {
	role := middleware.Role(c)
	userID := middleware.UserID(c)
	projectID := c.Param("id")

	if role == string(models.UserRoleWorker) || role == string(models.UserRoleSupervisor) {
		resp, err := h.projects.GetForWorker(c.Request.Context(), projectID, userID)
		if err != nil {
			writeError(c, err)
			return
		}
		c.JSON(http.StatusOK, resp)
		return
	}

	includeWorkers := c.Query("include") == "workers"
	resp, err := h.projects.GetByID(c.Request.Context(), projectID, includeWorkers)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *ProjectHandler) Create(c *gin.Context) {
	var req dto.CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.projects.Create(c.Request.Context(), middleware.UserID(c), req)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusCreated, resp)
}

func (h *ProjectHandler) CreateFromEstimate(c *gin.Context) {
	var req dto.CreateProjectFromEstimateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.projects.CreateFromEstimate(c.Request.Context(), middleware.UserID(c), req)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusCreated, resp)
}

func (h *ProjectHandler) Update(c *gin.Context) {
	var req dto.UpdateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.projects.Update(c.Request.Context(), middleware.UserID(c), c.Param("id"), req)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *ProjectHandler) Delete(c *gin.Context) {
	if err := h.projects.Delete(c.Request.Context(), c.Param("id")); err != nil {
		writeError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *ProjectHandler) AssignWorker(c *gin.Context) {
	var req dto.AssignWorkerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.projects.AssignWorker(c.Request.Context(), c.Param("id"), req)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusCreated, resp)
}

func (h *ProjectHandler) AssignWorkersBatch(c *gin.Context) {
	var req dto.AssignWorkersBatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.projects.AssignWorkersBatch(c.Request.Context(), c.Param("id"), req)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusCreated, resp)
}

func (h *ProjectHandler) SetSupervisor(c *gin.Context) {
	var req dto.SetProjectSupervisorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.projects.SetSupervisor(c.Request.Context(), c.Param("id"), req)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *ProjectHandler) SupervisorCandidates(c *gin.Context) {
	resp, err := h.projects.SupervisorCandidates(c.Request.Context(), c.Param("id"))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *ProjectHandler) RemoveWorker(c *gin.Context) {
	if err := h.projects.RemoveWorker(c.Request.Context(), c.Param("id"), c.Param("workerId")); err != nil {
		writeError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *ProjectHandler) ChangeWorkerRole(c *gin.Context) {
	var req dto.ChangeWorkerRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.projects.ChangeWorkerRole(c.Request.Context(), c.Param("id"), c.Param("workerId"), req)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *ProjectHandler) Invite(c *gin.Context) {
	var req dto.ProjectInviteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	if err := h.projects.Invite(c.Request.Context(), c.Param("id"), req); err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "sent"})
}

func (h *ProjectHandler) SendNotifications(c *gin.Context) {
	var req dto.SendProjectNotificationsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.projects.SendNotifications(c.Request.Context(), c.Param("id"), req)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *ProjectHandler) UploadDocument(c *gin.Context) {
	projectID := c.Param("id")
	if _, err := h.projects.GetByID(c.Request.Context(), projectID, false); err != nil {
		writeError(c, err)
		return
	}

	documentType := c.PostForm("documentType")
	if !services.IsValidProjectDocumentType(documentType) {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{
			Error: "documentType must be one of: estimate, instruction, general",
		})
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: "file is required"})
		return
	}
	defer file.Close()

	resp, err := h.docs.Upload(c.Request.Context(), services.UploadInput{
		OwnerID:      middleware.UserID(c),
		EntityType:   "project",
		EntityID:     projectID,
		DocumentType: documentType,
		Filename:     header.Filename,
		ContentType:  header.Header.Get("Content-Type"),
		Size:         header.Size,
		Reader:       file,
	})
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusCreated, resp)
}

func (h *ProjectHandler) ListWorkerDocuments(c *gin.Context) {
	resp, err := h.projects.ListWorkerDocuments(c.Request.Context(), c.Param("id"))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *ProjectHandler) ListHistory(c *gin.Context) {
	resp, err := h.projects.ListHistory(c.Request.Context(), c.Param("id"))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *ProjectHandler) ListIssues(c *gin.Context) {
	var q dto.ProjectIssueListQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.projectIssues.ListByProject(c.Request.Context(), c.Param("id"), q.Status)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *ProjectHandler) UpdateIssueStatus(c *gin.Context) {
	var req dto.UpdateProjectIssueStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.projectIssues.UpdateStatus(c.Request.Context(), c.Param("id"), c.Param("issueId"), req.Status)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}
