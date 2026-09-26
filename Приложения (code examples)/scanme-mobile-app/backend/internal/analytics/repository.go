package analytics

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrBatchTooLarge = errors.New("analytics batch exceeds limit")

const MaxBatchSize = 100

type EventInput struct {
	Name          string         `json:"name"`
	Props         map[string]any `json:"props"`
	TS            time.Time      `json:"ts"`
	ClientEventID string         `json:"id"`
}

type BatchRequest struct {
	Events []EventInput `json:"events"`
}

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return Repository{db: db}
}

func (r Repository) InsertBatch(ctx context.Context, userID string, events []EventInput) (inserted int64, err error) {
	if len(events) == 0 {
		return 0, nil
	}

	const sql = `
INSERT INTO analytics_events (user_id, name, props, ts, client_event_id)
VALUES ($1, $2, $3::jsonb, $4, NULLIF($5, ''))
ON CONFLICT (user_id, client_event_id) WHERE client_event_id IS NOT NULL AND client_event_id <> '' DO NOTHING
`

	batch := &pgx.Batch{}
	queued := 0
	for _, ev := range events {
		name := strings.TrimSpace(ev.Name)
		if name == "" {
			continue
		}
		if ev.TS.IsZero() {
			ev.TS = time.Now().UTC()
		}
		if ev.Props == nil {
			ev.Props = map[string]any{}
		}
		propsJSON, jerr := json.Marshal(ev.Props)
		if jerr != nil {
			return 0, jerr
		}
		clientID := strings.TrimSpace(ev.ClientEventID)
		batch.Queue(sql, userID, name, propsJSON, ev.TS.UTC(), clientID)
		queued++
	}

	br := r.db.SendBatch(ctx, batch)
	defer br.Close()

	for i := 0; i < queued; i++ {
		tag, err := br.Exec()
		if err != nil {
			return inserted, err
		}
		inserted += tag.RowsAffected()
	}

	return inserted, nil
}
