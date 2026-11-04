# FoodSource — развёртывание в production

Документ описывает, как **вынести прототип за пределы локального `docker compose up`**. Текущий репозиторий рассчитан на демо и проверку ТЗ; в prod потребуются доработки из раздела «Обязательные изменения».

## Что есть сейчас (demo-стек)

| Компонент | Как упакован | Назначение |
|-----------|--------------|------------|
| `backend` | Docker, `uvicorn app.main:app` | FastAPI + SQLite на volume `sqlite_data` |
| `frontend` | Docker, `npm run dev` (Vite) | Dev-сервер, не production-сборка |
| БД | SQLite файл `/data/foodsource.db` | Один инстанс, без репликации |

Переменные окружения backend:

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `DATABASE_URL` | `sqlite:///…/foodsource.db` | Строка SQLAlchemy |
| `DATA_DIR` | `/data` | Каталог для SQLite в контейнере |
| `CORS_ORIGINS` | localhost:8080, … | Список origin через запятую |

Frontend в Docker:

| Переменная | Значение в compose | Замечание |
|------------|-------------------|-----------|
| `VITE_API_URL` | `http://localhost:8000` | Подставляется **на этапе сборки** образа (`ARG`). Браузер пользователя ходит на этот URL, не на имя сервиса Docker. |

## Целевая схема prod

```text
[Пользователь]
     │ HTTPS
     ▼
[Reverse proxy: nginx / Traefik / cloud LB]
     ├── /          → статика UI (или SSR-нода)
     └── /api       → backend (FastAPI)
                           │
                           ▼
                     PostgreSQL (рекомендуется)
                     или SQLite только для микро-инсталляций
```

### Backend

1. **Процесс:** `gunicorn` + workers `uvicorn.workers.UvicornWorker` (или несколько реплик за балансировщиком).
2. **БД:** для prod предпочтительнее PostgreSQL; миграции (Alembic) при росте схемы. SQLite допустим только при одном инстансе API и резервном копировании файла.
3. **Секреты:** не хранить в образе; `DATABASE_URL`, `CORS_ORIGINS` — из секрет-хранилища или env платформы.
4. **CORS:** явный список origin прод-домена UI, без `*`, если используются cookies (сейчас cookies нет).
5. **Health:** использовать `GET /health` для readiness/liveness.

Пример запуска без Docker (Linux):

```bash
cd backend
pip install -r requirements.txt gunicorn
export DATABASE_URL="postgresql+psycopg://user:pass@db:5432/foodsource"
export CORS_ORIGINS="https://foodsource.example.com"
gunicorn app.main:app -k uvicorn.workers.UvicornWorker -w 2 -b 0.0.0.0:8000
```

### Frontend

1. **Сборка:** `cd client && VITE_API_URL=https://api.example.com npm run build`.
2. **Раздача:** статические артефакты из `dist`/output Nitro — через nginx или CDN. Dev-сервер Vite **не** использовать в prod.
3. **TanStack Start:** текущий проект завязан на Lovable/Nitro; перед prod нужно зафиксировать target сборки (Node SSR vs static export) и проверить `npm run build` + `npm run preview` в CI.
4. **API URL:** `VITE_API_URL` задаётся **при сборке**; для staging/prod — отдельные pipeline-артефакты или build-args.

### Reverse proxy (пример nginx)

```nginx
server {
    listen 443 ssl;
    server_name foodsource.example.com;

    location / {
        root /var/www/foodsource;
        try_files $uri $uri/ /index.html;
    }
}

server {
    listen 443 ssl;
    server_name api.foodsource.example.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

UI тогда собирают с `VITE_API_URL=https://api.foodsource.example.com`.

## Docker Compose для prod (эскиз)

Отдельный файл, например `docker-compose.prod.yml`:

- `backend`: без `--reload`, healthcheck на `/health`, restart policy `unless-stopped`.
- `frontend`: multi-stage Dockerfile — stage `build` (`npm run build`), stage `nginx:alpine` с копированием статики.
- Volume или managed DB вместо анонимного SQLite на одном хосте.
- Не публиковать порты БД наружу.

Секреты через `.env` (не коммитить) или Docker secrets / оркестратор.

## Обязательные изменения относительно прототипа

- [ ] Production-сборка UI вместо `npm run dev` в контейнере
- [ ] Резервное копирование БД (или managed PostgreSQL)
- [ ] HTTPS на edge
- [ ] Ограничение CORS прод-доменами
- [ ] Мониторинг (логи, метрики, алерты на 5xx)
- [ ] Политика обновления сида (сейчас сид только при пустой таблице)

## Вне скоупа прототипа (но нужно для «настоящего» prod)

- Аутентификация и RBAC
- Серверное хранение заметок закупщика
- Rate limiting и WAF
- Парсинг/ETL вместо ручного сида

## Локальные команды

См. корневой [`Makefile`](../Makefile): `make up`, `make test`, `make health`.

Подробнее о продуктовых ограничениях — [`README.md`](../README.md) и [`.project/DECISION.md`](DECISION.md).
