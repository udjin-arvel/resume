package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/radar-crm/backend/internal/middleware"
	"github.com/radar-crm/backend/internal/models/dto"
	"github.com/radar-crm/backend/internal/services"
)

type DocumentHandler struct {
	docs *services.DocumentService
}

func NewDocumentHandler(docs *services.DocumentService) *DocumentHandler {
	return &DocumentHandler{docs: docs}
}

func (h *DocumentHandler) RegisterRoutes(rg *gin.RouterGroup, jwt gin.HandlerFunc, active gin.HandlerFunc) {
	// Public file endpoint authenticated via short-lived document access token in query.
	rg.GET("/documents/:id/file", h.ServeFile)

	docs := rg.Group("/documents", jwt)
	{
		docs.GET("", h.List)
		docs.POST("", active, h.Upload)
		docs.POST("/upload", active, h.Upload)
		docs.GET("/:id/access-url", h.GetAccessURL)
		docs.PUT("/:id", active, h.Replace)
		docs.DELETE("/:id", active, h.Delete)
	}
}

func (h *DocumentHandler) List(c *gin.Context) {
	var q dto.DocumentListQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: err.Error()})
		return
	}
	resp, err := h.docs.List(c.Request.Context(), q, middleware.UserID(c), middleware.Role(c))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *DocumentHandler) Upload(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: "file is required"})
		return
	}
	defer file.Close()

	resp, err := h.docs.Upload(c.Request.Context(), services.UploadInput{
		OwnerID:      middleware.UserID(c),
		EntityType:   c.PostForm("entityType"),
		EntityID:     c.PostForm("entityId"),
		DocumentType: c.PostForm("documentType"),
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

func (h *DocumentHandler) GetAccessURL(c *gin.Context) {
	resp, err := h.docs.CreateAccessURL(
		c.Request.Context(),
		c.Param("id"),
		middleware.UserID(c),
		middleware.Role(c),
		c.Query("disposition"),
	)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *DocumentHandler) ServeFile(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: "missing token"})
		return
	}
	doc, disposition, err := h.docs.GetForAccessToken(
		c.Request.Context(),
		c.Param("id"),
		token,
		c.Query("disposition"),
	)
	if err != nil {
		writeError(c, err)
		return
	}

	c.Header("Referrer-Policy", "no-referrer")
	if disposition == services.DispositionInline {
		c.Header("Content-Type", doc.MimeType)
		c.Header("Content-Disposition", `inline; filename="`+doc.Filename+`"`)
		c.File(doc.StoragePath)
		return
	}
	c.FileAttachment(doc.StoragePath, doc.Filename)
}

func (h *DocumentHandler) Replace(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: "file is required"})
		return
	}
	defer file.Close()

	resp, err := h.docs.Replace(c.Request.Context(), c.Param("id"), services.UploadInput{
		OwnerID:     middleware.UserID(c),
		Filename:    header.Filename,
		ContentType: header.Header.Get("Content-Type"),
		Size:        header.Size,
		Reader:      file,
	}, middleware.UserID(c), middleware.Role(c))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *DocumentHandler) Delete(c *gin.Context) {
	if err := h.docs.DeleteForUser(c.Request.Context(), c.Param("id"), middleware.UserID(c), middleware.Role(c)); err != nil {
		writeError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}
