package dto

type UrgentActionResponse struct {
	Key     string              `json:"key"`
	Count   int                 `json:"count"`
	Title   string              `json:"title"`
	Preview []UrgentPreviewItem `json:"preview"`
}

type UrgentPreviewItem struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Label string `json:"label"`
}

type ProblemProjectResponse struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	SiteStatus  string `json:"siteStatus"`
	Issue       string `json:"issue"`
	DowntimeHours string `json:"downtimeHours,omitempty"`
}

type ActivityItemResponse struct {
	ID         string `json:"id"`
	ActorName  string `json:"actorName"`
	Action     string `json:"action"`
	EntityType string `json:"entityType"`
	EntityID   string `json:"entityId"`
	Label      string `json:"label"`
	CreatedAt  string `json:"createdAt"`
}
