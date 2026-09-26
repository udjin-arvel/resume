package repositories

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/radar-crm/backend/internal/models"
)

type NotificationRepository struct {
	pool *pgxpool.Pool
}

func NewNotificationRepository(pool *pgxpool.Pool) *NotificationRepository {
	return &NotificationRepository{pool: pool}
}

func (r *NotificationRepository) Create(ctx context.Context, n *models.Notification) error {
	query := `
		INSERT INTO notifications (user_id, title, body, notification_type, link)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at`
	err := r.pool.QueryRow(ctx, query,
		n.UserID, n.Title, n.Body, n.NotificationType, n.Link,
	).Scan(&n.ID, &n.CreatedAt)
	if err != nil {
		return fmt.Errorf("create notification: %w", err)
	}
	return nil
}
