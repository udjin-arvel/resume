COMPOSE=docker compose
DB_URL=postgres://scanme:scanme@localhost:5432/scanme?sslmode=disable
SERVICE=postgres

.PHONY: env up down restart ps logs shell db redis migrate-up migrate-down migrate-status

env:
	@if not exist backend\.env copy backend\.env.example backend\.env

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

restart:
	$(COMPOSE) restart

ps:
	$(COMPOSE) ps

logs:
	$(COMPOSE) logs -f

shell:
	$(COMPOSE) exec $(SERVICE) sh

db:
	$(COMPOSE) exec postgres psql -U scanme -d scanme

redis:
	$(COMPOSE) exec redis redis-cli

migrate-up:
	cd backend && goose -dir migrations postgres "$(DB_URL)" up

migrate-down:
	cd backend && goose -dir migrations postgres "$(DB_URL)" down

migrate-status:
	cd backend && goose -dir migrations postgres "$(DB_URL)" status
