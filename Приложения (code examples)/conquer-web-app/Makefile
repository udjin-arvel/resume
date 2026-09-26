COMPOSE ?= docker compose

.PHONY: help up up-d build down stop restart logs logs-web logs-worker ps shell-web shell-db migrate migrate-history

help:
	@echo "Conquer Docker targets:"
	@echo "  make up             - build and start (foreground)"
	@echo "  make up-d           - build and start (detached)"
	@echo "  make build          - build images"
	@echo "  make down           - stop and remove containers"
	@echo "  make stop           - stop containers"
	@echo "  make restart        - restart web + worker"
	@echo "  make logs           - follow all logs"
	@echo "  make logs-web       - follow web logs"
	@echo "  make logs-worker    - follow worker logs"
	@echo "  make ps             - list services"
	@echo "  make shell-web      - shell into web"
	@echo "  make shell-db       - psql into db"
	@echo "  make migrate        - alembic upgrade head (web)"
	@echo "  make migrate-history - alembic history (web)"

up:
	$(COMPOSE) up -d

build:
	$(COMPOSE) build

down:
	$(COMPOSE) down

stop:
	$(COMPOSE) stop

restart:
	$(COMPOSE) restart web worker

logs:
	$(COMPOSE) logs -f

logs-web:
	$(COMPOSE) logs -f web

logs-worker:
	$(COMPOSE) logs -f worker

ps:
	$(COMPOSE) ps

shell-web:
	$(COMPOSE) exec web sh

shell-db:
	$(COMPOSE) exec db psql -U conquer -d conquer

migrate:
	$(COMPOSE) exec web alembic upgrade head

migrate-history:
	$(COMPOSE) exec web alembic history
