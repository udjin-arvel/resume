package storage

import (
	"bytes"
	"path/filepath"
	"strings"
)

// SniffLen is how many leading bytes Sniff needs.
const SniffLen = 512

// Container families: an extension is accepted only if the file's magic bytes
// belong to the same family (mov and mp4 share the ISO BMFF layout, webm is a
// Matroska profile).
const (
	familyISOBMFF  = "isobmff"
	familyMatroska = "matroska"
	familyRIFFAVI  = "avi"
)

var allowed = map[string]string{
	"mp4":  familyISOBMFF,
	"mov":  familyISOBMFF,
	"mkv":  familyMatroska,
	"webm": familyMatroska,
	"avi":  familyRIFFAVI,
}

// AllowedExtensions lists accepted extensions (for error messages).
func AllowedExtensions() []string { return []string{"mp4", "mov", "mkv", "webm", "avi"} }

// NormalizeExt extracts and lowercases the extension of a client file name and
// reports whether it is on the whitelist. Only the returned value may be used in paths.
func NormalizeExt(filename string) (string, bool) {
	ext := strings.ToLower(strings.TrimPrefix(filepath.Ext(filename), "."))
	if _, ok := allowed[ext]; !ok {
		return "", false
	}
	return ext, true
}

// Sniff detects the container family from the first bytes of a file.
func Sniff(head []byte) string {
	switch {
	case len(head) >= 12 && isISOBMFF(head):
		return familyISOBMFF
	case len(head) >= 4 && bytes.Equal(head[:4], []byte{0x1A, 0x45, 0xDF, 0xA3}):
		return familyMatroska
	case len(head) >= 12 && string(head[:4]) == "RIFF" && string(head[8:12]) == "AVI ":
		return familyRIFFAVI
	}
	return ""
}

// isISOBMFF checks for a known top-level box type at offset 4 (ftyp in modern
// files; old QuickTime files may start with moov/mdat/wide/free/skip).
func isISOBMFF(head []byte) bool {
	switch string(head[4:8]) {
	case "ftyp", "moov", "mdat", "wide", "free", "skip", "pnot":
		return true
	}
	return false
}

// MatchesExt reports whether the sniffed content agrees with the extension.
func MatchesExt(ext string, head []byte) bool {
	fam, ok := allowed[ext]
	return ok && fam == Sniff(head)
}
