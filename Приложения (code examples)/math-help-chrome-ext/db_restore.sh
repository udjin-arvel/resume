
#!/bin/bash

# Переменные
DB_CONTAINER="math-help-api-pg"  # Имя контейнера
DB_NAME="math-help-db"           # Название базы данных с дефисом
DB_USER="postgres"
BACKUP_DIR="/root/server/math-help-ai-v2/db_backups"
LATEST_BACKUP="${BACKUP_DIR}/latest.sql"

# Проверка наличия последнего бэкапа
if [ ! -f "$LATEST_BACKUP" ]; then
    echo "Ошибка: Файл бэкапа $LATEST_BACKUP не найден!"
    exit 1
fi

# Проверяем, запущен ли контейнер
if ! docker ps -q -f name=$DB_CONTAINER | grep -q .; then
    echo "Контейнер $DB_CONTAINER не запущен. Запускаем..."
    docker start $DB_CONTAINER
    sleep 5  # Ждём, чтобы база успела запуститься
fi

# Проверяем, существует ли база данных
DB_EXISTS=$(docker exec -i $DB_CONTAINER psql -U $DB_USER -tAc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME';")
if [ "$DB_EXISTS" == "1" ]; then
    echo "База данных $DB_NAME уже существует. Удаляем её перед восстановлением..."
    docker exec -i $DB_CONTAINER psql -U $DB_USER -c "DROP DATABASE \"$DB_NAME\";"
fi

# Создаём новую пустую базу с указанием template1
echo "Создаём новую базу данных $DB_NAME..."
docker exec -i $DB_CONTAINER psql -U $DB_USER -c "CREATE DATABASE \"$DB_NAME\" WITH OWNER \"$DB_USER\" TEMPLATE template1;"

# Восстанавливаем бэкап
echo "Развёртываем бэкап из $LATEST_BACKUP..."
cat "$LATEST_BACKUP" | docker exec -i $DB_CONTAINER psql -U $DB_USER -d "$DB_NAME"

echo "Восстановление базы данных $DB_NAME завершено."
