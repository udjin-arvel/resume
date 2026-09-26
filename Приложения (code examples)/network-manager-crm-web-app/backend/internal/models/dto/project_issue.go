package dto

type ProjectIssueResponse struct {
	ID             string  `json:"id"`
	ProjectID      string  `json:"projectId"`
	Number         int     `json:"number"`
	Title          string  `json:"title"`
	Category       string  `json:"category"`
	Description    string  `json:"description"`
	Status         string  `json:"status"`
	SourceReportID *string `json:"sourceReportId,omitempty"`
}

type ProjectIssueListQuery struct {
	Status string `form:"status"`
}

type UpdateProjectIssueStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

type CrewMemberResponse struct {
	ID        string `json:"id"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
}

type AttachmentPreviewResponse struct {
	ID           string `json:"id"`
	Filename     string `json:"filename"`
	DocumentType string `json:"documentType"`
}
