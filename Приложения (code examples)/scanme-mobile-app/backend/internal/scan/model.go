package scan

import (
	"encoding/json"
	"time"
)

type ProductSnapshot struct {
	Barcode       string    `json:"barcode"`
	Name          string    `json:"name"`
	Brands        string    `json:"brands,omitempty"`
	ImageURL      string    `json:"imageUrl,omitempty"`
	Source        string    `json:"source,omitempty"`
	OverallDanger string    `json:"overallDanger,omitempty"`
	FetchedAt     time.Time `json:"fetchedAt,omitempty"`
}

type Scan struct {
	ID              string          `json:"id"`
	Barcode         string          `json:"barcode"`
	ProductSnapshot ProductSnapshot `json:"productSnapshot"`
	ScannedAt       time.Time       `json:"scannedAt"`
	ClientTS        *time.Time      `json:"clientTs,omitempty"`
}

type CreateScanRequest struct {
	Barcode         string          `json:"barcode"`
	ProductSnapshot ProductSnapshot `json:"productSnapshot"`
	ClientTS        *time.Time      `json:"clientTs,omitempty"`
}

type ListResponse struct {
	Items      []Scan `json:"items"`
	NextCursor string `json:"nextCursor,omitempty"`
}

func snapshotFromJSON(data []byte) (ProductSnapshot, error) {
	if len(data) == 0 {
		return ProductSnapshot{}, nil
	}

	var snapshot ProductSnapshot
	if err := json.Unmarshal(data, &snapshot); err != nil {
		return ProductSnapshot{}, err
	}
	return snapshot, nil
}
