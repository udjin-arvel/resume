package services

import "strings"

const (
	DispositionInline     = "inline"
	DispositionAttachment = "attachment"
)

func IsViewableMIME(mimeType string) bool {
	ct := strings.TrimSpace(strings.ToLower(strings.Split(mimeType, ";")[0]))
	if ct == "" {
		return false
	}
	if strings.HasPrefix(ct, "image/") {
		return true
	}
	if strings.HasPrefix(ct, "audio/") {
		return true
	}
	return ct == "application/pdf"
}

// ResolveDisposition returns the effective Content-Disposition.
// Requested "inline" falls back to "attachment" for non-viewable MIME types.
func ResolveDisposition(mimeType, requested string) string {
	req := strings.TrimSpace(strings.ToLower(requested))
	if req == "" {
		if IsViewableMIME(mimeType) {
			return DispositionInline
		}
		return DispositionAttachment
	}
	if req == DispositionInline {
		if IsViewableMIME(mimeType) {
			return DispositionInline
		}
		return DispositionAttachment
	}
	return DispositionAttachment
}
