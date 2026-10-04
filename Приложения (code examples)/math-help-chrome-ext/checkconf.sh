#!/bin/bash

echo "🔍 Проверка состояния docker-контейнеров..."
docker ps --format "table {{.Names}}	{{.Image}}	{{.Ports}}"

echo -e "\n📦 Проверка портов, слушаемых на хосте..."
sudo lsof -iTCP -sTCP:LISTEN -Pn | grep -E ":80|:443"

echo -e "\n🌐 Проверка DNS-записи для example.com..."
dig +short example.com

echo -e "\n🔥 Статус UFW (если используется)..."
sudo ufw status numbered

echo -e "\n🧱 iptables (только строки с 80 и 443)..."
sudo iptables -L -n -v | grep -E "dpt:80|dpt:443"

echo -e "\n📄 Проверка логов nginx-proxy..."
docker logs nginx-proxy --tail=40

echo -e "\n🧾 Проверка NGINX-конфигов (внутри контейнера)..."
docker exec nginx-proxy ls -l /etc/nginx/conf.d/

echo -e "\n✅ Готово. Проверь вывод выше на ошибки и предупреждения."
