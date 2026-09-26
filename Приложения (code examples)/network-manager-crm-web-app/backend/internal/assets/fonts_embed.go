package assets

import _ "embed"

// DejaVu Sans Condensed (SIL Open Font License) — supports Cyrillic in PDF export.
//
//go:embed fonts/DejaVuSansCondensed.ttf
var DejaVuSansRegular []byte

//go:embed fonts/DejaVuSansCondensed-Bold.ttf
var DejaVuSansBold []byte
