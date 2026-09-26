package moderation

import (
	"encoding/json"
	"time"
)

type QueueItem struct {
	ID                  string          `json:"id"`
	Source              string          `json:"source"`
	Barcode             string          `json:"barcode"`
	Candidate           json.RawMessage `json:"candidate"`
	NormalizedKey       string          `json:"normalizedKey"`
	Status              string          `json:"status"`
	CreatedAt           time.Time       `json:"createdAt"`
	ReviewedBy          *string         `json:"reviewedBy,omitempty"`
	ReviewedAt          *time.Time      `json:"reviewedAt,omitempty"`
	RejectReason        *string         `json:"rejectReason,omitempty"`
	ResolvedSubstanceID *string         `json:"resolvedSubstanceId,omitempty"`
	MergeSuggestion     json.RawMessage `json:"mergeSuggestion,omitempty"`
}

type QueueListResponse struct {
	Counts StatusCounts `json:"counts"`
	Items  []QueueItem  `json:"items"`
}

type StatusCounts struct {
	Pending  int64 `json:"pending"`
	Approved int64 `json:"approved"`
	Rejected int64 `json:"rejected"`
}

type CandidatePayload struct {
	Name                 string `json:"name"`
	Code                 string `json:"code"`
	SuggestedDangerLevel string `json:"suggestedDangerLevel"`
	Rationale            string `json:"rationale"`
}
