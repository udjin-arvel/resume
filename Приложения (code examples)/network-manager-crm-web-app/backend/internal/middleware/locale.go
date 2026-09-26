package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
)

const ContextLocaleKey = "locale"

func Locale() gin.HandlerFunc {
	return func(c *gin.Context) {
		locale := "ru"
		if v, ok := c.Get(ContextLocaleKey); ok {
			if s, ok := v.(string); ok && s != "" {
				locale = s
				c.Next()
				return
			}
		}
		accept := c.GetHeader("Accept-Language")
		if accept != "" {
			parts := strings.Split(accept, ",")
			if len(parts) > 0 {
				lang := strings.TrimSpace(strings.Split(parts[0], ";")[0])
				lower := strings.ToLower(lang)
				switch {
				case strings.HasPrefix(lower, "pt"):
					locale = "pt"
				case strings.HasPrefix(lower, "en"):
					locale = "en"
				case strings.HasPrefix(lower, "ru"):
					locale = "ru"
				}
			}
		}
		c.Set(ContextLocaleKey, locale)
		c.Next()
	}
}

func GetLocale(c *gin.Context) string {
	if v, ok := c.Get(ContextLocaleKey); ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return "ru"
}
