package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"

	adminauth "scanme/backend/internal/admin/auth"
	"scanme/backend/internal/auth"
	"scanme/backend/internal/config"
	platformpostgres "scanme/backend/internal/platform/postgres"
)

func main() {
	ctx := context.Background()

	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	email := strings.TrimSpace(os.Getenv("ADMIN_EMAIL"))
	password := os.Getenv("ADMIN_PASSWORD")
	if email == "" || password == "" {
		log.Fatal("ADMIN_EMAIL and ADMIN_PASSWORD are required")
	}

	db, err := platformpostgres.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	service := adminauth.NewService(
		adminauth.NewRepository(db),
		auth.NewTokenService(cfg.JWTSecret),
		cfg.AdminAccessTokenTTL,
		cfg.AdminPasswordPepper,
	)

	if err := service.EnsureInitialAdmin(ctx, email, password); err != nil {
		log.Fatal(err)
	}

	fmt.Printf("admin user %s ensured\n", email)
}
