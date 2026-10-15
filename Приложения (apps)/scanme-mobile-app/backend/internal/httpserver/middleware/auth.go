package middleware

import (
	"context"
	"net/http"
	"strings"

	"scanme/backend/internal/auth"
	"scanme/backend/internal/httpserver/response"
)

type contextKey string

const (
	userIDKey contextKey = "userID"
	roleKey   contextKey = "role"
)

func RequireUser(tokens auth.TokenService) func(http.Handler) http.Handler {
	return requireRole(tokens, "user")
}

func RequireAdmin(tokens auth.TokenService) func(http.Handler) http.Handler {
	return requireRole(tokens, "admin")
}

func UserID(ctx context.Context) string {
	value, _ := ctx.Value(userIDKey).(string)
	return value
}

func Role(ctx context.Context) string {
	value, _ := ctx.Value(roleKey).(string)
	return value
}

func requireRole(tokens auth.TokenService, role string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			tokenString := strings.TrimPrefix(header, "Bearer ")
			if tokenString == header || tokenString == "" {
				response.ErrorJSON(w, http.StatusUnauthorized, "UNAUTHORIZED", "bearer token is required")
				return
			}

			claims, err := tokens.Parse(tokenString)
			if err != nil || claims.Role != role {
				response.ErrorJSON(w, http.StatusUnauthorized, "UNAUTHORIZED", "invalid token")
				return
			}

			ctx := context.WithValue(r.Context(), userIDKey, claims.Subject)
			ctx = context.WithValue(ctx, roleKey, claims.Role)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
