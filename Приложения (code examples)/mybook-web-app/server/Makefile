# Запуск контейнеров
up:
	docker-compose up -d
prod:
	docker-compose -f docker-compose.prod.yml up -d

# Остановка контейнеров
down:
	docker-compose down

# Статус контейнеров
ps:
	docker-compose ps

# Подключение к PostgreSQL
db:
	docker exec -it thebook-postgres psql -U thebook_user -d thebook

# Сборка образов
build:
	docker-compose build

# Перезапуск всех контейнеров
restart:
	docker-compose restart

# === Server команды ===

# Зайти в контейнер server (sh, т.к. Alpine без bash)
sh:
	docker exec -it thebook-server sh

# Перезапуск только server
rs:
	docker-compose restart server

# Посмотреть env переменные server
env:
	docker exec thebook-server env

# Пересобрать и перезапустить server
rebuild:
	docker-compose up -d --build server

# Логи
logs:
	docker-compose logs -f server
