package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/radar-crm/backend/internal/models"
	"github.com/radar-crm/backend/internal/models/dto"
	"github.com/radar-crm/backend/internal/repositories"
)

func RequireNotBlocked(users *repositories.UserRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		role := Role(c)
		if role == string(models.UserRoleManager) {
			c.Next()
			return
		}

		userID := UserID(c)
		if userID == "" {
			c.Next()
			return
		}

		user, err := users.FindByID(c.Request.Context(), userID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, dto.ErrorResponse{Error: "unauthorized"})
			return
		}
		if user.Status == models.UserStatusBlocked {
			c.AbortWithStatusJSON(http.StatusForbidden, dto.ErrorResponse{
				Error: "account is blocked",
			})
			return
		}
		c.Next()
	}
}
