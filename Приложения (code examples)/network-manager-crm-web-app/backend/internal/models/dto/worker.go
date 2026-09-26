package dto

type ApplicationFeedback struct {
	Action     string   `json:"action,omitempty"`
	Reasons    []string `json:"reasons,omitempty"`
	Comment    string   `json:"comment,omitempty"`
	ReviewedAt string   `json:"reviewedAt,omitempty"`
}

type RejectWorkerApplicationRequest struct {
	Reasons []string `json:"reasons" binding:"required,min=1"`
	Comment string   `json:"comment"`
}

type ReturnWorkerApplicationRequest struct {
	Reasons []string `json:"reasons" binding:"required,min=1"`
	Comment string   `json:"comment"`
}

type WorkerResponse struct {
	ID                           string               `json:"id"`
	FirstName                    string               `json:"firstName"`
	LastName                     string               `json:"lastName"`
	Phone                        string               `json:"phone"`
	Email                        string               `json:"email"`
	Country                      string               `json:"country"`
	Position                     string               `json:"position"`
	Specialization               string               `json:"specialization"`
	HourlyRate                   string               `json:"hourlyRate"`
	Status                       string               `json:"status"`
	Role                         string               `json:"role"`
	Language                     string               `json:"language"`
	Timezone                     string               `json:"timezone,omitempty"`
	CreatedAt                    string               `json:"createdAt,omitempty"`
	ProjectName                  string               `json:"projectName,omitempty"`
	ProjectStatus                string               `json:"projectStatus,omitempty"`
	InternalComment              string               `json:"internalComment,omitempty"`
	TelegramUsername             string               `json:"telegramUsername,omitempty"`
	BlockReason                  string               `json:"blockReason,omitempty"`
	BlockedAt                    string               `json:"blockedAt,omitempty"`
	BlockProjectID               string               `json:"blockProjectId,omitempty"`
	BlockProjectName             string               `json:"blockProjectName,omitempty"`
	ApplicationCorrectionsNeeded bool                 `json:"applicationCorrectionsNeeded,omitempty"`
	ApplicationFeedback          *ApplicationFeedback `json:"applicationFeedback,omitempty"`
}

type CreateWorkerRequest struct {
	FirstName        string `json:"firstName" binding:"required"`
	LastName         string `json:"lastName" binding:"required"`
	Phone            string `json:"phone"`
	Email            string `json:"email" binding:"required,email"`
	Password         string `json:"password" binding:"required,min=8"`
	Country          string `json:"country"`
	Position         string `json:"position"`
	Specialization   string `json:"specialization"`
	HourlyRate       string `json:"hourlyRate"`
	InternalComment  string `json:"internalComment"`
	TelegramUsername string `json:"telegramUsername"`
}

type UpdateWorkerRequest struct {
	FirstName        string `json:"firstName" binding:"required"`
	LastName         string `json:"lastName" binding:"required"`
	Phone            string `json:"phone"`
	Email            string `json:"email"`
	Country          string `json:"country"`
	Position         string `json:"position"`
	Specialization   string `json:"specialization"`
	HourlyRate       string `json:"hourlyRate"`
	InternalComment  string `json:"internalComment"`
	TelegramUsername string `json:"telegramUsername"`
}

type WorkerProjectResponse struct {
	ID                 string  `json:"id"`
	Name               string  `json:"name"`
	Location           string  `json:"location"`
	ClientName         string  `json:"clientName"`
	Status             string  `json:"status"`
	SiteStatus         string  `json:"siteStatus"`
	StartDate          *string `json:"startDate,omitempty"`
	EndDate            *string `json:"endDate,omitempty"`
	Role               string  `json:"role"`
	ConfirmationStatus string  `json:"confirmationStatus"`
	AssignedAt         string  `json:"assignedAt"`
}

type WorkerListQuery struct {
	PaginationQuery
	Status         string `form:"status"`
	Specialization string `form:"specialization"`
	ProjectID      string `form:"projectId"`
	ClientID       string `form:"clientId"`
}

type WorkerResourceStat struct {
	Specialization string `json:"specialization"`
	Total          int    `json:"total"`
	Available      int    `json:"available"`
	OnProject      int    `json:"onProject"`
}

type BlockWorkerRequest struct {
	Reason    string `json:"reason" binding:"required"`
	ProjectID string `json:"projectId"`
}
