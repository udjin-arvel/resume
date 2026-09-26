package dto

type EstimateBlockResponse struct {
	ID        string `json:"id"`
	BlockType string `json:"blockType"`
	SortOrder int    `json:"sortOrder"`
	Title     string `json:"title"`
	Quantity  string `json:"quantity"`
	Unit      string `json:"unit"`
	UnitPrice string `json:"unitPrice"`
	Role      string `json:"role"`
	Hours     string `json:"hours"`
	Rate      string `json:"rate"`
	Amount    string `json:"amount"`
	Comment   string `json:"comment"`
}

type EstimateResponse struct {
	ID            string                  `json:"id"`
	ClientID      *string                 `json:"clientId,omitempty"`
	Name          string                  `json:"name"`
	CompanyName   string                  `json:"companyName"`
	ContactPerson string                  `json:"contactPerson"`
	Phone         string                  `json:"phone"`
	Email         string                  `json:"email"`
	Country       string                  `json:"country"`
	City          string                  `json:"city"`
	Comment       string                  `json:"comment"`
	Status        string                  `json:"status"`
	TotalAmount   string                  `json:"totalAmount"`
	LinkedProjectID *string               `json:"linkedProjectId,omitempty"`
	Blocks        []EstimateBlockResponse `json:"blocks,omitempty"`
	CreatedAt     string                  `json:"createdAt"`
	UpdatedAt     string                  `json:"updatedAt"`
}

type CreateEstimateRequest struct {
	Name          string                       `json:"name" binding:"required"`
	CompanyName   string                       `json:"companyName"`
	ContactPerson string                       `json:"contactPerson"`
	Phone         string                       `json:"phone"`
	Email         string                       `json:"email"`
	Country       string                       `json:"country"`
	City          string                       `json:"city"`
	Comment       string                       `json:"comment"`
	Blocks        []CreateEstimateBlockRequest `json:"blocks"`
}

type CreateEstimateBlockRequest struct {
	BlockType string `json:"blockType" binding:"required"`
	SortOrder int    `json:"sortOrder"`
	Title     string `json:"title"`
	Quantity  string `json:"quantity"`
	Unit      string `json:"unit"`
	UnitPrice string `json:"unitPrice"`
	Role      string `json:"role"`
	Hours     string `json:"hours"`
	Rate      string `json:"rate"`
	Amount    string `json:"amount"`
	Comment   string `json:"comment"`
}

type UpdateEstimateRequest = CreateEstimateRequest

type EstimateStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

type EstimateListQuery struct {
	PaginationQuery
	Status string `form:"status"`
}

type EstimateTemplateResponse struct {
	ID        string                  `json:"id"`
	Name      string                  `json:"name"`
	Blocks    []EstimateBlockResponse `json:"blocks,omitempty"`
	CreatedAt string                  `json:"createdAt"`
}

type CreateFromTemplateRequest struct {
	TemplateID string `json:"templateId" binding:"required"`
	Name       string `json:"name"`
}

type CreateEstimateTemplateRequest struct {
	EstimateID string `json:"estimateId" binding:"required"`
	Name       string `json:"name" binding:"required"`
}
