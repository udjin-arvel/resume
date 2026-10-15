package product

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestOFFClientFetchProductNormalizesIngredients(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/v2/product/4601234567890.json" {
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}

		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"status": 1,
			"product": {
				"code": "4601234567890",
				"product_name": "Test Yogurt",
				"brands": "ScanMe",
				"image_front_url": "https://images.example/yogurt.jpg",
				"ingredients": [
					{"id": "en:milk", "text": "Milk", "rank": 1, "percent_estimate": 70},
					{"id": "en:sugar", "text": "Sugar", "rank": 2, "percent_estimate": 12.5}
				]
			}
		}`))
	}))
	defer server.Close()

	client := NewOFFClient(server.URL, time.Second)
	product, raw, err := client.FetchProduct(context.Background(), "4601234567890", 30*24*time.Hour)
	if err != nil {
		t.Fatalf("FetchProduct returned error: %v", err)
	}

	if product.Barcode != "4601234567890" {
		t.Fatalf("unexpected barcode: %s", product.Barcode)
	}
	if product.Name != "Test Yogurt" || product.Brands != "ScanMe" {
		t.Fatalf("unexpected product identity: %#v", product)
	}
	if len(product.Ingredients) != 2 {
		t.Fatalf("expected 2 ingredients, got %d", len(product.Ingredients))
	}
	if product.Ingredients[0].ID != "milk" || product.Ingredients[0].Percent != "70%" {
		t.Fatalf("unexpected first ingredient: %#v", product.Ingredients[0])
	}
	if len(raw) == 0 {
		t.Fatal("expected raw OFF json to be stored")
	}
}

func TestOFFClientFetchProductNotFound(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status": 0}`))
	}))
	defer server.Close()

	client := NewOFFClient(server.URL, time.Second)
	_, _, err := client.FetchProduct(context.Background(), "missing", 30*24*time.Hour)
	if !errors.Is(err, ErrProductNotFound) {
		t.Fatalf("expected ErrProductNotFound, got %v", err)
	}
}
