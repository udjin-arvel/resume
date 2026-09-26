package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/radar-crm/backend/internal/auth"
	"github.com/radar-crm/backend/internal/models/dto"
)

const (
	ContextUserIDKey = "userID"
	ContextRoleKey   = "role"
)

func JWT(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" || !strings.HasPrefix(header, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, dto.ErrorResponse{Error: "missing or invalid authorization header"})
			return
		}

		token := strings.TrimSpace(strings.TrimPrefix(header, "Bearer "))
		claims, err := auth.ParseToken(token, secret)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, dto.ErrorResponse{Error: "invalid or expired token"})
			return
		}

		c.Set(ContextUserIDKey, claims.UserID)
		c.Set(ContextRoleKey, claims.Role)
		c.Next()
	}
}

func RequireRole(roles ...string) gin.HandlerFunc {
	allowed := make(map[string]struct{}, len(roles))
	for _, role := range roles {
		allowed[role] = struct{}{}
	}

	return func(c *gin.Context) {
		role, ok := c.Get(ContextRoleKey)
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, dto.ErrorResponse{Error: "forbidden"})
			return
		}
		roleStr, ok := role.(string)
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, dto.ErrorResponse{Error: "forbidden"})
			return
		}
		if _, ok := allowed[roleStr]; !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, dto.ErrorResponse{Error: "forbidden"})
			return
		}
		c.Next()
	}
}

func UserID(c *gin.Context) string {
	if v, ok := c.Get(ContextUserIDKey); ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}

func Role(c *gin.Context) string {
	if v, ok := c.Get(ContextRoleKey); ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}
