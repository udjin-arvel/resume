package dto

type ReportExpenseResponse struct {
	ID               string  `json:"id"`
	ExpenseType      string  `json:"expenseType"`
	Amount           string  `json:"amount"`
	Comment          string  `json:"comment"`
	DocumentID       *string `json:"documentId,omitempty"`
	DocumentFilename *string `json:"documentFilename,omitempty"`
}

type WorkerReportResponse struct {
	ID          string                  `json:"id"`
	ProjectID   string                  `json:"projectId"`
	ProjectName string                  `json:"projectName"`
	WorkerID    string                  `json:"workerId"`
	WorkerName  string                  `json:"workerName"`
	WeekStart   string                  `json:"weekStart"`
	WeekEnd     string                  `json:"weekEnd"`
	HoursMon    string                  `json:"hoursMon"`
	HoursTue    string                  `json:"hoursTue"`
	HoursWed    string                  `json:"hoursWed"`
	HoursThu    string                  `json:"hoursThu"`
	HoursFri    string                  `json:"hoursFri"`
	HoursSat    string                  `json:"hoursSat"`
	HoursSun    string                  `json:"hoursSun"`
	Description string                  `json:"description"`
	Status         string                  `json:"status"`
	TotalHours     string                  `json:"totalHours"`
	TotalAmount    string                  `json:"totalAmount"`
	ExpensesTotal  string                  `json:"expensesTotal,omitempty"`
	ManagerComment string                  `json:"managerComment,omitempty"`
	HourlyRate     string                  `json:"hourlyRate,omitempty"`
	SubmittedAt    string                  `json:"submittedAt,omitempty"`
	Expenses       []ReportExpenseResponse `json:"expenses,omitempty"`
}

type CreateWorkerReportRequest struct {
	ProjectID   string                       `json:"projectId" binding:"required"`
	WeekStart   string                       `json:"weekStart" binding:"required"`
	WeekEnd     string                       `json:"weekEnd" binding:"required"`
	HoursMon    string                       `json:"hoursMon"`
	HoursTue    string                       `json:"hoursTue"`
	HoursWed    string                       `json:"hoursWed"`
	HoursThu    string                       `json:"hoursThu"`
	HoursFri    string                       `json:"hoursFri"`
	HoursSat    string                       `json:"hoursSat"`
	HoursSun    string                       `json:"hoursSun"`
	Description string                       `json:"description"`
	Expenses    []CreateReportExpenseRequest `json:"expenses"`
	AsDraft     bool                         `json:"asDraft,omitempty"`
}

type CreateReportExpenseRequest struct {
	ExpenseType string  `json:"expenseType"`
	Amount      string  `json:"amount"`
	Comment     string  `json:"comment"`
	DocumentID  *string `json:"documentId,omitempty"`
}

type UpdateWorkerReportRequest struct {
	CreateWorkerReportRequest
	Submit bool `json:"submit,omitempty"`
}

type TranscribeRequest struct {
	Transcription string `json:"transcription"`
}

type SupervisorReportResponse struct {
	ID                 string                      `json:"id"`
	ProjectID          string                      `json:"projectId"`
	ProjectName        string                      `json:"projectName"`
	SupervisorID       string                      `json:"supervisorId"`
	SupervisorName     string                      `json:"supervisorName"`
	ReportDate         string                      `json:"reportDate"`
	SiteStatus         string                      `json:"siteStatus"`
	Description        string                      `json:"description"`
	Transcription      string                      `json:"transcription"`
	Status             string                      `json:"status"`
	ManagerComment     string                      `json:"managerComment"`
	DowntimeHours      string                      `json:"downtimeHours"`
	DowntimeReason     string                      `json:"downtimeReason"`
	SubmittedAt        string                      `json:"submittedAt,omitempty"`
	VoiceDocumentID    *string                     `json:"voiceDocumentId,omitempty"`
	CompletedWorks     string                      `json:"completedWorks,omitempty"`
	IssueCategory      string                      `json:"issueCategory,omitempty"`
	IssueDescription   string                      `json:"issueDescription,omitempty"`
	CrewPresent        []CrewMemberResponse        `json:"crewPresent,omitempty"`
	RelatedIssue       *ProjectIssueResponse       `json:"relatedIssue,omitempty"`
	LinkedIssues       []ProjectIssueResponse      `json:"linkedIssues,omitempty"`
	AttachmentsPreview []AttachmentPreviewResponse `json:"attachmentsPreview,omitempty"`
	PhotoCount         int                         `json:"photoCount,omitempty"`
}

type CreateSupervisorReportRequest struct {
	ProjectID        string   `json:"projectId" binding:"required"`
	ReportDate       string   `json:"reportDate" binding:"required"`
	SiteStatus       string   `json:"siteStatus"`
	Description      string   `json:"description"`
	CompletedWorks   string   `json:"completedWorks"`
	IssueCategory    string   `json:"issueCategory"`
	IssueDescription string   `json:"issueDescription"`
	DowntimeHours    string   `json:"downtimeHours"`
	DowntimeReason   string   `json:"downtimeReason"`
	VoiceDocumentID  *string  `json:"voiceDocumentId,omitempty"`
	CrewUserIDs      []string `json:"crewUserIds,omitempty"`
	ToolIDs          []string `json:"toolIds,omitempty"`
	LinkedIssueIDs   []string `json:"linkedIssueIds,omitempty"`
}

type PatchSupervisorReportRequest struct {
	SiteStatus       string   `json:"siteStatus"`
	Description      string   `json:"description"`
	CompletedWorks   string   `json:"completedWorks"`
	IssueCategory    string   `json:"issueCategory"`
	IssueDescription string   `json:"issueDescription"`
	DowntimeHours    string   `json:"downtimeHours"`
	DowntimeReason   string   `json:"downtimeReason"`
	VoiceDocumentID  *string  `json:"voiceDocumentId,omitempty"`
	CrewUserIDs      []string `json:"crewUserIds,omitempty"`
	LinkedIssueIDs   []string `json:"linkedIssueIds,omitempty"`
}

type ReportListQuery struct {
	PaginationQuery
	ProjectID    string `form:"projectId"`
	ClientID     string `form:"clientId"`
	WorkerID     string `form:"workerId"`
	SupervisorID string `form:"supervisorId"`
	SiteStatus   string `form:"siteStatus"`
	Status       string `form:"status"`
	From         string `form:"from"`
	To           string `form:"to"`
}

type ManagerCommentRequest struct {
	Comment string `json:"comment" binding:"required"`
}

type RejectWorkerReportRequest struct {
	Comment string `json:"comment"`
}
