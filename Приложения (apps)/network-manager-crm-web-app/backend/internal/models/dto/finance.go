package dto

type FinanceOverviewResponse struct {
	TotalBudget    string `json:"totalBudget"`
	TotalSpent     string `json:"totalSpent"`
	TotalRemaining string `json:"totalRemaining"`
	PendingReview  string `json:"pendingReview"`
	ActiveProjects int    `json:"activeProjects"`
}

type FinanceScopeQuery struct {
	ProjectStatus string `form:"projectStatus" binding:"omitempty,oneof=all active completed"`
	ProjectID     string `form:"projectId"`
}

type ProjectFinanceResponse struct {
	ProjectID           string                     `json:"projectId"`
	ProjectName         string                     `json:"projectName"`
	ProjectStatus       string                     `json:"projectStatus"`
	Budget              string                     `json:"budget"`
	Spent               string                     `json:"spent"`
	Remaining           string                     `json:"remaining"`
	LaborCost           string                     `json:"laborCost"`
	ExpenseCost         string                     `json:"expenseCost"`
	PendingReviewAmount string                     `json:"pendingReviewAmount"`
	TotalLossAmount     string                     `json:"totalLossAmount"`
	Workers             []ProjectWorkerFinanceItem `json:"workers"`
	Categories          []FinanceCategoryItem      `json:"categories"`
	Losses              []ProjectFinanceLossItem   `json:"losses"`
}

type ProjectWorkerFinanceItem struct {
	WorkerID        string `json:"workerId"`
	WorkerName      string `json:"workerName"`
	TotalHours      string `json:"totalHours"`
	TotalAmount     string `json:"totalAmount"`
	ExtraExpenses   string `json:"extraExpenses"`
	PaidAmount      string `json:"paidAmount"`
	RemainingAmount string `json:"remainingAmount"`
}

type FinanceCategoryItem struct {
	Category   string `json:"category"`
	Amount     string `json:"amount"`
	Count      int    `json:"count,omitempty"`
	Percentage int    `json:"percentage"`
}

type ProjectFinanceLossItem struct {
	ID            string `json:"id"`
	Title         string `json:"title"`
	DateFrom      string `json:"dateFrom"`
	DateTo        string `json:"dateTo"`
	DowntimeHours string `json:"downtimeHours"`
	LossAmount    string `json:"lossAmount"`
	SiteStatus    string `json:"siteStatus"`
	IssueStatus   string `json:"issueStatus,omitempty"`
}

type WorkerFinanceResponse struct {
	WorkerID    string `json:"workerId"`
	WorkerName  string `json:"workerName"`
	TotalHours  string `json:"totalHours"`
	TotalPaid   string `json:"totalPaid"`
	ActiveProjects int `json:"activeProjects"`
}

type FinanceCategoryQuery struct {
	FinanceScopeQuery
	From string `form:"from"`
	To   string `form:"to"`
}

type ExpenseCategoryResponse struct {
	Category string `json:"category"`
	Amount   string `json:"amount"`
	Count    int    `json:"count"`
}

type WorkerFinanceMineResponse struct {
	TotalHours      string                        `json:"totalHours"`
	ConfirmedHours  string                        `json:"confirmedHours"`
	PaidAmount      string                        `json:"paidAmount"`
	RemainingAmount string                        `json:"remainingAmount"`
	Projects        []WorkerProjectFinanceResponse `json:"projects"`
}

type WorkerProjectFinanceResponse struct {
	ProjectID       string `json:"projectId"`
	ProjectName     string `json:"projectName"`
	TotalHours      string `json:"totalHours"`
	ProjectAmount   string `json:"projectAmount"`
	ExtraExpenses   string `json:"extraExpenses"`
	PaidAmount      string `json:"paidAmount"`
	RemainingAmount string `json:"remainingAmount"`
}
