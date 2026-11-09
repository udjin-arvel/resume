# Polyglot Backend Benchmark: Go, Node.js, PHP, Python

Один и тот же REST API, написанный четыре раза — на **Go**, **Node.js**, **PHP** и **Python** — **без фреймворков**, по одному **OpenAPI**-контракту, поверх одной схемы PostgreSQL и **100 000** одинаковых записей. React-клиент переключает бэкенд на лету, проверяет, что все четыре отвечают одинаково, и показывает результаты нагрузочных прогонов k6.

Часть [портфолио приложений](../README.md).

[![Страница бенчмарков: RPS, латентность p50/p95/p99, память и cold start по четырём бэкендам](docs/screen1.png)](docs/demo-video.mp4)

▶ [Смотреть демо-видео (~7 МБ)](docs/demo-video.mp4) — клик по кадру тоже открывает ролик.

> На скриншоте страницы бенчмарков — демо-данные интерфейса. Цифры с конкретного железа появляются после полного прогона `make bench` и `make publish-bench` (см. [методику](#бенчмарки)).

## Коротко

| | |
| --- | --- |
| **4 реализации, 0 фреймворков** | Go `net/http` + pgx · Node.js `http` + pg · PHP-FPM + PDO за nginx · Python ASGI + uvicorn + asyncpg — сравниваются рантаймы и драйверы, а не обвязка |
| **1 контракт** | [`contract/openapi.yaml`](contract/openapi.yaml) — источник правды; smoke-тесты гоняют один набор проверок по всем четырём бэкендам |
| **Честные условия** | Одинаковые данные и запросы, пул из 20 соединений, лимит **1 CPU / 512 МБ** на каждый бэкенд |
| **Методика** | k6: 3 сценария (read-heavy, mixed-crud, aggregate) × 2 режима (fixed-rps, ramp-up) × 3 прогона, прогрев 30 с, медиана |
| **Метрики** | RPS, p50 / p95 / p99, память в простое и под нагрузкой, CPU, cold start, размер образа, строки кода |

## Что показывает проект

| Навык | Как реализовано |
| --- | --- |
| **Бэкенд на четырёх языках** | Один API (список с фильтрами и пагинацией, CRUD, агрегаты `/stats`, health) идиоматично на Go, Node.js, PHP и Python без фреймворков |
| **Contract-first** | OpenAPI как источник правды, единые коды ошибок, `price` строкой с двумя знаками — чтобы рантаймы не расходились на float; типы для клиента генерируются из контракта |
| **PostgreSQL** | Общая схема и детерминированный сид на 100 000 записей, одинаковые запросы (`SELECT` + `COUNT(*)` с теми же фильтрами) во всех реализациях |
| **Нагрузочное тестирование** | Сценарии k6, прогрев, fixed-rps и ramp-up, медиана из трёх прогонов, сбор RSS / CPU / cold start скриптами |
| **Docker и инфраструктура** | Compose со всеми сервисами и лимитами ресурсов; прод-конфиг без открытых портов бэкендов и БД, nginx с rate limit и ограничением тела запроса |
| **CI** | GitHub Actions: валидация OpenAPI, golangci-lint, ESLint, ruff, сборка образов, smoke-тесты контракта |
| **Frontend** | React + TanStack Start: переключение бэкенда, CRUD записей, сравнение ответов всех бэкендов в браузере, графики бенчмарков |

## Сверка бэкендов в браузере

Кнопка «Сравнить бэкенды» отправляет один и тот же запрос во все четыре реализации, сверяет ответы с эталоном и показывает медиану времени из трёх прогонов. Это проверка контракта и смоук, а не бенчмарк: в замер входят сеть, nginx и браузер.

<img src="docs/compare-preview.png" alt="Сравнение бэкендов: GET /items на 10 000 записей, у всех ответ 200, данные совпали с эталоном" width="760">

## Быстрый старт

```bash
cp .env.example .env   # опционально
make up                # docker compose up -d --build
make smoke             # контрактные проверки на всех 4 бэкендах
```

- UI: http://localhost:8080  
- Бэкенды напрямую (только для отладки): `:8081` Go, `:8082` Node, `:8083` PHP, `:8084` Python  
- Postgres: `localhost:5432` (пароль `polyglot` — **только локальное демо**)

Пересидить БД: `make reseed` (удаляет volume и поднимает заново).

## Архитектура

```text
client (nginx:8080 + SSR node на 127.0.0.1:3000)
  ├── /api/go/      → backend-go:8081
  ├── /api/node/    → backend-node:8082
  ├── /api/php/     → backend-php-nginx:8083  → backend-php:9000 (FPM)
  └── /api/python/  → backend-python:8084
pg: PostgreSQL 16, init из db/01-init.sql → 02-schema → 03-seed
```

**Осознанные компромиссы (честность):**

| Решение | Зачем |
|--------|--------|
| PHP: FPM + nginx sidecar | «голый» PHP без веб-сервера нереалистичен; минимальный идиоматичный стек. |
| Клиент: TanStack Start + SSR | Готовый UI с SSR; снаружи nginx, внутри Node — как у PHP, зафиксировано в методике. |
| `GET /items` | Два запроса: `SELECT` + `COUNT(*)` с одинаковыми фильтрами у всех языков. |
| `price` / `avg_price` | Строки с двумя знаками — без float-погрешностей между рантаймами. |
| Лимиты CPU/RAM | У каждого `backend-*`: **1 CPU, 512 MB** (`deploy.resources` + `cpus`/`mem_limit`). У `pg`: 2 CPU, 2 GB. |

## Контракт

Источник правды: [`contract/openapi.yaml`](contract/openapi.yaml).  
Типы для справки: `make gen-api` → `client/src/lib/schema.d.ts` (клиент использует [`client/src/lib/api.ts`](client/src/lib/api.ts)).

Коды ошибок: `bad_request`, `not_found`, `validation_error`, `internal_error`.

## Бенчмарки

```bash
make bench              # полная матрица (долго; 3 сценария × 4 бэкенда × 2 режима × 3 прогона)
make bench-quick        # короткий прогон (проверка обвязки)
make publish-bench      # скопировать bench/results → client/public/bench
```

Сценарии: `bench/scenarios/` (k6). Методика:

- прогрев 30 с в `setup()`;
- **fixed-rps** 200 и **ramp-up**;
- медиана из 3 прогонов;
- JSON: `bench/results/<scenario>-<backend>-<mode>.json`;
- UI читает статику из `client/public/bench/`.

Официальные цифры снимайте на изолированной машине без фонового шума; публичный стенд — для демо UI, не для нагрузки.

### Пример результатов (демо-статика в репозитории)

Пока не выполнен полный `make bench`, в UI могут отображаться эталонные JSON из `client/public/bench/`. После прогона: `make publish-bench` и зафиксируйте железо и дату в этом README.

## Публичный стенд

- [`docker-compose.prod.yml`](docker-compose.prod.yml) — снимает published-порты бэкендов и Postgres, наружу **80→client**.  
- [`deploy/nginx.conf`](deploy/nginx.conf) — rate-limit 10 r/s (burst 20), `limit_conn` 20, тело 16 KB.  
- TLS: Let's Encrypt / Caddy на VPS **2 vCPU / 4 GB RAM** (инструкция у провайдера).

## Make-цели

| Цель | Действие |
|------|----------|
| `up` / `down` / `logs` | Compose lifecycle |
| `reseed` | Пересоздать volume Postgres |
| `smoke` | Контрактные тесты |
| `bench` / `bench-quick` | k6 |
| `publish-bench` | Обновить графики в UI |
| `lint` | golangci-lint, eslint (client), ruff (python) |
| `gen-api` | openapi-typescript |

## CI

GitHub Actions: [`.github/workflows/ci.yml`](.github/workflows/ci.yml) — validate OpenAPI, lint, `docker compose build`, `make smoke`. Workflow рассчитан на проект как на отдельный репозиторий: в монорепозитории портфолио GitHub его не запускает.

## Ограничения

Мы сравниваем **реализации** при фиксированной схеме, данных, пуле (20), лимитах и сценариях — не «языки в вакууме». Результаты зависят от версий PG, драйверов, железа и ОС.

Лицензия: MIT ([`LICENSE`](LICENSE)).
