// Package jobs implements the in-memory job registry, bounded queue and worker pool.
package jobs

import (
	"crypto/rand"
	"encoding/hex"
	"time"
)

// Status of a job: queued → processing → completed | failed.
type Status string

const (
	StatusQueued     Status = "queued"
	StatusProcessing Status = "processing"
	StatusCompleted  Status = "completed"
	StatusFailed     Status = "failed"
)

// Job is a single compression task.
type Job struct {
	ID           string
	Status       Status
	OriginalName string
	SizeIn       int64
	SizeOut      int64
	Error        string
	CreatedAt    time.Time
	FinishedAt   time.Time

	InputPath string // uploaded/{id}.{ext}
}

// Finished reports whether the job reached a terminal state.
func (j *Job) Finished() bool { return j.Status == StatusCompleted || j.Status == StatusFailed }

// NewID returns a random RFC 4122 version 4 UUID.
func NewID() string {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		panic("crypto/rand failed: " + err.Error())
	}
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	var s [36]byte
	hex.Encode(s[0:8], b[0:4])
	s[8] = '-'
	hex.Encode(s[9:13], b[4:6])
	s[13] = '-'
	hex.Encode(s[14:18], b[6:8])
	s[18] = '-'
	hex.Encode(s[19:23], b[8:10])
	s[23] = '-'
	hex.Encode(s[24:], b[10:])
	return string(s[:])
}

// ValidID reports whether s looks like an ID produced by NewID.
func ValidID(s string) bool {
	if len(s) != 36 {
		return false
	}
	for i := 0; i < len(s); i++ {
		c := s[i]
		switch i {
		case 8, 13, 18, 23:
			if c != '-' {
				return false
			}
		default:
			if !('0' <= c && c <= '9' || 'a' <= c && c <= 'f') {
				return false
			}
		}
	}
	return true
}
