package models

import (
	"time"

	"github.com/radar-crm/backend/internal/models/dto"
)

type Client struct {
	ID            string
	Name          string
	Country       string
	City          string
	ContactPerson string
	Phone         string
	Email         string
	Comment       string
	CreatedAt     time.Time
	UpdatedAt     time.Time
	DeletedAt     *time.Time
}

func (c *Client) ToResponse() dto.ClientResponse {
	return dto.ClientResponse{
		ID:            c.ID,
		Name:          c.Name,
		Country:       c.Country,
		City:          c.City,
		ContactPerson: c.ContactPerson,
		Phone:         c.Phone,
		Email:         c.Email,
		Comment:       c.Comment,
	}
}
