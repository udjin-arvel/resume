package dto

type NotificationResponse struct {
	ID               string  `json:"id"`
	Title            string  `json:"title"`
	Body             string  `json:"body"`
	NotificationType string  `json:"notificationType"`
	Link             string  `json:"link"`
	ReadAt           *string `json:"readAt,omitempty"`
	CreatedAt        string  `json:"createdAt"`
}

type SendNotificationRequest struct {
	UserID string `json:"userId" binding:"required"`
	Title  string `json:"title" binding:"required"`
	Body   string `json:"body"`
	Link   string `json:"link"`
}
