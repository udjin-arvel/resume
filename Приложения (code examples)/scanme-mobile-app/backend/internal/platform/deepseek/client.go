package deepseek

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/sashabaranov/go-openai"
)

type Config struct {
	APIKey     string
	BaseURL    string
	Model      string
	Timeout    time.Duration
	MaxRetries int
}

type Client struct {
	cfg    Config
	openai *openai.Client
}

func New(cfg Config) (*Client, error) {
	if strings.TrimSpace(cfg.APIKey) == "" {
		return nil, errors.New("deepseek: api key is required")
	}
	if cfg.Timeout <= 0 {
		cfg.Timeout = 90 * time.Second
	}
	if cfg.MaxRetries < 0 {
		cfg.MaxRetries = 0
	}
	base := strings.TrimSpace(cfg.BaseURL)
	if base == "" {
		base = "https://api.deepseek.com/v1"
	}
	// go-openai expects base URL including /v1 for CreateChatCompletion
	if !strings.HasSuffix(base, "/v1") {
		base = strings.TrimSuffix(base, "/") + "/v1"
	}

	c := openai.DefaultConfig(cfg.APIKey)
	c.BaseURL = base

	return &Client{
		cfg:    cfg,
		openai: openai.NewClientWithConfig(c),
	}, nil
}

func (c *Client) Model() string {
	if strings.TrimSpace(c.cfg.Model) == "" {
		return "deepseek-chat"
	}
	return c.cfg.Model
}

// CompleteJSONObject asks for a single JSON object (no markdown). Caller validates schema.
func (c *Client) CompleteJSONObject(ctx context.Context, systemPrompt, userPrompt string) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, c.cfg.Timeout)
	defer cancel()

	model := c.Model()
	var lastErr error
	attempts := 1 + c.cfg.MaxRetries
	for i := 0; i < attempts; i++ {
		resp, err := c.openai.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
			Model: model,
			Messages: []openai.ChatCompletionMessage{
				{Role: openai.ChatMessageRoleSystem, Content: systemPrompt},
				{Role: openai.ChatMessageRoleUser, Content: userPrompt},
			},
			ResponseFormat: &openai.ChatCompletionResponseFormat{
				Type: openai.ChatCompletionResponseFormatTypeJSONObject,
			},
		})
		if err != nil {
			lastErr = err
			continue
		}
		if len(resp.Choices) == 0 {
			lastErr = errors.New("deepseek: empty choices")
			continue
		}
		content := strings.TrimSpace(resp.Choices[0].Message.Content)
		if content == "" {
			lastErr = errors.New("deepseek: empty content")
			continue
		}
		return content, nil
	}
	if lastErr == nil {
		lastErr = errors.New("deepseek: request failed")
	}
	return "", lastErr
}
