package i18n

import (
	"embed"
	"encoding/json"
	"strings"
	"sync"
)

//go:embed ru.json en.json pt.json
var localeFS embed.FS

var (
	mu       sync.RWMutex
	messages = map[string]map[string]string{}
)

func init() {
	_ = Load()
}

func Load() error {
	mu.Lock()
	defer mu.Unlock()
	for _, loc := range []string{"ru", "en", "pt"} {
		data, err := localeFS.ReadFile(loc + ".json")
		if err != nil {
			return err
		}
		var m map[string]string
		if err := json.Unmarshal(data, &m); err != nil {
			return err
		}
		messages[loc] = m
	}
	return nil
}

func NormalizeLocale(locale string) string {
	locale = strings.ToLower(strings.TrimSpace(locale))
	switch {
	case strings.HasPrefix(locale, "pt"):
		return "pt"
	case strings.HasPrefix(locale, "en"):
		return "en"
	case strings.HasPrefix(locale, "ru"):
		return "ru"
	default:
		return "ru"
	}
}

func T(locale, key string, params map[string]string) string {
	mu.RLock()
	defer mu.RUnlock()
	loc := NormalizeLocale(locale)
	text, ok := messages[loc][key]
	if !ok {
		text, ok = messages["en"][key]
	}
	if !ok {
		text = messages["ru"][key]
	}
	if text == "" {
		return key
	}
	for k, v := range params {
		text = strings.ReplaceAll(text, "{{"+k+"}}", v)
	}
	return text
}
