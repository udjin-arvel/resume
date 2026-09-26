package models

import (
	"time"

	"github.com/radar-crm/backend/internal/models/dto"
)

type Project struct {
	ID            string
	ClientID      string
	EstimateID    *string
	SupervisorID  *string
	Name          string
	Location      string
	StartDate     *time.Time
	EndDate       *time.Time
	Status        string
	Type          string
	SiteStatus    string
	DowntimeHours string
	Budget        string
	Spent         string
	CreatedAt     time.Time
	UpdatedAt     time.Time
	DeletedAt     *time.Time
	Stats         ProjectStats
	Workers       []ProjectWorker
}

func (p *Project) ToResponse() dto.ProjectResponse {
	resp := dto.ProjectResponse{
		ID:            p.ID,
		ClientID:      p.ClientID,
		EstimateID:    p.EstimateID,
		SupervisorID:  p.SupervisorID,
		Name:          p.Name,
		Location:      p.Location,
		Status:        p.Status,
		Type:          p.Type,
		SiteStatus:    p.SiteStatus,
		DowntimeHours: p.DowntimeHours,
		Budget:          p.Budget,
		Spent:           p.Spent,
		Workers:         p.Stats.Workers,
		Confirmed:       p.Stats.Confirmed,
		ReportsOnReview: p.Stats.ReportsOnReview,
	}
	if p.StartDate != nil {
		s := p.StartDate.Format("2006-01-02")
		resp.StartDate = &s
	}
	if p.EndDate != nil {
		s := p.EndDate.Format("2006-01-02")
		resp.EndDate = &s
	}
	if len(p.Workers) > 0 {
		resp.ProjectWorkers = make([]dto.ProjectWorkerResponse, 0, len(p.Workers))
		for _, w := range p.Workers {
			resp.ProjectWorkers = append(resp.ProjectWorkers, w.ToResponse())
		}
	}
	return resp
}
