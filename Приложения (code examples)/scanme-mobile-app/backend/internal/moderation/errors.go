package moderation

import "errors"

var (
	ErrNotFound     = errors.New("moderation queue item not found")
	ErrNotPending   = errors.New("moderation queue item is not pending")
	ErrInvalidInput = errors.New("invalid moderation payload")
)
