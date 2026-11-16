.DEFAULT_GOAL := help
SHELL := /bin/sh

COMPOSE  ?= docker compose
HTTP_PORT ?= $(shell grep -s '^HTTP_PORT=' .env | cut -d= -f2)
URL      ?= http://localhost:$(or $(HTTP_PORT),8080)
GO_IMAGE ?= golang:1.22-alpine

.PHONY: help up down restart logs ps frontend fmt test lint testdata smoke clean env

help: ## список команд
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

env: ## создать .env из .env.example (если нет)
	@test -f .env || cp .env.example .env

up: env ## поднять всё (сборка образов) → $(URL)
	$(COMPOSE) up --build -d
	@echo "→ $(URL)"

down: ## остановить
	$(COMPOSE) down

restart: ## пересобрать и перезапустить
	$(COMPOSE) up --build -d --force-recreate

logs: ## логи backend
	$(COMPOSE) logs -f backend

ps: ## статус контейнеров
	$(COMPOSE) ps

frontend: ## собрать SPA локально (client/)
	cd client && if command -v bun >/dev/null; then bun install && bun run build; else npm install && npm run build; fi

fmt: ## gofmt
	cd backend && gofmt -w .

# Go-таргеты используют локальный Go, а без него — контейнер golang:1.22-alpine.
GO_RUN = if command -v go >/dev/null; then cd backend && $(1); else \
	docker run --rm -v "$(CURDIR)/backend:/src" -w /src $(GO_IMAGE) sh -c "apk add -q --no-cache ffmpeg >/dev/null 2>&1; $(1)"; fi

test: ## go test (интеграционный тест — если есть ffmpeg и testdata/)
	$(call GO_RUN,go test -count=1 ./...)

lint: ## go vet
	$(call GO_RUN,go vet ./...)

testdata: ## сгенерировать backend/testdata/sample.mov (2 c, MJPEG+PCM)
	mkdir -p backend/testdata
	ffmpeg -hide_banner -loglevel error -y \
	  -f lavfi -i testsrc2=size=320x240:rate=25:duration=2 \
	  -f lavfi -i sine=frequency=440:duration=2 \
	  -c:v mjpeg -q:v 5 -c:a pcm_s16le -shortest backend/testdata/sample.mov

smoke: ## e2e-проверка поднятого стека через curl
	URL=$(URL) sh ./scripts/smoke.sh

clean: ## остановить и удалить volume с медиа
	$(COMPOSE) down -v
