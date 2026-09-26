# Docker Setup для RadarArt-Proxy

Этот документ описывает, как запустить RadarArt-Proxy в Docker контейнере, а также как запускать его вручную.

## Предварительные требования

- Docker и Docker Compose установлены
- Файл `.env` настроен с необходимыми переменными окружения

## Запуск в Docker

### Быстрый старт

```bash
# Сборка и запуск контейнера
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

### Детальные команды

```bash
# Сборка образа
docker-compose build

# Запуск в фоновом режиме
docker-compose up -d

# Запуск с выводом логов в консоль
docker-compose up

# Перезапуск контейнера
docker-compose restart

# Остановка контейнера
docker-compose stop

# Остановка и удаление контейнера
docker-compose down

# Просмотр статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f radar-proxy

# Выполнение команды внутри контейнера
docker-compose exec radar-proxy bash
```

## Ручной запуск (без Docker)

Если вы хотите запустить приложение вручную без Docker:

```bash
# Установка зависимостей
pip install -r requirements.txt

# Запуск приложения
python main.py
```

Или с использованием uvicorn напрямую:

```bash
uvicorn main:app --host 0.0.0.0 --port 8090
```

## Переменные окружения

Убедитесь, что файл `.env` содержит все необходимые переменные:

- `OPENAI_API_KEY` - API ключ OpenAI
- `RUNWAY_API_KEY` - API ключ Runway
- `KAFKA_BOOTSTRAP_SERVERS` — bootstrap Kafka. В **prod** задаётся в `.env.prod` (например `kafka.example.com:9092`, если брокер на другом сервере). Dev с Kafka на той же машине: `kafka:29092` и сеть `kafka-network` в `docker-compose.yml`.
- `KAFKA_TOPIC_REQUESTS`, `KAFKA_TOPIC_RESULTS`, `KAFKA_TOPIC_DIALOGS` - Kafka topics для текущего окружения (`KAFKA_TOPIC_REQUESTS` и `KAFKA_TOPIC_RESULTS` могут быть списком через запятую: для requests — подписка consumer на все топики; для results — дублирование каждого сообщения во все перечисленные топики)
- `KAFKA_CONSUMER_GROUP_ID` - consumer group proxy для топика requests
- И другие настройки (см. `config.py`)

### Разделение dev/prod

Если `dev` и `prod` используют один и тот же Kafka broker, они не должны делить одни и те же topics.

Рекомендуемая минимальная схема:

- `dev`: `requests-dev`, `results-dev`, `dialogs-dev`
- `prod`: `requests-prod`, `results-prod`, `dialogs-prod`

Если оставить общие topics, одно окружение может перехватывать сообщения другого.

Чтобы один proxy слал результаты и в `results-dev`, и в `results-prod`, задайте `KAFKA_TOPIC_RESULTS=results-dev,results-prod`. Тогда оба backend с соответствующими consumer-ами смогут обработать одну и ту же задачу — следите за дублированием списаний/уведомлений в БД.

## Volumes

Docker Compose монтирует следующие директории:

- `./byteplus_results` - Результаты обработки BytePlus
- `./byteplus_color_results` - Результаты обработки BytePlus Color
- `./temp_images` - Временные изображения
- `./logs` - Логи приложения (если используется)

Эти директории сохраняют данные между перезапусками контейнера.

## Порты

По умолчанию приложение доступно на порту `8090`. Вы можете изменить это в `docker-compose.yml`:

```yaml
ports:
  - "8090:8090"  # Измените первый порт для внешнего доступа
```

## Health Check

Контейнер автоматически проверяет здоровье приложения через endpoint `/health`. Проверить вручную:

```bash
curl http://localhost:8090/health
```

## Отладка

Если контейнер не запускается:

1. Проверьте логи:
   ```bash
   docker-compose logs radar-proxy
   ```

2. Проверьте, что `.env` файл существует и правильно настроен

3. Проверьте, что порт 8090 не занят другим процессом:
   ```bash
   # Linux/Mac
   lsof -i :8090
   
   # Windows
   netstat -ano | findstr :8090
   ```

4. Запустите контейнер в интерактивном режиме для отладки:
   ```bash
   docker-compose run --rm radar-proxy bash
   ```

## Обновление

Для обновления приложения:

```bash
# Остановить контейнер
docker-compose down

# Пересобрать образ
docker-compose build

# Запустить заново
docker-compose up -d
```

## Сеть

Контейнер подключен к сети `radar-network`. Если вам нужно подключить другие сервисы к той же сети, используйте:

```yaml
networks:
  - radar-network
```

## Производительность

Для продакшена рекомендуется:

1. Использовать переменную окружения `DEBUG=False`
2. Настроить ограничения ресурсов в `docker-compose.yml`:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '2'
         memory: 2G
       reservations:
         cpus: '1'
         memory: 1G
   ```

