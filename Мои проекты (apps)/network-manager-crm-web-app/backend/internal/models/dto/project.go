package dto

type ProjectResponse struct {
	ID              string  `json:"id"`
	ClientID        string  `json:"clientId"`
	EstimateID      *string `json:"estimateId,omitempty"`
	SupervisorID    *string `json:"supervisorId,omitempty"`
	Name            string  `json:"name"`
	Location        string  `json:"location"`
	StartDate       *string `json:"startDate,omitempty"`
	EndDate         *string `json:"endDate,omitempty"`
	Status          string  `json:"status"`
	Type            string  `json:"type"`
	SiteStatus      string  `json:"siteStatus"`
	DowntimeHours   string  `json:"downtimeHours,omitempty"`
	Budget          string  `json:"budget"`
	Spent           string  `json:"spent"`
	Workers         int     `json:"workers"`
	Confirmed       int     `json:"confirmed"`
	ReportsOnReview int                      `json:"reportsOnReview"`
	ProjectWorkers  []ProjectWorkerResponse  `json:"projectWorkers,omitempty"`
}

type CreateProjectFromEstimateRequest struct {
	EstimateID string  `json:"estimateId" binding:"required"`
	Name       string  `json:"name"`
	Location   string  `json:"location"`
	StartDate  *string `json:"startDate"`
}

type ProjectInviteRequest struct {
	UserID string `json:"userId" binding:"required"`
}

type SendProjectNotificationsRequest struct {
	UserIDs []string `json:"userIds" binding:"required,min=1,dive,required"`
	Title   string   `json:"title"`
	Body    string   `json:"body" binding:"required"`
	Link    string   `json:"link"`
}

type SendProjectNotificationsResponse struct {
	Sent int `json:"sent"`
}

type CreateProjectRequest struct {
	ClientID   string  `json:"clientId" binding:"required"`
	EstimateID *string `json:"estimateId"`
	Name       string  `json:"name" binding:"required"`
	Location   string  `json:"location"`
	StartDate  *string `json:"startDate"`
	EndDate    *string `json:"endDate"`
	Type       string  `json:"type"`
	Budget     string  `json:"budget"`
}

type UpdateProjectRequest struct {
	Name          string  `json:"name"`
	Location      string  `json:"location"`
	StartDate     *string `json:"startDate"`
	EndDate       *string `json:"endDate"`
	Status        string  `json:"status"`
	SiteStatus    string  `json:"siteStatus"`
	DowntimeHours string  `json:"downtimeHours"`
	Budget        string  `json:"budget"`
}

type AssignWorkerRequest struct {
	UserID string `json:"userId" binding:"required"`
	Role   string `json:"role"`
}

type ChangeWorkerRoleRequest struct {
	Role string `json:"role" binding:"required"`
}

type ProjectListQuery struct {
	PaginationQuery
	Status   string `form:"status"`
	ClientID string `form:"clientId"`
}

type ProjectWorkerResponse struct {
	ID                 string `json:"id"`
	UserID             string `json:"userId"`
	FirstName          string `json:"firstName"`
	LastName           string `json:"lastName"`
	Role               string `json:"role"`
	ConfirmationStatus string `json:"confirmationStatus"`
	HourlyRate         string `json:"hourlyRate,omitempty"`
	Specialization     string `json:"specialization,omitempty"`
	Position           string `json:"position,omitempty"`
	AssignedAt         string `json:"assignedAt,omitempty"`
	InvitedAt          string `json:"invitedAt,omitempty"`
}

type AssignWorkersBatchRequest struct {
	UserIDs []string `json:"userIds" binding:"required"`
	Role    string   `json:"role"`
}

type SetProjectSupervisorRequest struct {
	UserID string `json:"userId" binding:"required"`
}

type SupervisorCandidatesResponse struct {
	OnProject []WorkerResponse `json:"onProject"`
	Available []WorkerResponse `json:"available"`
}

type MyProjectListQuery struct {
	Status             string `form:"status"`
	ConfirmationStatus string `form:"confirmationStatus"`
}

type ProjectContact struct {
	Role  string `json:"role"`
	Name  string `json:"name"`
	Phone string `json:"phone"`
}

type MyProjectResponse struct {
	ID                 string                  `json:"id"`
	Name               string                  `json:"name"`
	Location           string                  `json:"location"`
	ClientName         string                  `json:"clientName,omitempty"`
	Status             string                  `json:"status"`
	SiteStatus         string                  `json:"siteStatus"`
	StartDate          *string                 `json:"startDate,omitempty"`
	EndDate            *string                 `json:"endDate,omitempty"`
	Role               string                  `json:"role"`
	ConfirmationStatus string                  `json:"confirmationStatus"`
	AssignedAt         string                  `json:"assignedAt"`
	Contacts           []ProjectContact        `json:"contacts,omitempty"`
	ProjectWorkers     []ProjectWorkerResponse `json:"projectWorkers,omitempty"`
}
