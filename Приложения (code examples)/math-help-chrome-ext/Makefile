ENV_FILE=.env.prod
COMPOSE=docker-compose -f compose.yaml --env-file $(ENV_FILE)

.PHONY: up down build restart logs reset build-api logs-api ps db reset

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down --remove-orphans

build:
	$(COMPOSE) build --no-cache

restart: down build up

build-api:
	$(COMPOSE) stop math-help-api
	$(COMPOSE) rm -f math-help-api
	docker rmi -f $$(docker images "*/math-help-api" -q) 2>/dev/null || true
	$(COMPOSE) build --no-cache --pull math-help-api
	$(COMPOSE) up -d math-help-api

logs:
	$(COMPOSE) logs -f
 
logs-api:
	$(COMPOSE) logs -f math-help-api

ps:
	$(COMPOSE) ps

db:
	docker exec -it math-help-api-pg psql -U postgres -d postgres

reset:
	$(COMPOSE) down --remove-orphans
	sudo rm -rf /etc/nginx/vhost.d/*
	sudo rm -rf /etc/nginx/certs/*
	sudo rm -rf /usr/share/nginx/html/*
	$(COMPOSE) up -d --build