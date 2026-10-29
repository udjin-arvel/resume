package redis

import (
	"context"
	"time"

	redisv9 "github.com/redis/go-redis/v9"
)

func NewClient(redisURL string) (*redisv9.Client, error) {
	opts, err := redisv9.ParseURL(redisURL)
	if err != nil {
		return nil, err
	}

	return redisv9.NewClient(opts), nil
}

func Ping(ctx context.Context, client *redisv9.Client) error {
	if client == nil {
		return nil
	}

	pingCtx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()

	return client.Ping(pingCtx).Err()
}
