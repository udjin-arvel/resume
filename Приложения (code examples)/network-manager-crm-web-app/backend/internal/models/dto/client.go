package dto

type ClientResponse struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	Country       string `json:"country"`
	City          string `json:"city"`
	ContactPerson string `json:"contactPerson"`
	Phone         string `json:"phone"`
	Email         string `json:"email"`
	Comment       string `json:"comment,omitempty"`
}

type UpdateClientRequest struct {
	Name          string `json:"name"`
	Country       string `json:"country"`
	City          string `json:"city"`
	ContactPerson string `json:"contactPerson"`
	Phone         string `json:"phone"`
	Email         string `json:"email"`
	Comment       string `json:"comment"`
}

type ClientListQuery struct {
	PaginationQuery
}

type ClientFinanceResponse struct {
	ClientID    string `json:"clientId"`
	ClientName  string `json:"clientName"`
	Budget      string `json:"budget"`
	Spent       string `json:"spent"`
	Remaining   string `json:"remaining"`
	LaborCost   string `json:"laborCost"`
	ExpenseCost string `json:"expenseCost"`
}
