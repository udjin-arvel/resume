.PHONY: up down env ps logs db dev build test lint migrate-up migrate-down swagger seed

ifneq (,$(wildcard .env))
include .env
export
endif

POSTGRES_USER ?= crm
POSTGRES_DB ?= crm

ifeq ($(OS),Windows_NT)
MIGRATE ?= $(shell go env GOPATH)/bin/migrate.exe
else
MIGRATE ?= $(shell go env GOPATH)/bin/migrate
endif

up:
	docker compose up -d

down:
	docker compose down

env:
	docker exec radar-crm-api env

ps:
	docker compose ps

logs:
	docker compose logs -f api

db:
	docker exec -it radar-crm-postgres psql -U "$(POSTGRES_USER)" -d "$(POSTGRES_DB)"

dev:
	air

build:
	go build -buildvcs=false -o bin/server ./cmd/server

test:
	go test ./...

lint:
	golangci-lint run ./...

migrate-up:
	"$(MIGRATE)" -path migrations -database "$(DATABASE_URL)" up

migrate-down:
	"$(MIGRATE)" -path migrations -database "$(DATABASE_URL)" down 1

swagger:
	swag init -g cmd/server/main.go -o docs

seed:
	go run ./cmd/seed
