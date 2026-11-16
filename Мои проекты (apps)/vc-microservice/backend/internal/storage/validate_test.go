package storage

import (
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestNormalizeExt(t *testing.T) {
	cases := map[string]struct {
		ext string
		ok  bool
	}{
		"video.mp4":           {"mp4", true},
		"Clip.MOV":            {"mov", true},
		"a.b.mkv":             {"mkv", true},
		"x.WebM":              {"webm", true},
		"old.avi":             {"avi", true},
		"evil.mp4.exe":        {"", false},
		"noext":               {"", false},
		"../../etc/passwd":    {"", false},
		"photo.jpg":           {"", false},
		"weird.mp4/../../x":   {"", false},
		"`rm -rf`;.mp4":       {"mp4", true}, // name is irrelevant: only the ext is used
		".mp4":                {"mp4", true},
		"name.mp4 ":           {"", false},
		"name.M4V":            {"", false},
		"C:\\videos\\cat.mov": {"mov", true},
	}
	for in, want := range cases {
		ext, ok := NormalizeExt(in)
		if ext != want.ext || ok != want.ok {
			t.Errorf("NormalizeExt(%q) = %q,%v; want %q,%v", in, ext, ok, want.ext, want.ok)
		}
	}
}

func TestSniff(t *testing.T) {
	mp4 := []byte("\x00\x00\x00\x20ftypisom\x00\x00\x02\x00")
	mov := []byte("\x00\x00\x00\x14ftypqt  \x00\x00\x00\x00")
	oldMov := []byte("\x00\x00\x00\x08wide\x00\x00\x00\x00")
	mkv := []byte{0x1A, 0x45, 0xDF, 0xA3, 0x9F, 0x42, 0x86, 0x81}
	avi := []byte("RIFF\x24\x00\x00\x00AVI LIST")
	wav := []byte("RIFF\x24\x00\x00\x00WAVEfmt ")
	png := []byte("\x89PNG\r\n\x1a\n\x00\x00\x00\x0dIHDR")
	text := []byte("hello, this is not a video at all")

	tests := []struct {
		name string
		ext  string
		head []byte
		want bool
	}{
		{"mp4", "mp4", mp4, true},
		{"mov as mov", "mov", mov, true},
		{"mov as mp4", "mp4", mov, true}, // same container family
		{"legacy quicktime", "mov", oldMov, true},
		{"mkv", "mkv", mkv, true},
		{"webm uses EBML", "webm", mkv, true},
		{"avi", "avi", avi, true},
		{"wav is RIFF but not AVI", "avi", wav, false},
		{"png renamed", "mp4", png, false},
		{"text renamed", "mov", text, false},
		{"mkv content with mp4 ext", "mp4", mkv, false},
		{"short", "mp4", []byte("ab"), false},
		{"empty", "mkv", nil, false},
	}
	for _, tt := range tests {
		if got := MatchesExt(tt.ext, tt.head); got != tt.want {
			t.Errorf("%s: MatchesExt = %v, want %v", tt.name, got, tt.want)
		}
	}
}

func TestStorageLayoutAndList(t *testing.T) {
	root := t.TempDir()
	s, err := New(root)
	if err != nil {
		t.Fatal(err)
	}
	id := "11111111-2222-4333-8444-555555555555"
	if got, want := s.UploadPath(id, "mov"), filepath.Join(root, "uploaded", id+".mov"); got != want {
		t.Fatalf("UploadPath = %s, want %s", got, want)
	}
	if got := PublicURL(id); got != "/files/processed/"+id+".mp4" {
		t.Fatalf("PublicURL = %s", got)
	}
	if err := os.WriteFile(s.ProcessedPath(id), []byte("x"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(s.TempProcessedPath(id), []byte("x"), 0o644); err != nil {
		t.Fatal(err)
	}
	es, err := s.List(ProcessedDir)
	if err != nil || len(es) != 2 {
		t.Fatalf("List = %v, %v", es, err)
	}
	for _, e := range es {
		if e.JobID != id || time.Since(e.ModTime) > time.Minute {
			t.Fatalf("bad entry %+v", e)
		}
	}
	if err := Remove(filepath.Join(root, "missing")); err != nil {
		t.Fatalf("Remove(missing) = %v", err)
	}
}
