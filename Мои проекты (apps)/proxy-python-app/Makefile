.PHONY: up down logs ps db shell build restart logs-dashboard prod prod-log

# Параметры SSH-туннеля к prod OpenSearch Dashboards (переопределяются в .env)
SSH_DASHBOARD_USER ?= root
SSH_DASHBOARD_HOST ?= 72.56.72.97

# Подхватить переменные из .env (SSH_DASHBOARD_PASSWORD и при необходимости USER/HOST)
-include .env

# Запуск контейнеров
up:
	docker-compose up -d

down:
	docker-compose down

prod:
	docker-compose -f docker-compose.prod.yml up -d

# Стек логирования (OpenSearch, Dashboards, Fluent Bit) — см. docker-compose.log.yml
prod-log-up:
	docker-compose -f docker-compose.log.yml up -d

prod-log-down:
	docker-compose -f docker-compose.log.yml down


# Просмотр логов
logs:
	docker-compose logs -f

# Статус контейнеров
ps:
	docker-compose ps

# Сборка образов
build:
	docker-compose build

# Перезапуск
restart:
	docker-compose restart

# Войти в контейнер
shell:
	docker-compose exec radar-art-proxy bash

# Просмотр переменных окружения
env:
	docker exec radar-art-proxy env

# SSH-туннель: локально http://localhost:5601 → OpenSearch Dashboards на сервере (prod слушает 127.0.0.1:5601).
# Требуется: ssh, sshpass; в .env задайте SSH_DASHBOARD_PASSWORD (см. .env.example).
# Через ~2 с пытается открыть браузер (python -m webbrowser; нужен Python в PATH).
logs-dashboard:
	@command -v sshpass >/dev/null 2>&1 || { echo "Установите sshpass (apt: sshpass, brew: sshpass, choco: sshpass)."; exit 1; }
	@test -n "$(SSH_DASHBOARD_PASSWORD)" || { echo "Задайте SSH_DASHBOARD_PASSWORD в файле .env"; exit 1; }
	@(sleep 2; python -m webbrowser -t "http://localhost:5601/app/data-explorer/discover" 2>/dev/null || py -m webbrowser -t "http://localhost:5601" 2>/dev/null || true) & \
	SSHPASS="$(SSH_DASHBOARD_PASSWORD)" sshpass -e ssh -N -o StrictHostKeyChecking=accept-new -L 5601:127.0.0.1:5601 $(SSH_DASHBOARD_USER)@$(SSH_DASHBOARD_HOST)
