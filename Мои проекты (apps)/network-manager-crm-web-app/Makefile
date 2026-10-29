.PHONY: help \
	dev-up dev-down dev-ps dev-logs \
	prod-db-up prod-db-down prod-db-ps prod-db-logs \
	prod-migrate-up prod-migrate-down prod-seed \
	prod-build-api prod-build-web prod-build \
	prod-restart prod-deploy prod-first-deploy \
	prod-status prod-health prod-nginx-install prod-disable-web \
	install-migrate

# Production server IP (override: make prod-deploy SERVER_IP=x.x.x.x)
SERVER_IP ?= 80.90.182.68
APP_URL ?= http://$(SERVER_IP)

# Env files: on server prefer /etc/radar-crm/*.env, locally fall back to .env
ifeq (,$(ENV_FILE))
  ifneq (,$(wildcard /etc/radar-crm/backend.env))
    ENV_FILE := /etc/radar-crm/backend.env
  else ifneq (,$(wildcard .env))
    ENV_FILE := .env
  endif
endif

ifeq (,$(CLIENT_ENV_FILE))
  ifneq (,$(wildcard /etc/radar-crm/client.env))
    CLIENT_ENV_FILE := /etc/radar-crm/client.env
  else ifneq (,$(wildcard client/.env))
    CLIENT_ENV_FILE := client/.env
  endif
endif

COMPOSE_DEV  := docker compose
ifneq (,$(ENV_FILE))
COMPOSE_PROD := docker compose -f docker-compose.prod.yml --env-file $(ENV_FILE)
else
COMPOSE_PROD := docker compose -f docker-compose.prod.yml
endif

GO_BUILD_FLAGS ?= -buildvcs=false

ifeq ($(OS),Windows_NT)
MIGRATE ?= $(shell go env GOPATH)/bin/migrate.exe
SHELL := powershell.exe
else
MIGRATE ?= $(shell go env GOPATH 2>/dev/null)/bin/migrate
endif

help:
	@echo "radar-crm — команды развёртывания"
	@echo ""
	@echo "Локальная разработка:"
	@echo "  make dev-up          PostgreSQL + API (docker-compose.yml)"
	@echo "  make dev-down        Остановить dev-окружение"
	@echo "  make dev-ps          Статус dev-контейнеров"
	@echo "  make dev-logs        Логи API"
	@echo ""
	@echo "Production (сервер, IP $(SERVER_IP)):"
	@echo "  make prod-db-up      Запустить PostgreSQL (docker-compose.prod.yml)"
	@echo "  make prod-db-down    Остановить PostgreSQL"
	@echo "  make prod-db-ps      Статус PostgreSQL"
	@echo "  make prod-migrate-up Применить миграции"
	@echo "  make prod-seed       Создать admin-пользователя"
	@echo "  make prod-build      Собрать API + фронтенд"
	@echo "  make prod-deploy     migrate + build + restart systemd"
	@echo "  make prod-first-deploy db + migrate + seed + build + restart"
	@echo "  make prod-restart    Перезапустить radar-crm-api"
	@echo "  make prod-disable-web  Отключить устаревший radar-crm-web (SSR)"
	@echo "  make prod-nginx-install  Установить nginx-конфиг"
	@echo "  make prod-health     Проверить /health"
	@echo ""
	@echo "Переменные:"
	@echo "  ENV_FILE=$(ENV_FILE)"
	@echo "  CLIENT_ENV_FILE=$(CLIENT_ENV_FILE)"
	@echo "  SERVER_IP=$(SERVER_IP)"

# --- Dev ---

dev-up:
	$(COMPOSE_DEV) up -d

dev-down:
	$(COMPOSE_DEV) down

dev-ps:
	$(COMPOSE_DEV) ps

dev-logs:
	$(COMPOSE_DEV) logs -f api

# --- Production DB ---

prod-db-up:
ifndef ENV_FILE
	$(error ENV_FILE not set. Create /etc/radar-crm/backend.env or .env)
endif
	$(COMPOSE_PROD) up -d
	$(COMPOSE_PROD) ps

prod-db-down:
	$(COMPOSE_PROD) down

prod-db-ps:
	$(COMPOSE_PROD) ps

prod-db-logs:
	$(COMPOSE_PROD) logs -f postgres

# --- Migrations & seed ---

install-migrate:
	go install -tags "postgres" github.com/golang-migrate/migrate/v4/cmd/migrate@latest

prod-migrate-up:
ifndef ENV_FILE
	$(error ENV_FILE not set)
endif
	@bash -c 'set -a && . "$(ENV_FILE)" && set +a && "$(MIGRATE)" -path backend/migrations -database "$$DATABASE_URL" up'

prod-migrate-down:
ifndef ENV_FILE
	$(error ENV_FILE not set)
endif
	@bash -c 'set -a && . "$(ENV_FILE)" && set +a && "$(MIGRATE)" -path backend/migrations -database "$$DATABASE_URL" down 1'

prod-seed:
ifndef ENV_FILE
	$(error ENV_FILE not set)
endif
	@bash -c 'set -a && . "$(ENV_FILE)" && set +a && cd backend && go run ./cmd/seed'

# --- Build ---

prod-build-api:
	cd backend && go build $(GO_BUILD_FLAGS) -o bin/server ./cmd/server

prod-build-web:
ifndef CLIENT_ENV_FILE
	$(error CLIENT_ENV_FILE not set. Create /etc/radar-crm/client.env or client/.env)
endif
	@bash -c 'set -a && . "$(CLIENT_ENV_FILE)" && set +a && cd client && npm ci && npm run build'

prod-build: prod-build-api prod-build-web

# --- Deploy on server (systemd) ---

prod-restart:
	systemctl restart radar-crm-api
	systemctl status radar-crm-api --no-pager

prod-disable-web:
	systemctl disable --now radar-crm-web || true

prod-deploy: prod-migrate-up prod-build prod-restart

prod-first-deploy: prod-db-up prod-migrate-up prod-seed prod-build prod-restart

prod-status:
	$(COMPOSE_PROD) ps
	systemctl status radar-crm-api nginx --no-pager

prod-health:
	@echo "=== local API ==="
	@curl -sf http://127.0.0.1:8080/health && echo || echo "API: FAIL"
	@echo "=== static SPA ==="
	@curl -sfI $(APP_URL)/ | head -1 || echo "SPA: FAIL"
	@echo "=== public health ($(APP_URL)) ==="
	@curl -sf $(APP_URL)/health && echo || echo "PUBLIC HEALTH: FAIL"

prod-nginx-install:
	cp deploy/nginx/radar-crm.conf /etc/nginx/sites-available/radar-crm
	ln -sf /etc/nginx/sites-available/radar-crm /etc/nginx/sites-enabled/radar-crm
	rm -f /etc/nginx/sites-enabled/default
	nginx -t
	systemctl reload nginx
	@echo "nginx configured for $(SERVER_IP)"
