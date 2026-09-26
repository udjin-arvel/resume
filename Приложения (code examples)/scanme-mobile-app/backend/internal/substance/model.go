package substance

import "time"

type DangerLevel string

const (
	DangerLevelSafe          DangerLevel = "safe"
	DangerLevelControversial DangerLevel = "controversial"
	DangerLevelDangerous     DangerLevel = "dangerous"
)

type Substance struct {
	ID          string      `json:"id"`
	Code        string      `json:"code,omitempty"`
	Name        string      `json:"name"`
	Aliases     []string    `json:"aliases"`
	Category    string      `json:"category"`
	DangerLevel DangerLevel `json:"dangerLevel"`
	Description string      `json:"description"`
	Sources     []string    `json:"sources"`
	IsActive    bool        `json:"isActive"`
	Version     int64       `json:"version"`
	CreatedAt   time.Time   `json:"createdAt"`
	UpdatedAt   time.Time   `json:"updatedAt"`
}

type ListOptions struct {
	Since       int64
	Limit       int
	Query       string
	Category    string
	DangerLevel string
	IsActive    *bool
	IncludeAll  bool
}

type UpsertInput struct {
	Code        string      `json:"code"`
	Name        string      `json:"name"`
	Aliases     []string    `json:"aliases"`
	Category    string      `json:"category"`
	DangerLevel DangerLevel `json:"dangerLevel"`
	Description string      `json:"description"`
	Sources     []string    `json:"sources"`
	IsActive    *bool       `json:"isActive"`
}

type ListResponse struct {
	Items       []Substance `json:"items"`
	NextVersion int64       `json:"nextVersion"`
}
