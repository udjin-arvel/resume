// Package storage owns the on-disk layout of the shared media volume:
//
//	{root}/uploaded/{job_id}.{ext}   — source files, written by the API
//	{root}/processed/{job_id}.mp4    — results, served directly by nginx
//
// Client-supplied file names never reach the filesystem: paths are built only
// from a server-generated job ID and a whitelisted extension.
package storage

import (
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const (
	UploadedDir  = "uploaded"
	ProcessedDir = "processed"
	partSuffix   = ".part"
)

// Storage resolves paths inside the data directory.
type Storage struct {
	root string
}

// New creates the directory layout under root if needed.
func New(root string) (*Storage, error) {
	for _, d := range []string{UploadedDir, ProcessedDir} {
		if err := os.MkdirAll(filepath.Join(root, d), 0o755); err != nil {
			return nil, fmt.Errorf("storage: create %s: %w", d, err)
		}
	}
	return &Storage{root: root}, nil
}

// UploadPath is where the source file of a job is stored.
func (s *Storage) UploadPath(id, ext string) string {
	return filepath.Join(s.root, UploadedDir, id+"."+ext)
}

// ProcessedPath is the final location of the compressed file.
func (s *Storage) ProcessedPath(id string) string {
	return filepath.Join(s.root, ProcessedDir, id+".mp4")
}

// TempProcessedPath is where FFmpeg writes before the atomic rename, so nginx
// never serves a half-written file.
func (s *Storage) TempProcessedPath(id string) string {
	return s.ProcessedPath(id) + partSuffix
}

// PublicURL is the nginx URL of a processed file.
func PublicURL(id string) string { return "/files/" + ProcessedDir + "/" + id + ".mp4" }

// Remove deletes a file, ignoring "not exists".
func Remove(path string) error {
	if path == "" {
		return nil
	}
	if err := os.Remove(path); err != nil && !errors.Is(err, fs.ErrNotExist) {
		return err
	}
	return nil
}

// Entry is a file found in one of the storage directories.
type Entry struct {
	Path    string
	JobID   string
	ModTime time.Time
}

// List returns regular files of a storage subdirectory (UploadedDir or ProcessedDir).
// JobID is the file name up to the first dot.
func (s *Storage) List(dir string) ([]Entry, error) {
	des, err := os.ReadDir(filepath.Join(s.root, dir))
	if err != nil {
		return nil, err
	}
	out := make([]Entry, 0, len(des))
	for _, de := range des {
		if !de.Type().IsRegular() {
			continue
		}
		info, err := de.Info()
		if err != nil {
			continue
		}
		name := de.Name()
		id, _, _ := strings.Cut(name, ".")
		out = append(out, Entry{
			Path:    filepath.Join(s.root, dir, name),
			JobID:   id,
			ModTime: info.ModTime(),
		})
	}
	return out, nil
}
