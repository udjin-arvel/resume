DB_URL=postgres://scanme:scanme@localhost:5432/scanme?sslmode=disable

.PHONY: run dev test lint tidy fmt check migrate-up migrate-down migrate-status migrate-reset create-admin health ready

run:
	go run ./cmd/api

dev: run

test:
	go test ./...

lint:
	go vet ./...

tidy:
	go mod tidy

fmt:
	gofmt -w cmd internal scripts

check: fmt tidy lint test

migrate-up:
	goose -dir migrations postgres "$(DB_URL)" up

migrate-down:
	goose -dir migrations postgres "$(DB_URL)" down

migrate-status:
	goose -dir migrations postgres "$(DB_URL)" status

migrate-reset:
	goose -dir migrations postgres "$(DB_URL)" reset

create-admin:
	go run ./scripts/create_admin.go

health:
	powershell -NoProfile -Command "Invoke-RestMethod http://localhost:8080/healthz | ConvertTo-Json -Compress"

ready:
	powershell -NoProfile -Command "Invoke-RestMethod http://localhost:8080/readyz | ConvertTo-Json -Compress"
