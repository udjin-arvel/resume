#!/bin/bash
# Скрипт для удаления бэкапов старше 2 месяцев

path=/root/server/math-help-ai-v2/db_backups

# Удаляем файлы старше 60 дней (2 месяцев)
find "$path" -name "*.sql" -type f -mtime +60 -delete

# Убедимся, что latest.sql не удаляется
if [ -f "${path}/latest.sql" ]; then
    touch "${path}/latest.sql"  # Обновляем время модификации
fi

echo "$(date): Удалены бэкапы старше 2 месяцев"