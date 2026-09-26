package dto

type ToolResponse struct {
	ID                      string  `json:"id"`
	Name                    string  `json:"name"`
	SerialNumber            string  `json:"serialNumber"`
	ToolType                string  `json:"toolType"`
	Model                   string  `json:"model"`
	ControlType             string  `json:"controlType"`
	Status                  string  `json:"status"`
	CalibrationDueAt        *string `json:"calibrationDueAt,omitempty"`
	CalibrationPeriodMonths int     `json:"calibrationPeriodMonths"`
	UsageLimit              int     `json:"usageLimit"`
	UsageCount              int     `json:"usageCount"`
	UsageUnit               string  `json:"usageUnit"`
	CostCents               int     `json:"costCents"`
	PurchaseDate            *string `json:"purchaseDate,omitempty"`
	Comment                 string  `json:"comment"`
	ProblemType             string  `json:"problemType,omitempty"`
	ProblemComment          string  `json:"problemComment,omitempty"`
	ProblemReportedAt       *string `json:"problemReportedAt,omitempty"`
}

type CreateToolRequest struct {
	Name                    string `json:"name" binding:"required"`
	SerialNumber            string `json:"serialNumber"`
	ToolType                string `json:"toolType"`
	Model                   string `json:"model"`
	ControlType             string `json:"controlType"`
	UsageLimit              int    `json:"usageLimit"`
	UsageCount              int    `json:"usageCount"`
	UsageUnit               string `json:"usageUnit"`
	CostCents               int    `json:"costCents"`
	PurchaseDate            string `json:"purchaseDate"`
	CalibrationPeriodMonths int    `json:"calibrationPeriodMonths"`
	Comment                 string `json:"comment"`
	LastCalibratedAt        string `json:"lastCalibratedAt"`
	ValidUntil              string `json:"validUntil"`
	CalibrationNotes        string `json:"calibrationNotes"`
}

type UpdateToolRequest = CreateToolRequest

type AssignToolRequest struct {
	ProjectID         string `json:"projectId" binding:"required"`
	ResponsibleUserID string `json:"responsibleUserId"`
}

type ReturnToolRequest struct {
	ConditionOnReturn string `json:"conditionOnReturn"`
}

type ReportToolProblemRequest struct {
	ProblemType string `json:"problemType" binding:"required"`
	Comment     string `json:"comment"`
}

type CalibrateToolRequest struct {
	NextDueAt string `json:"nextDueAt"`
	Notes     string `json:"notes"`
}

type ToolListQuery struct {
	PaginationQuery
	Status    string `form:"status"`
	ProjectID string `form:"projectId"`
}

type ToolAssignmentResponse struct {
	ID                string  `json:"id"`
	ToolID            string  `json:"toolId"`
	ProjectID         string  `json:"projectId"`
	ProjectName       string  `json:"projectName"`
	ResponsibleUserID *string `json:"responsibleUserId,omitempty"`
	ResponsibleName   string  `json:"responsibleName,omitempty"`
	ResponsibleRole   string  `json:"responsibleRole,omitempty"`
	AssignedAt        string  `json:"assignedAt"`
	ReturnedAt        *string `json:"returnedAt,omitempty"`
	ConditionOnReturn string  `json:"conditionOnReturn,omitempty"`
	UsedInReport      bool    `json:"usedInReport"`
}

type ToolCalibrationResponse struct {
	ID            string  `json:"id"`
	ToolID        string  `json:"toolId"`
	CalibratedAt  string  `json:"calibratedAt"`
	NextDueAt     *string `json:"nextDueAt,omitempty"`
	PerformedBy   *string `json:"performedBy,omitempty"`
	PerformerName string  `json:"performerName,omitempty"`
	Notes         string  `json:"notes"`
}

type ToolDetailResponse struct {
	ToolResponse
	ActiveAssignment  *ToolAssignmentResponse   `json:"activeAssignment,omitempty"`
	PlannedReturnAt   *string                   `json:"plannedReturnAt,omitempty"`
	AssignmentHistory []ToolAssignmentResponse  `json:"assignmentHistory,omitempty"`
	Calibrations      []ToolCalibrationResponse `json:"calibrations,omitempty"`
}

type ToolListItemResponse struct {
	ToolResponse
	ActiveAssignment *ToolAssignmentResponse `json:"activeAssignment,omitempty"`
	LastReturnedAt   *string                 `json:"lastReturnedAt,omitempty"`
	PlannedReturnAt  *string                 `json:"plannedReturnAt,omitempty"`
}
