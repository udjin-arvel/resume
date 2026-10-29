package analytics

import (
	"context"
	"fmt"
	"strings"
	"time"

	redisv9 "github.com/redis/go-redis/v9"
)

type Service struct {
	repo Repository
	rdb  *redisv9.Client
}

func NewService(repo Repository, rdb *redisv9.Client) Service {
	return Service{repo: repo, rdb: rdb}
}

func (s Service) Ingest(ctx context.Context, userID string, idempotencyKey string, req BatchRequest) (accepted int64, duplicate bool, err error) {
	if len(req.Events) > MaxBatchSize {
		return 0, false, ErrBatchTooLarge
	}

	key := strings.TrimSpace(idempotencyKey)
	if key != "" && s.rdb != nil {
		cacheKey := fmt.Sprintf("scanme:analytics:idemp:%s:%s", userID, key)
		ok, ierr := s.rdb.SetNX(ctx, cacheKey, "1", 48*time.Hour).Result()
		if ierr != nil {
			return 0, false, ierr
		}
		if !ok {
			return 0, true, nil
		}

		inserted, ierr := s.repo.InsertBatch(ctx, userID, req.Events)
		if ierr != nil {
			_, _ = s.rdb.Del(ctx, cacheKey).Result()
			return 0, false, ierr
		}
		return inserted, false, nil
	}

	inserted, err := s.repo.InsertBatch(ctx, userID, req.Events)
	return inserted, false, err
}
