package telegram

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"
)

const maxAuthAge = 24 * time.Hour

type UserData struct {
	ID        int64  `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Username  string `json:"username"`
}

func ValidateInitData(initData, botToken string) (*UserData, error) {
	if initData == "" {
		return nil, fmt.Errorf("initData is empty")
	}
	if botToken == "" {
		return nil, fmt.Errorf("bot token is not configured")
	}

	values, err := url.ParseQuery(initData)
	if err != nil {
		return nil, fmt.Errorf("parse initData: %w", err)
	}

	receivedHash := values.Get("hash")
	if receivedHash == "" {
		return nil, fmt.Errorf("hash is missing")
	}
	values.Del("hash")

	var pairs []string
	for key := range values {
		pairs = append(pairs, key+"="+values.Get(key))
	}
	sort.Strings(pairs)
	dataCheckString := strings.Join(pairs, "\n")

	secretKey := hmacSHA256([]byte("WebAppData"), []byte(botToken))
	calculatedHash := hex.EncodeToString(hmacSHA256(secretKey, []byte(dataCheckString)))

	if !hmac.Equal([]byte(calculatedHash), []byte(receivedHash)) {
		return nil, fmt.Errorf("invalid hash")
	}

	authDateStr := values.Get("auth_date")
	if authDateStr == "" {
		return nil, fmt.Errorf("auth_date is missing")
	}
	authDate, err := strconv.ParseInt(authDateStr, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid auth_date: %w", err)
	}
	if time.Since(time.Unix(authDate, 0)) > maxAuthAge {
		return nil, fmt.Errorf("initData expired")
	}

	userJSON := values.Get("user")
	if userJSON == "" {
		return nil, fmt.Errorf("user is missing")
	}

	var user UserData
	if err := json.Unmarshal([]byte(userJSON), &user); err != nil {
		return nil, fmt.Errorf("parse user: %w", err)
	}
	if user.ID == 0 {
		return nil, fmt.Errorf("user id is missing")
	}

	return &user, nil
}

func hmacSHA256(key, data []byte) []byte {
	mac := hmac.New(sha256.New, key)
	mac.Write(data)
	return mac.Sum(nil)
}
