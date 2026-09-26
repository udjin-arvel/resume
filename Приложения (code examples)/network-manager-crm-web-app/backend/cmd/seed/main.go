package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
	"github.com/radar-crm/backend/internal/database"
	"github.com/radar-crm/backend/internal/models"
	"github.com/radar-crm/backend/internal/repositories"
	"github.com/radar-crm/backend/internal/services"
)

func main() {
	_ = godotenv.Load()

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	email := getEnv("SEED_ADMIN_EMAIL", "admin@example.com")
	password := getEnv("SEED_ADMIN_PASSWORD", "admin12345")

	ctx := context.Background()
	pool, err := database.Connect(ctx, databaseURL)
	if err != nil {
		log.Fatalf("connect database: %v", err)
	}
	defer database.Close(pool)

	users := repositories.NewUserRepository(pool)
	exists, err := users.EmailExists(ctx, email)
	if err != nil {
		log.Fatalf("check email: %v", err)
	}
	if exists {
		fmt.Printf("admin user %s already exists\n", email)
		return
	}

	hash, err := services.HashPassword(password)
	if err != nil {
		log.Fatalf("hash password: %v", err)
	}

	user := &models.User{
		Role:         models.UserRoleManager,
		Status:       models.UserStatusActive,
		FirstName:    "Admin",
		LastName:     "User",
		Email:        strings.TrimSpace(email),
		PasswordHash: hash,
		Language:     "ru",
	}
	if err := users.Create(ctx, user); err != nil {
		log.Fatalf("create admin: %v", err)
	}

	fmt.Printf("seeded admin user %s (id=%s)\n", email, user.ID)
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
