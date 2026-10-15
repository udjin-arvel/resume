package telegram

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"
)

type Sender struct {
	token  string
	appURL string
	client *http.Client
}

func NewSender(token, appURL string) *Sender {
	return &Sender{
		token:  token,
		appURL: strings.TrimRight(appURL, "/"),
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

func (s *Sender) SendMessage(ctx context.Context, telegramID int64, text, link string) error {
	if s.token == "" || telegramID == 0 {
		slog.Debug("telegram send skipped", "reason", "no token or chat id")
		return nil
	}

	payload := map[string]any{
		"chat_id": telegramID,
		"text":    text,
	}
	if link != "" {
		url := s.appURL + link
		payload["reply_markup"] = map[string]any{
			"inline_keyboard": [][]map[string]string{
				{{"text": "Open", "url": url}},
			},
		}
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", s.token),
		bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("telegram api %d: %s", resp.StatusCode, string(b))
	}
	return nil
}
