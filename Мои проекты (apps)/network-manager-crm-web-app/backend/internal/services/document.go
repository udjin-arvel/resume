package services

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"mime"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/radar-crm/backend/internal/apperrors"
	"github.com/radar-crm/backend/internal/auth"
	"github.com/radar-crm/backend/internal/models"
	"github.com/radar-crm/backend/internal/models/dto"
	"github.com/radar-crm/backend/internal/repositories"
)

const maxUploadSize = 10 << 20      // 10 MB
const maxVoiceUploadSize = 25 << 20 // 25 MB

var projectDocumentTypes = map[string]struct{}{
	"estimate":    {},
	"instruction": {},
	"general":     {},
}

func IsValidProjectDocumentType(documentType string) bool {
	_, ok := projectDocumentTypes[documentType]
	return ok
}

var allowedMIMETypes = map[string]struct{}{
	"image/jpeg":      {},
	"image/png":       {},
	"application/pdf": {},
}

var allowedAudioMIMETypes = map[string]struct{}{
	"audio/mpeg": {},
	"audio/ogg":  {},
	"audio/webm": {},
	"audio/wav":  {},
	"audio/x-wav": {},
}

type DocumentService struct {
	uploadDir      string
	jwtSecret      string
	docs           *repositories.DocumentRepository
	projectWorkers *repositories.ProjectWorkerRepository
	activity       *ActivityService
}

func NewDocumentService(
	uploadDir string,
	jwtSecret string,
	docs *repositories.DocumentRepository,
	projectWorkers *repositories.ProjectWorkerRepository,
	activity *ActivityService,
) *DocumentService {
	return &DocumentService{
		uploadDir:      uploadDir,
		jwtSecret:      jwtSecret,
		docs:           docs,
		projectWorkers: projectWorkers,
		activity:       activity,
	}
}

func (s *DocumentService) EnsureUploadDir() error {
	return os.MkdirAll(s.uploadDir, 0o755)
}

type UploadInput struct {
	OwnerID      string
	EntityType   string
	EntityID     string
	DocumentType string
	Filename     string
	ContentType  string
	Size         int64
	Reader       io.Reader
}

func (s *DocumentService) Upload(ctx context.Context, input UploadInput) (*dto.DocumentResponse, error) {
	if input.EntityType == "" || input.EntityID == "" {
		return nil, apperrors.New(apperrors.ErrValidation, "entityType and entityId are required")
	}
	if input.Size <= 0 {
		return nil, apperrors.New(apperrors.ErrValidation, "file is empty")
	}

	limit := int64(maxUploadSize)
	if input.EntityType == "supervisor_report" {
		limit = int64(maxVoiceUploadSize)
	}
	if input.Size > limit {
		return nil, apperrors.New(apperrors.ErrValidation, "file exceeds maximum size")
	}

	contentType := normalizeMIME(input.ContentType, input.Filename)
	if !isAllowedMIME(contentType, input.EntityType) {
		return nil, apperrors.New(apperrors.ErrValidation, "file type not allowed")
	}

	safeName := sanitizeFilename(input.Filename)
	storageName, err := randomFilename(safeName)
	if err != nil {
		return nil, err
	}
	entityDir := filepath.Join(s.uploadDir, input.EntityType)
	if err := os.MkdirAll(entityDir, 0o755); err != nil {
		return nil, fmt.Errorf("create upload dir: %w", err)
	}
	storagePath := filepath.Join(entityDir, storageName)

	file, err := os.Create(storagePath)
	if err != nil {
		return nil, fmt.Errorf("create file: %w", err)
	}
	defer file.Close()

	written, err := io.Copy(file, io.LimitReader(input.Reader, limit+1))
	if err != nil {
		_ = os.Remove(storagePath)
		return nil, fmt.Errorf("write file: %w", err)
	}
	if written > limit {
		_ = os.Remove(storagePath)
		return nil, apperrors.New(apperrors.ErrValidation, "file exceeds maximum size")
	}

	var ownerID *string
	if input.OwnerID != "" {
		ownerID = &input.OwnerID
	}

	doc := &models.Document{
		OwnerID:      ownerID,
		EntityType:   input.EntityType,
		EntityID:     input.EntityID,
		DocumentType: input.DocumentType,
		Filename:     safeName,
		MimeType:     contentType,
		SizeBytes:    written,
		StoragePath:  storagePath,
	}
	if err := s.docs.Create(ctx, doc); err != nil {
		_ = os.Remove(storagePath)
		return nil, err
	}
	if s.activity != nil {
		label := input.Filename
		entityType := input.EntityType
		entityID := doc.ID
		meta := map[string]any{"label": label}
		if input.EntityType == "project" {
			label = projectDocumentUploadLabel(input.DocumentType, input.Filename)
			entityType = "project"
			entityID = input.EntityID
			meta["projectId"] = input.EntityID
			meta["label"] = label
		}
		s.activity.RecordWithMeta(ctx, input.OwnerID, "document_uploaded", entityType, entityID, meta)
	}

	resp := doc.ToResponse()
	return &resp, nil
}

func (s *DocumentService) List(ctx context.Context, q dto.DocumentListQuery, actorID, role string) ([]dto.DocumentResponse, error) {
	var docs []models.Document
	var err error
	if role == "manager" {
		docs, err = s.docs.List(ctx, q)
	} else if q.EntityType != "" && q.EntityID != "" {
		docs, err = s.docs.List(ctx, q)
	} else {
		docs, err = s.docs.ListByOwner(ctx, actorID)
	}
	if err != nil {
		return nil, err
	}
	responses := make([]dto.DocumentResponse, 0, len(docs))
	for _, d := range docs {
		if role == "manager" || s.canAccess(ctx, actorID, role, &d) {
			responses = append(responses, d.ToResponse())
		}
	}
	return responses, nil
}

func (s *DocumentService) GetForUser(ctx context.Context, id, actorID, role string) (*models.Document, error) {
	doc, err := s.docs.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if !s.canAccess(ctx, actorID, role, doc) {
		return nil, apperrors.New(apperrors.ErrForbidden, "forbidden")
	}
	return doc, nil
}

func (s *DocumentService) CreateAccessURL(ctx context.Context, id, actorID, role, requestedDisposition string) (*dto.DocumentAccessURLResponse, error) {
	doc, err := s.GetForUser(ctx, id, actorID, role)
	if err != nil {
		return nil, err
	}
	disposition := ResolveDisposition(doc.MimeType, requestedDisposition)
	token, expiresAt, err := auth.GenerateDocumentAccessToken(doc.ID, actorID, role, s.jwtSecret)
	if err != nil {
		return nil, err
	}
	q := url.Values{}
	q.Set("token", token)
	q.Set("disposition", disposition)
	return &dto.DocumentAccessURLResponse{
		URL:         "/api/v1/documents/" + doc.ID + "/file?" + q.Encode(),
		ExpiresAt:   expiresAt.UTC().Format(time.RFC3339),
		Disposition: disposition,
		MimeType:    doc.MimeType,
		Filename:    doc.Filename,
	}, nil
}

func (s *DocumentService) GetForAccessToken(ctx context.Context, id, tokenString, requestedDisposition string) (*models.Document, string, error) {
	claims, err := auth.ParseDocumentAccessToken(tokenString, s.jwtSecret)
	if err != nil {
		return nil, "", apperrors.New(apperrors.ErrUnauthorized, "invalid or expired token")
	}
	if claims.DocumentID != id {
		return nil, "", apperrors.New(apperrors.ErrUnauthorized, "invalid or expired token")
	}
	doc, err := s.GetForUser(ctx, id, claims.UserID, claims.Role)
	if err != nil {
		return nil, "", err
	}
	disposition := ResolveDisposition(doc.MimeType, requestedDisposition)
	return doc, disposition, nil
}

func (s *DocumentService) Replace(ctx context.Context, id string, input UploadInput, actorID, role string) (*dto.DocumentResponse, error) {
	doc, err := s.GetForUser(ctx, id, actorID, role)
	if err != nil {
		return nil, err
	}
	if input.Size <= 0 {
		return nil, apperrors.New(apperrors.ErrValidation, "file is empty")
	}
	limit := int64(maxUploadSize)
	contentType := normalizeMIME(input.ContentType, input.Filename)
	if !isAllowedMIME(contentType, doc.EntityType) {
		return nil, apperrors.New(apperrors.ErrValidation, "file type not allowed")
	}
	safeName := sanitizeFilename(input.Filename)
	_ = os.Remove(doc.StoragePath)
	storageName, err := randomFilename(safeName)
	if err != nil {
		return nil, err
	}
	entityDir := filepath.Join(s.uploadDir, doc.EntityType)
	storagePath := filepath.Join(entityDir, storageName)
	file, err := os.Create(storagePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()
	written, err := io.Copy(file, io.LimitReader(input.Reader, limit+1))
	if err != nil {
		_ = os.Remove(storagePath)
		return nil, err
	}
	doc.Filename = safeName
	doc.MimeType = contentType
	doc.SizeBytes = written
	doc.StoragePath = storagePath
	if err := s.docs.UpdateFile(ctx, doc); err != nil {
		return nil, err
	}
	resp := doc.ToResponse()
	return &resp, nil
}

func (s *DocumentService) DeleteForUser(ctx context.Context, id, actorID, role string) error {
	doc, err := s.GetForUser(ctx, id, actorID, role)
	if err != nil {
		return err
	}
	if _, err := s.docs.Delete(ctx, id); err != nil {
		return err
	}
	if err := os.Remove(doc.StoragePath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("remove file: %w", err)
	}
	return nil
}

func (s *DocumentService) canAccess(ctx context.Context, actorID, role string, doc *models.Document) bool {
	if role == "manager" {
		return true
	}
	if doc.OwnerID != nil && *doc.OwnerID == actorID {
		return true
	}
	if doc.EntityType == "project" && s.projectWorkers != nil {
		if doc.DocumentType == "estimate" {
			return false
		}
		ok, _ := s.projectWorkers.IsAssigned(ctx, doc.EntityID, actorID)
		return ok
	}
	return false
}

func (s *DocumentService) GetByID(ctx context.Context, id string) (*models.Document, error) {
	return s.docs.GetByID(ctx, id)
}

func (s *DocumentService) Delete(ctx context.Context, id string) error {
	doc, err := s.docs.Delete(ctx, id)
	if err != nil {
		return err
	}
	if err := os.Remove(doc.StoragePath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("remove file: %w", err)
	}
	return nil
}

func normalizeMIME(contentType, filename string) string {
	ct := strings.TrimSpace(strings.Split(contentType, ";")[0])
	if ct != "" && ct != "application/octet-stream" {
		return ct
	}
	ext := filepath.Ext(filename)
	if ext == "" {
		return contentType
	}
	if detected := mime.TypeByExtension(ext); detected != "" {
		return detected
	}
	return contentType
}

func randomFilename(safeName string) (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("generate filename: %w", err)
	}
	return hex.EncodeToString(b) + "_" + safeName, nil
}

func sanitizeFilename(name string) string {
	name = filepath.Base(name)
	name = strings.ReplaceAll(name, "..", "")
	if name == "" || name == "." {
		return "upload"
	}
	return name
}

func isAllowedMIME(contentType, entityType string) bool {
	if _, ok := allowedMIMETypes[contentType]; ok {
		return true
	}
	if entityType == "supervisor_report" {
		_, ok := allowedAudioMIMETypes[contentType]
		return ok
	}
	return false
}
