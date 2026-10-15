package telegram_test

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/url"
	"sort"
	"strings"
	"testing"
	"time"

	"github.com/radar-crm/backend/internal/telegram"
)

func TestValidateInitData(t *testing.T) {
	botToken := "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
	userJSON := `{"id":42,"first_name":"John","last_name":"Doe"}`
	authDate := time.Now().Unix()

	values := url.Values{}
	values.Set("auth_date", fmt.Sprintf("%d", authDate))
	values.Set("user", userJSON)

	hash := signInitData(values, botToken)
	values.Set("hash", hash)

	user, err := telegram.ValidateInitData(values.Encode(), botToken)
	if err != nil {
		t.Fatalf("validate init data: %v", err)
	}
	if user.ID != 42 {
		t.Fatalf("expected user id 42, got %d", user.ID)
	}
	if user.FirstName != "John" {
		t.Fatalf("expected first name John, got %s", user.FirstName)
	}
}

func TestValidateInitDataInvalidHash(t *testing.T) {
	initData := "auth_date=123&user=%7B%22id%22%3A1%7D&hash=deadbeef"
	if _, err := telegram.ValidateInitData(initData, "token"); err == nil {
		t.Fatal("expected validation error")
	}
}

func TestValidateInitDataExpired(t *testing.T) {
	botToken := "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
	userJSON := `{"id":1,"first_name":"A"}`
	authDate := time.Now().Add(-25 * time.Hour).Unix()

	values := url.Values{}
	values.Set("auth_date", fmt.Sprintf("%d", authDate))
	values.Set("user", userJSON)
	values.Set("hash", signInitData(values, botToken))

	if _, err := telegram.ValidateInitData(values.Encode(), botToken); err == nil {
		t.Fatal("expected expired error")
	}
}

func signInitData(values url.Values, botToken string) string {
	copied := url.Values{}
	for k, v := range values {
		copied[k] = v
	}
	copied.Del("hash")

	var pairs []string
	for key := range copied {
		pairs = append(pairs, key+"="+copied.Get(key))
	}
	sort.Strings(pairs)
	dataCheckString := strings.Join(pairs, "\n")

	secretKey := hmacSHA256([]byte("WebAppData"), []byte(botToken))
	return hex.EncodeToString(hmacSHA256(secretKey, []byte(dataCheckString)))
}

func hmacSHA256(key, data []byte) []byte {
	mac := hmac.New(sha256.New, key)
	mac.Write(data)
	return mac.Sum(nil)
}
