package dto

type DocumentResponse struct {
	ID           string `json:"id"`
	EntityType   string `json:"entityType"`
	EntityID     string `json:"entityId"`
	DocumentType string `json:"documentType"`
	Filename     string `json:"filename"`
	MimeType     string `json:"mimeType"`
	SizeBytes    int64  `json:"sizeBytes"`
	CreatedAt    string `json:"createdAt"`
}

type DocumentAccessURLResponse struct {
	URL         string `json:"url"`
	ExpiresAt   string `json:"expiresAt"`
	Disposition string `json:"disposition"`
	MimeType    string `json:"mimeType"`
	Filename    string `json:"filename"`
}

type DocumentListQuery struct {
	PaginationQuery
	EntityType string `form:"entityType"`
	EntityID   string `form:"entityId"`
}

type ProjectWorkerDocumentItem struct {
	ID          string `json:"id"`
	Filename    string `json:"filename"`
	ExpenseType string `json:"expenseType"`
	CreatedAt   string `json:"createdAt"`
}

type ProjectWorkerDocumentsGroup struct {
	WorkerID   string                      `json:"workerId"`
	WorkerName string                      `json:"workerName"`
	Documents  []ProjectWorkerDocumentItem `json:"documents"`
}
