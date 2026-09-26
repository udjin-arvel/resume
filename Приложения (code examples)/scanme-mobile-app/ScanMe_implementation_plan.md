# ScanMe — Поэтапный план реализации

> Основан на `ScanMe_plan.md`. За базу взяты рекомендуемые варианты технологий. Проект — монорепозиторий с тремя независимыми пакетами: мобильное приложение (`app/`, Flutter), серверная часть (`backend/`, Go) и админ-панель (`dashboard/`, React SPA).

---

## 1. Итоговый стек

### 1.1. Мобильное приложение (`app/`)


| Слой                        | Выбор                                                  | Обоснование                                      |
| --------------------------- | ------------------------------------------------------ | ------------------------------------------------ |
| Фреймворк                   | **Flutter** (stable)                                   | Кроссплатформенность iOS/Android                 |
| Design System               | **Material Design 3** + тёмная тема                    | Из исходного плана                               |
| State Management            | **Riverpod**                                           | Проще и современнее `flutter_bloc`               |
| Навигация                   | **go_router**                                          | Из исходного плана                               |
| Сканер                      | **mobile_scanner**                                     | EAN-13, UPC, QR                                  |
| Клиент OFF (офлайн-фоллбэк) | Пакет **openfoodfacts**                                | На случай недоступности нашего бэкенда           |
| HTTP-клиент                 | **dio** + собственный `ApiClient`                      | Интерсепторы auth/retry/refresh                  |
| Локальное хранилище         | **Hive (hive_ce)**                                     | История, избранное, кэш ответов бэкенда          |
| Локальная база знаний       | Предзагруженный JSON в assets → дельта-синк с бэкендом | Работа офлайн                                    |
| Подписки                    | **RevenueCat** (`purchases_flutter`)                   | Валидация покупок на нашем бэкенде через webhook |
| Крэш-репортинг              | **Sentry Flutter**                                     | Альтернатива Crashlytics                         |
| Аналитика                   | Собственный эндпоинт `/v1/events` на бэкенде           | Не завязываемся на Firebase                      |
| Push                        | **APNs** + **FCM** (только как транспорт)              | Топики/токены хранит наш бэкенд                  |


### 1.2. Серверная часть (`backend/`)


| Слой                | Выбор                                                        | Обоснование                                                |
| ------------------- | ------------------------------------------------------------ | ---------------------------------------------------------- |
| Язык / рантайм      | **Go** 1.23+                                                 | Производительность, простота деплоя, одного бинарника      |
| HTTP-роутер         | **chi** (`github.com/go-chi/chi/v5`)                         | Идиоматичный, совместим с `net/http`, мидлвары             |
| Валидация           | **go-playground/validator/v10**                              | Стандарт де-факто                                          |
| БД                  | **PostgreSQL 16**                                            | JSONB для составов, FTS для поиска по веществам            |
| Драйвер / Query     | **pgx/v5** + **sqlc**                                        | Типобезопасный генерированный код                          |
| Миграции            | **goose**                                                    | Простые up/down SQL-миграции                               |
| Кэш / rate-limit    | **Redis 7**                                                  | Счётчики лимитов сканов, идемпотентность webhook'ов        |
| Конфиг              | **envconfig** + `.env` (godotenv в dev)                      | 12-factor                                                  |
| Логирование         | **log/slog** (stdlib)                                        | JSON-логи в prod                                           |
| DeepSeek (LLM)      | **OpenAI-compatible HTTPS API** (`github.com/sashabaranov/go-openai` с `BaseURL` = `https://api.deepseek.com`) или прямой REST | Модели `deepseek-chat` / `deepseek-reasoner`; JSON через `response_format`; ключ только на сервере |
| Аутентификация      | JWT (access 15 мин + refresh 30 дней), **golang-jwt/jwt/v5** | Stateless, совместим с anonymous-устройствами              |
| Тесты               | `testing` + **testify** + **testcontainers-go**              | Интеграционные тесты на реальной Postgres                  |
| API-контракт        | **OpenAPI 3.1** (`api/openapi.yaml`)                         | Генерация клиента для Flutter при желании                  |
| Метрики             | **Prometheus** (`/metrics`)                                  | Стандарт                                                   |
| Трассировка         | **OpenTelemetry** (опционально, OTLP)                        | Для анализа latency запросов к DeepSeek                     |
| Ошибки              | **Sentry Go**                                                | Единая платформа с мобильным приложением                   |
| Контейнеризация     | **Docker** (multi-stage), **docker-compose** для dev         | —                                                          |
| Reverse proxy / TLS | **Caddy** (прод)                                             | Автоматические сертификаты Let's Encrypt                   |
| CI/CD               | **GitHub Actions**                                           | Сборка образов, деплой по SSH или в Fly.io/Railway/Hetzner |
| Хостинг             | VPS Hetzner / Fly.io / Railway                               | На выбор, ничего облачно-специфичного не используется      |


### 1.3. Админ-панель (`dashboard/`)


| Слой                     | Выбор                                                   | Обоснование                                               |
| ------------------------ | ------------------------------------------------------- | --------------------------------------------------------- |
| Сборка / рантайм         | **Vite** + **React 18** + **TypeScript**                | Быстрый dev-loop, простой prod-билд в статику             |
| Роутинг                  | **TanStack Router**                                     | Типобезопасные маршруты, file-based                       |
| Данные и кэш             | **TanStack Query**                                      | Автокэш, инвалидация, optimistic updates для CRUD         |
| UI-кит                   | **shadcn/ui** (Radix + Tailwind CSS)                    | Доступный, быстрый, легко кастомизируется                 |
| Таблицы / гриды          | **TanStack Table**                                      | Сортировка, фильтры, пагинация для справочника            |
| Формы                    | **React Hook Form** + **Zod**                           | Валидация, минимум ре-рендеров                            |
| HTTP-клиент              | `fetch` + обёртка c токеном                             | SPA ходит напрямую в `/v1/admin/`**                       |
| Типы API                 | Генерация из **OpenAPI** (`openapi-typescript`)         | Единственный источник правды — `backend/api/openapi.yaml` |
| Редактор длинного текста | **TipTap** или `<textarea>` с Markdown                  | Для описания веществ                                      |
| Графики                  | **Recharts**                                            | Базовые дашборды по сканам/пользователям                  |
| Auth                     | Та же JWT-схема, что у приложения, но с ролью `admin`   | Единый механизм, минимум дублирования                     |
| Деплой                   | Статика через **Caddy** на поддомене `admin.scanme.app` | Просто, бесплатный TLS                                    |


---

## 2. Структура монорепозитория

```
scanme/
├── app/                          # Flutter-приложение (раздел 3)
│   ├── lib/
│   ├── assets/
│   ├── ios/
│   ├── android/
│   ├── test/
│   └── pubspec.yaml
├── backend/                      # Go-бэкенд (раздел 4)
│   ├── cmd/
│   ├── internal/
│   ├── migrations/
│   ├── api/
│   ├── deployments/
│   ├── scripts/
│   ├── go.mod
│   └── Makefile
├── dashboard/                    # React-админка (раздел 5)
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docs/                         # Общие доки, диаграммы, ADR
├── .github/
│   └── workflows/                # CI для app и backend
├── ScanMe_plan.md
├── ScanMe_implementation_plan.md
├── docker-compose.yml            # Локальный dev для backend + postgres + redis
└── README.md
```

---

## 3. Архитектура приложения (`app/`)

Clean Architecture, слои:

```
app/lib/
├── core/                         # Темы, роутер, DI, errors, network, logger
├── data/                         # Источники данных, DTO, реализация репозиториев
│   ├── datasources/
│   │   ├── remote/              # Наш бэкенд (основной), OFF (фоллбэк)
│   │   └── local/               # Hive, JSON
│   ├── models/
│   └── repositories/
├── domain/                       # Сущности, контракты, use cases
├── presentation/                 # Экраны + Riverpod-провайдеры
│   ├── scanner/
│   ├── result/
│   ├── history/
│   ├── favorites/
│   ├── subscription/
│   ├── settings/
│   └── encyclopedia/            # v2.0
└── main.dart
```

**Ключевое отличие от исходного плана:** основной источник данных — наш бэкенд. Прямые вызовы OFF остаются только как офлайн-фоллбэк, если бэкенд недоступен и нет кэша.

---

## 4. Архитектура бэкенда (`backend/`)

### 4.1. Роль бэкенда

1. **Прокси и кэш Open Food Facts.** Один запрос от первого пользователя кэшируется — все остальные получают результат из Postgres.
2. **Анализ ингредиентов.** Сервер сам ищет ингредиенты в базе веществ и агрегирует оценку опасности — клиент получает готовый отчёт.
3. **DeepSeek-прокси.** API-ключ DeepSeek никогда не попадает на клиент. После получения карточки из OFF модель возвращает структурированный JSON (состав, описание, вредные вещества); ответ кэшируется, действует rate-limit, кандидаты веществ уходят в очередь модерации.
4. **Учёт пользователей.** Анонимная регистрация по device-id, JWT, позже — опциональный email/OAuth.
5. **Подписки.** RevenueCat webhook → обновление entitlement в БД; клиент узнаёт статус одним запросом.
6. **Лимиты сканирований.** Server-authoritative счётчик в Redis (нельзя обойти сбросом локальных данных).
7. **Синхронизация базы веществ.** Клиент получает дельту с версии N, работает офлайн.
8. **Аналитика и пуши.** Собственный приём событий, отправка push через APNs/FCM.
9. **Админ-API.** CRUD по справочнику веществ, модерация ответов AI (DeepSeek), просмотр пользователей и статистики. Потребитель — `dashboard/`.

### 4.2. Структура пакета `backend/`

```
backend/
├── cmd/
│   ├── api/                      # main.go — HTTP-сервер
│   └── worker/                   # main.go — фоновые задачи (рассылка, инвалидация кэшей)
├── internal/
│   ├── config/                   # envconfig
│   ├── httpserver/
│   │   ├── router.go             # chi-роутер, монтирование модулей
│   │   ├── middleware/           # auth, logging, recovery, ratelimit, cors
│   │   └── response/             # JSON-помощники, типовые ошибки
│   ├── auth/                     # регистрация device, JWT, refresh
│   ├── user/                     # CRUD пользователей
│   ├── subscription/             # RevenueCat webhook, entitlements
│   ├── scan/                     # лимиты, история сканов на сервере
│   ├── product/                  # OFF-адаптер, кэш продуктов
│   ├── substance/                # справочник веществ, FTS, sync API
│   ├── analysis/                 # гибридный анализ (локальный справочник + DeepSeek)
│   │   ├── analyzer.go
│   │   └── deepseek/             # клиент совместимого API, промпты, JSON-схема ответа
│   ├── analytics/                # приём событий
│   ├── notification/             # APNs + FCM
│   ├── admin/                    # модерация, CRUD веществ
│   └── platform/
│       ├── postgres/             # sqlc-generated + pgx pool
│       ├── redis/
│       ├── deepseek/             # конфиг base URL, модель, таймауты
│       ├── sentry/
│       └── logger/
├── migrations/                   # goose .sql файлы
├── api/
│   └── openapi.yaml
├── deployments/
│   ├── docker/
│   │   └── Dockerfile            # multi-stage
│   ├── compose/
│   │   └── docker-compose.yml    # dev
│   └── caddy/
│       └── Caddyfile
├── scripts/
│   ├── seed_substances.go        # начальное наполнение справочника
│   └── run_dev.sh
├── go.mod
├── go.sum
└── Makefile                      # make run / test / lint / migrate / sqlc
```

### 4.3. Принципы внутри каждого модуля

Каждый `internal/<domain>/` содержит:

- `service.go` — бизнес-логика, зависит от интерфейсов.
- `repository.go` — интерфейс репозитория + реализация поверх `platform/postgres` (sqlc).
- `handler.go` — HTTP-обработчики, используют `service`.
- `dto.go` — request/response модели с тегами валидации.
- `*_test.go` — unit-тесты с моками + интеграционные с testcontainers.

Роутинг собирается в `httpserver/router.go`:

```go
r.Route("/v1", func(r chi.Router) {
    r.Mount("/auth",          authHandler.Routes())
    r.Mount("/products",      productHandler.Routes())
    r.Mount("/analysis",      analysisHandler.Routes())
    r.Mount("/substances",    substanceHandler.Routes())
    r.Mount("/scans",         scanHandler.Routes())
    r.Mount("/subscriptions", subscriptionHandler.Routes())
    r.Mount("/events",        analyticsHandler.Routes())
    r.Mount("/admin",         adminHandler.Routes()) // под admin-JWT
})
```

### 4.4. Схема БД (основные таблицы)

- `users` (`id`, `device_id`, `email?`, `created_at`, `is_premium_until`)
- `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`)
- `products` (`barcode` PK, `raw_off_json` JSONB, `fetched_at`, `ttl`, **`deepseek_analysis` JSONB NULL** — нормализованный ответ модели + текст для клиента; заполняется при первом успешном проходе OFF→DeepSeek)
- `product_analyses` (`product_id`, `substance_ids` int[], `overall_danger`, `computed_at`) — при наличии `deepseek_analysis` агрегат можно дублировать из JSON для быстрых запросов или считать на лету
- `substances` (`id`, `code`, `name`, `aliases` text[], `category`, `danger_level`, `description`, `source_url`, `version`, `updated_at`)
- `substances_fts` (materialized view с tsvector для FTS)
- `scans` (`id`, `user_id`, `barcode`, `scanned_at`, `client_ts`)
- `scan_quota` (в Redis: `quota:{user_id}:{YYYY-MM-DD}` с TTL до конца суток UTC)
- `subscriptions` (`user_id`, `provider` (`revenuecat`), `entitlement`, `expires_at`, `raw` JSONB)
- `analytics_events` (`id`, `user_id`, `name`, `props` JSONB, `ts`)
- `deepseek_cache` (`request_hash` PK — нормализованный payload barcode+locale+хэш состава OFF, `response` JSONB, `model`, `created_at`)
- `substance_candidate_queue` (`id`, `source` = `deepseek`, `candidate` JSONB, `status`, `reviewed_by`, `reviewed_at`) — бывш. очередь «GPT-кандидатов», универсальная для AI-кандидатов

### 4.5. Контракт API (черновик)


| Метод | Путь                              | Что делает                                               |
| ----- | --------------------------------- | -------------------------------------------------------- |
| POST  | `/v1/auth/device`                 | Анонимная регистрация по device-id, выдаёт JWT + refresh |
| POST  | `/v1/auth/refresh`                | Обновление access-токена                                 |
| GET   | `/v1/products/{barcode}`          | Продукт + анализ: кэш Postgres → при промахе **OFF → DeepSeek → сохранение `deepseek_analysis` и продукта** → ответ клиенту |
| POST  | `/v1/analysis/ingredients`        | Разбор произвольного списка строк состава (premium): локальный матчинг + при необходимости DeepSeek |
| GET   | `/v1/substances?since={version}`  | Дельта-синк локальной базы веществ                       |
| GET   | `/v1/substances/search?q=`        | Поиск по энциклопедии                                    |
| POST  | `/v1/scans`                       | Регистрация скана + актуальная квота                     |
| GET   | `/v1/scans/quota`                 | Текущая квота                                            |
| POST  | `/v1/subscriptions/webhook`       | RevenueCat webhook (проверка подписи)                    |
| GET   | `/v1/subscriptions/status`        | Статус premium                                           |
| POST  | `/v1/events`                      | Батч аналитических событий                               |
| GET   | `/healthz`, `/readyz`, `/metrics` | Observability                                            |


**Админские ручки** (для `dashboard/`, требуют JWT с ролью `admin`):


| Метод  | Путь                                | Что делает                                        |
| ------ | ----------------------------------- | ------------------------------------------------- |
| POST   | `/v1/admin/auth/login`              | Логин по email+password, выдаёт admin-JWT         |
| GET    | `/v1/admin/substances`              | Постраничный список с фильтрами и поиском         |
| POST   | `/v1/admin/substances`              | Создать вещество                                  |
| GET    | `/v1/admin/substances/{id}`         | Получить одно вещество                            |
| PATCH  | `/v1/admin/substances/{id}`         | Обновить (bump `version`)                         |
| DELETE | `/v1/admin/substances/{id}`         | Мягкое удаление (флаг + bump `version`)           |
| POST   | `/v1/admin/substances/import`       | Импорт пачкой из CSV/JSON                         |
| GET    | `/v1/admin/substances/export`       | Выгрузка текущего состояния                       |
| GET    | `/v1/admin/moderation/queue`        | Кандидаты веществ из DeepSeek (и др.) на модерацию |
| POST   | `/v1/admin/moderation/{id}/approve` | Принять кандидата (попадает в `substances`)       |
| POST   | `/v1/admin/moderation/{id}/reject`  | Отклонить с причиной                              |
| GET    | `/v1/admin/users`                   | Список пользователей, фильтры (premium, активные) |
| GET    | `/v1/admin/stats/overview`          | Агрегаты: DAU, сканы, подписки, cache hit-rate    |
| GET    | `/v1/admin/audit`                   | Журнал админских действий                         |


### 4.6. Сквозные решения

- **Контексты:** все запросы с `context.Context`, timeout middleware на 10 с, для **DeepSeek** отдельный таймаут (например 60–90 с) только на вызов модели.
- **Graceful shutdown:** `signal.NotifyContext` + `http.Server.Shutdown`.
- **Конкурентная безопасность:** `singleflight` для запросов к OFF и к DeepSeek по ключу `barcode`, чтобы параллельные сканы одного штрих-кода не порождали двойные вызовы модели.
- **Идемпотентность:** `Idempotency-Key` в заголовке для `/v1/scans` и `/v1/events`.
- **Безопасность:** rate-limit по IP+userId, CSRF не требуется (Bearer), строгие CORS, HSTS, helmet-подобные заголовки.
- **Секреты:** только через env, в проде — через провайдер (doppler, 1Password, docker secrets) или плоский `.env` на VPS с правами 600.
- **Админские аккаунты.** Отдельная таблица `admin_users` (email + argon2id-хэш пароля + роль) и отдельный JWT-issuer с claim `role=admin`. Сидируется через `scripts/create_admin.go`. 2FA (TOTP) — опционально в v2.0.

---

## 5. Архитектура админ-панели (`dashboard/`)

### 5.1. Роль и границы

- Отдельный React-SPA, никаких серверных шаблонов и SSR.
- Общается исключительно через `/v1/admin/`** бэкенда, используя admin-JWT.
- Не имеет прямого доступа к Postgres/Redis, все операции идут через HTTP-API → единая точка контроля и аудита.
- Разворачивается как статика на `admin.scanme.app`, за Caddy с basic IP-allowlist на уровне reverse proxy (опционально).

### 5.2. Структура пакета `dashboard/`

```
dashboard/
├── src/
│   ├── api/
│   │   ├── client.ts             # fetch-wrapper: baseUrl, JWT, refresh, errors
│   │   ├── generated/            # openapi-typescript сгенерированные типы
│   │   └── endpoints/            # тонкие функции: listSubstances, createSubstance...
│   ├── components/
│   │   ├── ui/                   # shadcn/ui (button, input, dialog, table, ...)
│   │   └── shared/               # AppShell, DataTable, ConfirmDialog, EmptyState
│   ├── features/
│   │   ├── auth/                 # LoginPage, useAuth, ProtectedRoute
│   │   ├── substances/           # Список, создание, редактирование, импорт/экспорт
│   │   ├── moderation/           # Очередь кандидатов веществ (DeepSeek / др.)
│   │   ├── users/                # Список пользователей, premium-статус
│   │   ├── products/             # Просмотр кэша продуктов, инвалидация
│   │   ├── analytics/            # Дашборды на Recharts
│   │   └── audit/                # Журнал админских действий
│   ├── hooks/                    # useDebouncedValue, usePagination, useToast
│   ├── lib/                      # utils, formatters, constants
│   ├── routes/                   # TanStack Router (file-based)
│   │   ├── __root.tsx
│   │   ├── login.tsx
│   │   └── _app/
│   │       ├── substances/
│   │       ├── moderation/
│   │       ├── users/
│   │       └── index.tsx
│   ├── styles/                   # tailwind entry
│   ├── main.tsx
│   └── App.tsx
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
├── Dockerfile                    # nginx/Caddy для раздачи билда
└── README.md
```

### 5.3. Ключевые экраны

1. **Login** — email + password → admin-JWT.
2. **Справочник веществ (главный экран).**
  - Таблица с серверной пагинацией, поиском, фильтрами (категория, уровень опасности, is_active).
  - Кнопка «Добавить», модалка/отдельная страница с формой (React Hook Form + Zod).
  - Форма полей: `code`, `name`, `aliases[]` (теги), `category`, `danger_level` (select `safe|controversial|dangerous`), `description` (Markdown), `source_url`, флаг `is_active`, i18n-поля.
  - Действия: Edit / Delete (soft) / Duplicate.
  - Массовый импорт: upload CSV/JSON → превью с diff → apply.
  - Экспорт текущего состояния одной кнопкой (CSV/JSON).
3. **Очередь модерации** — список кандидатов из DeepSeek, рядом — diff с существующими записями, кнопки Approve / Reject с причиной.
4. **Пользователи** — просмотр, фильтры premium/free, выдача/отзыв premium вручную.
5. **Кэш продуктов** — поиск по штрих-коду, просмотр сырого OFF-ответа и распознанного анализа, кнопка «Инвалидировать».
6. **Аналитика** — DAU/WAU/MAU, сканы по дням, конверсия в подписку, cache hit-rate, latency DeepSeek (после внедрения).
7. **Аудит** — кто что сделал с веществом, с возможностью rollback на предыдущую версию.

### 5.4. Сквозные решения

- **Генерация типов API.** `npm run gen:api` → читает `../backend/api/openapi.yaml`, кладёт в `src/api/generated/`. Один источник правды.
- **Авторизация.** `AuthProvider` хранит JWT в `localStorage` + in-memory, автообновление по 401. Роуты обёрнуты в `ProtectedRoute`.
- **Оптимистичные апдейты.** Для CRUD веществ через `useMutation` TanStack Query — пользователь видит изменение мгновенно.
- **Валидация.** Zod-схемы используются и для формы, и для типизации API-вызова.
- **Dark/Light.** `prefers-color-scheme` + переключатель.
- **i18n.** RU / EN через `react-intl` или `lingui`.
- **Безопасность.** `Content-Security-Policy` строгий; admin-JWT короткоживущий; на сервере все мутации пишут в `audit` таблицу.
- **Деплой.** `npm run build` → статические файлы → образ Docker на базе Caddy/nginx → поддомен `admin.scanme.app`.

---

## 6. Этапы реализации

Этапы идут в порядке зависимостей. Где возможно — треки работают параллельно (обозначено тегами **[app]**, **[backend]**, **[dashboard]**, **[infra]**).

### Этап 0 — Подготовка окружения

- [infra] Создать репозиторий, добавить `app/`, `backend/`, `dashboard/`, корневой `README.md`, `docker-compose.yml`.
- [infra] `.editorconfig`, `.gitignore`, лицензия, CODEOWNERS.
- [app] Установить Flutter SDK, создать проект в `app/`: `flutter create . --org com.<org> --project-name scanme`.
- [backend] Инициализировать Go-модуль в `backend/`: `go mod init github.com/<org>/scanme/backend`.
- [backend] `Makefile` с таргетами `run`, `test`, `lint`, `migrate-up`, `migrate-down`, `sqlc`, `docker-build`.
- [backend] `docker-compose.yml` на сервисы `postgres`, `redis`, `api`, `dashboard`, `caddy`.
- [dashboard] `npm create vite@latest dashboard -- --template react-ts`; подключить Tailwind, shadcn/ui init, TanStack Router, TanStack Query.
- [dashboard] Базовый `AppShell` с боковой навигацией и заглушкой логина.
- [infra] Заведены аккаунты RevenueCat, Sentry, DeepSeek (или провайдер LLM); ключи зарезервированы.

**Deliverable:** `docker compose up` поднимает Postgres + Redis + пустой Go-сервер с `/healthz`, Vite dev-server на `:5173`; Flutter-проект запускается на симуляторе.

### Этап 1 — Фундамент

**[backend]**

- `internal/config` через envconfig (`DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `DEEPSEEK_API_KEY` и т. д.).
- `internal/platform/postgres` — pgx pool, health-check.
- `internal/platform/redis` — клиент, health-check.
- `internal/httpserver` — chi-роутер, middleware: `RequestID`, `RealIP`, `Recoverer`, `Logger` (slog), `Timeout`, CORS.
- Эндпоинты `/healthz`, `/readyz`, `/metrics` (Prometheus).
- Интеграция `Sentry`, `slog` → JSON в prod.
- Goose-миграция `0001_init.sql` с пустыми таблицами `users`, `refresh_tokens`.
- `sqlc.yaml` + генерация, пример запроса.

**[app]**

- Зависимости: `flutter_riverpod`, `go_router`, `dio`, `hive_ce`, `freezed`, `json_serializable`, `sentry_flutter`.
- Тема Material 3 (тёмная + светлая, acc `greenAccent`).
- `go_router`: `/scanner`, `/result/:barcode`, `/history`, `/favorites`, `/subscription`, `/settings`.
- `ApiClient` на `dio` с baseUrl, `AuthInterceptor`, `RetryInterceptor`, `RefreshTokenInterceptor`.
- Базовый splash + `BottomNavigationBar`.

**[dashboard]**

- Настроить генератор типов: `openapi-typescript ../backend/api/openapi.yaml` → `src/api/generated/`.
- `api/client.ts` — fetch-обёртка с baseUrl (env), Bearer-токеном, обработкой 401.
- Темизация (dark/light) через Tailwind и shadcn.
- TanStack Query Provider, ErrorBoundary, Toaster.
- Пустые страницы-заглушки: `Substances`, `Moderation`, `Users`, `Analytics`.

**Deliverable:** приложение и админка ходят в локальный бэкенд на `/healthz` и получают `200 OK`.

### Этап 2 — Аутентификация

**[backend]**

- Миграции `users`, `refresh_tokens`, `admin_users`, `admin_audit`.
- `internal/auth`: сервис регистрации по `device_id`, выдача access/refresh, rotation.
- Middleware `RequireUser` — парсит JWT, кладёт `userID` в контекст.
- Отдельный поток admin-auth: `internal/admin/auth` с argon2id, login+password, admin-JWT с claim `role=admin`.
- Middleware `RequireAdmin` — валидирует admin-JWT и пишет действие в `admin_audit`.
- `POST /v1/auth/device`, `POST /v1/auth/refresh`, `POST /v1/admin/auth/login`.
- CLI `scripts/create_admin.go` для создания первого админа.
- Unit + интеграционные тесты на оба auth-флоу.

**[app]**

- `DeviceIdProvider` (device_info_plus).
- Автоматическая регистрация при первом запуске, хранение токенов в `flutter_secure_storage`.
- Глобальный стрим auth-состояния через Riverpod.

**[dashboard]**

- Экран `LoginPage` с формой (email + password, React Hook Form + Zod).
- `AuthProvider` + `ProtectedRoute` на TanStack Router.
- Хранение admin-JWT в памяти + refresh через httpOnly cookie либо short-lived access в localStorage (решение фиксируется в ADR).
- Автологаут и редирект на /login при 401.

**Deliverable:** первый запуск приложения создаёт пользователя; админ логинится в панели, попадает в пустой AppShell.

### Этап 3 — MVP: Сканер штрих-кодов

**[app]**

- Подключить `mobile_scanner`.
- Разрешения камеры (Android + iOS).
- `ScannerScreen`: предпросмотр, рамка, подсветка, фонарик, переключатель QR/штрих-код.
- Дебаунс, `HapticFeedback`, звук.
- Обработка ошибок (нет разрешения, нет камеры, нечитаемый код).

**Deliverable:** скан → переход на `/result/:barcode` со spinner'ом.

### Этап 4 — MVP: Продукты и кэш

**[backend]**

- Миграции `products`, `product_analyses`.
- `internal/product`: OFF-адаптер (HTTP-клиент + DTO), политика кэширования (TTL 30 дней, LRU-подрезка не нужна — просто рефетч по TTL).
- `singleflight` на одновременные запросы одного barcode.
- `GET /v1/products/{barcode}` возвращает унифицированную модель `Product` (название, бренд, фото, список ингредиентов в нормализованном виде).
- Обработка «не найдено» с чётким кодом ошибки `PRODUCT_NOT_FOUND`.
- Unit-тесты на парсер OFF, интеграционный на e2e с замоканным OFF.

**[app]**

- `ProductRepository` с remote (наш бэкенд) и local (Hive-кэш 30 дней) источниками.
- Use case `GetProductByBarcode` с фоллбэком: сеть → локальный кэш → прямой OFF (пакет `openfoodfacts`) → ошибка.
- Модели через `freezed`.

**Deliverable:** сканирование известного штрих-кода возвращает продукт; повторный скан — мгновенно из кэша.

### Этап 5 — MVP: Справочник вредных веществ + админка CRUD

**[backend]**

- Миграция `substances` + GIN-индекс по tsvector для FTS + monotonic `version`.
- Миграция `admin_audit` дополняется привязкой к сущностям `substance`.
- Скрипт `scripts/seed_substances.go` заливает 150–250 базовых веществ (E-добавки, консерванты, красители, подсластители, трансжиры) из YAML/JSON в `migrations/data/` (или через админку).
- `internal/substance`: публичные эндпоинты + админский слой CRUD.
- Публичные: `GET /v1/substances?since={version}&limit=`, `GET /v1/substances/search?q=`.
- Админские: `GET/POST/PATCH/DELETE /v1/admin/substances`, `POST /v1/admin/substances/import`, `GET /v1/admin/substances/export`.
- Каждый мутирующий вызов пишет запись в `admin_audit` (кто, когда, diff).
- Каждый апдейт bump'ит глобальный `version` → дельта-синк автоматически отдаст клиентам.
- `internal/analysis/analyzer.go` — матчинг ингредиентов к веществам (нормализация строк, по имени/алиасам/коду), агрегированная оценка `safe | controversial | dangerous`.
- `GET /v1/products/{barcode}` теперь возвращает готовый `analysis` внутри ответа.
- OpenAPI-спека дополняется всеми ручками.

**[dashboard]** (разблокирует контентную работу)

- `features/substances/list` — `DataTable` на TanStack Table, серверная пагинация, поиск, фильтры (категория, `danger_level`, `is_active`).
- `features/substances/create` и `features/substances/edit` — форма со всеми полями, валидация Zod, Markdown-редактор для `description`, tag-input для `aliases`.
- `features/substances/delete` — soft-delete с подтверждением.
- `features/substances/import` — drag-n-drop CSV/JSON, превью с diff, массовое применение.
- `features/substances/export` — выгрузка в CSV/JSON одной кнопкой.
- Оптимистичные обновления кэша TanStack Query; toast об успехе/ошибке.
- На каждой записи отображается версия и автор последнего изменения.

**[app]**

- В `assets/substances_v1.json` — копия базовой версии справочника (офлайн-первый старт).
- Локальный репозиторий на Hive, при первом запуске сидируется из assets.
- Фоновая задача `SubstanceSyncWorker` при наличии сети подтягивает дельту через `/v1/substances?since=`.

**Deliverable:** контент-менеджер (или разработчик) может через админку добавлять/редактировать вещества — изменения подхватываются мобильным приложением автоматически через дельта-синк. Приложение показывает подсвеченный анализ состава без интернета.

### Этап 6 — MVP: Экран результата и детали

**[app]**

- `ResultScreen`: фото, название, бренд, бейдж общей оценки.
- Список ингредиентов с цветовой индикацией; `ExpansionTile` с описанием и ссылкой на источник.
- Скелетоны / `Shimmer` при загрузке.
- Пустые состояния: «не найдено», «нет состава».
- Кнопки «В избранное» и «Поделиться» (share_plus).

**Deliverable:** полноценный e2e-сценарий: скан → отчёт.

### Этап 7 — MVP: История и Избранное

**[backend]**

- Миграция `scans`.
- `POST /v1/scans` (идемпотентный), `GET /v1/scans?limit=&cursor=`.
- Серверная история даёт синхронизацию между устройствами позже (v2.0), но закладываем уже сейчас.

**[app]**

- Hive-боксы `history_box`, `favorites_box` с TypeAdapter для `ProductSnapshot`.
- Автосохранение после успешного скана + отправка `POST /v1/scans`.
- `HistoryScreen` (swipe-to-delete, очистка), `FavoritesScreen` (сортировка).

**Deliverable:** пользователь видит все свои сканы; события доходят до сервера.

### Этап 8 — MVP: Freemium и подписки

**[backend]**

- Миграция `subscriptions`.
- `internal/scan.LimitService`: Redis-счётчик `quota:{user}:{date}`, инкремент атомарно (INCR + EXPIRE), проверка premium.
- `GET /v1/scans/quota` — `{remaining, limit, resetAt}`.
- Middleware `EnforceScanLimit` для `GET /v1/products/{barcode}` (только для free-юзеров, 3/день).
- `internal/subscription`: RevenueCat webhook с HMAC-подписью, обновление `users.is_premium_until`.
- `GET /v1/subscriptions/status`.

**[app]**

- Интеграция `purchases_flutter` с RevenueCat; продукты monthly / yearly / lifetime.
- `SubscriptionService` стримит `isPremium` и `remainingScans` (от бэкенда).
- `PaywallScreen`, показывается автоматически при 429 с кодом `SCAN_LIMIT_EXCEEDED`.
- Восстановление покупок, экран «Статус подписки» в настройках.

**Deliverable:** 3 бесплатных скана/день; покупка в сторе → webhook → премиум-пользователь сразу безлимитен.

### Этап 9 — MVP: Аналитика, наблюдаемость, релиз

**[backend]**

- Миграция `analytics_events`, батчевая вставка.
- `POST /v1/events` (батч до 100 событий, идемпотентный).
- Агрегаты для админки: `GET /v1/admin/stats/overview` (DAU/WAU/MAU, сканы/день, premium-конверсия, cache hit-rate).
- `GET /v1/admin/users` с фильтрами и пагинацией.
- `GET /v1/admin/audit` — журнал действий модераторов.
- Prometheus-метрики: HTTP latency, latency DeepSeek (LLM), cache hit-rate, scan rate.
- Health/readiness с проверкой Postgres и Redis.
- Sentry-DSN, уровни логирования, маскирование PII.

**[app]**

- `AnalyticsService` с батчингом (flush каждые 30 с или 20 событий).
- События: `scan_started`, `scan_completed`, `paywall_shown`, `purchase_success`, `result_opened`.
- `sentry_flutter` с `beforeSend` для фильтрации PII.

**[dashboard]**

- `features/analytics/overview` — дашборд с Recharts: DAU/MAU, сканы по дням, воронка подписки.
- `features/users/list` — таблица, фильтр premium/free, ручная выдача/отзыв премиум.
- `features/audit` — журнал с фильтром по пользователю/сущности/дате.
- Prod-билд (`npm run build`) в Docker-образ (Caddy отдаёт статику).

**[infra]**

- Docker-образ бэкенда (multi-stage, distroless), образ `dashboard` (Caddy + статика), push в GHCR.
- GitHub Actions: `backend.yml`, `dashboard.yml` (lint, test, build), `app.yml` (analyze, test, build AAB/IPA).
- Caddy-конфиг: `api.scanme.app` → бэкенд, `admin.scanme.app` → dashboard (+ basic IP-allowlist опционально).
- Деплой на VPS через docker-compose, либо Fly.io/Railway (отдельные сервисы для api и dashboard).
- Резервное копирование Postgres (pg_dump по расписанию в S3/Backblaze).
- Метаданные сторов, иконка, `flutter_native_splash`, privacy policy.
- Публикация в TestFlight и internal track Google Play.

**Deliverable:** MVP в закрытой бете, админка доступна команде на `admin.scanme.app`, метрики и ошибки видно в Sentry и Prometheus.

---

### Этап 10 — v2.0: DeepSeek при первом получении продукта с OFF

Цель: при сканировании, если **в Postgres ещё нет актуальной записи продукта** (промах кэша по штрих-коду), загрузить карточку из Open Food Facts, **одним запросом к DeepSeek** получить структурированный JSON (описание, нормализованный состав, вредные вещества с пояснениями), **сохранить в БД** вместе с продуктом и отдать клиенту единый ответ API в уже принятом формате (`Product` + `analysis` + блок AI-текста).

**Поток (сервер)**

1. `GET /v1/products/{barcode}` → нет свежей строки в `products` (или явная политика «первый раз после OFF всегда вызывать DeepSeek» — фиксируется в ADR).
2. HTTP к `OPEN_FOOD_FACTS_BASE_URL` → разбор ингредиентов, название, бренд, изображение (OFF-адаптер).
3. **Prompt payload**: метаданные продукта + текст/список ингредиентов из OFF + при желании результат **локального** матчинга по `substances` (известные UUID подставляет сервер, модель может оставить `id` пустым).
4. Вызов **DeepSeek** (OpenAI-compatible API): базово `https://api.deepseek.com`, модель из конфига (`DEEPSEEK_MODEL`, например `deepseek-chat`), ответ только JSON (`response_format` + JSON Schema тела из блока ниже).
5. Валидация JSON → **слияние** с локальным анализатором: для записей справочника подставляются реальные `id`; для неизвестных веществ — строки в `substance_candidate_queue` и в клиентском `analysis` без UUID до модерации.
6. Сохранение: `products` + `raw_off_json`, колонка **`deepseek_analysis` JSONB** (канонический ответ модели); при необходимости денормализация в `product_analyses`.
7. Ответ клиенту совпадает с кэш-хитом; опционально расширение OpenAPI: `aiInsight` / `analysisSource`.

**[backend]**

- `internal/platform/deepseek` — `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, `DEEPSEEK_MODEL`, таймауты, retry.
- `internal/analysis/deepseek` — промпты, вызов API, маппинг JSON → `product.Product`, `analysis.Result`.
- Миграции: `products.deepseek_analysis`; `deepseek_cache`; очередь кандидатов `substance_candidate_queue` с полем `source` (`deepseek`).
- `singleflight` на пару OFF+DeepSeek по `barcode`.
- Rate-limit DeepSeek (Redis).
- `POST /v1/analysis/ingredients` (premium): тот же контракт JSON на произвольном списке строк состава.

**Метрики:** histogram latency LLM с label `provider=deepseek`.

**[app]**

- UI «идёт AI-анализ» при долгом `GET /v1/products/{barcode}` после промаха кэша.
- Бейдж источника: справочник / DeepSeek / смешанный.
- Ошибка или таймаут DeepSeek: продукт из OFF + только локальный анализ.

**Deliverable:** первый скан нового штрих-кода: OFF → DeepSeek → сохранение JSON → ответ клиенту; повторные запросы без вызова модели.

#### Контракт JSON — ответ модели DeepSeek

Один объект JSON (camelCase), пригодный для маппинга в текущие типы бэкенда:

- **`ingredientsNormalized`** → как массив `Ingredient`: `rank`, `text`, опционально `percent`, `id`, `vegan`, `vegetarian`.
- **`overallDanger` и `matches`** → как `analysis.Result`: `overallDanger` ∈ `safe|controversial|dangerous`; каждый элемент `matches[]` содержит `ingredientText` и `substances[]` с полями как у `SubstanceSnapshot`: `id` (пустая строка, если записи ещё нет в БД), `code`, `name`, `dangerLevel`, `description`, `sources`.
- **`productSummary`, `compositionOverview`, `disclaimer`** → тексты для экрана результата (вынос в `aiInsight` в OpenAPI по желанию).
- **`substanceCandidates`** → кандидаты в справочник; каждый элемент очереди модерации дублирует эту структуру + `barcode` на стороне сервера.

Пример тела ответа:

```json
{
  "schemaVersion": 1,
  "locale": "ru",
  "productSummary": "Краткое описание для пользователя (не медсовет).",
  "compositionOverview": "Разбор состава простым языком.",
  "overallDanger": "safe",
  "ingredientsNormalized": [
    { "rank": 1, "text": "вода", "percent": "", "id": "", "vegan": "", "vegetarian": "" }
  ],
  "matches": [
    {
      "ingredientText": "сахар",
      "substances": [
        {
          "id": "",
          "code": "",
          "name": "Сахар (сахароза)",
          "dangerLevel": "controversial",
          "description": "Краткое пояснение.",
          "sources": ["https://example.org"]
        }
      ]
    }
  ],
  "substanceCandidates": [
    {
      "normalizedKey": "редкая добавка xyz",
      "name": "Каноническое имя для справочника",
      "aliases": ["синоним"],
      "code": "",
      "category": "добавка",
      "dangerLevel": "controversial",
      "description": "Текст карточки после модерации.",
      "sources": ["https://example.org"],
      "linkedIngredientTexts": ["редкая добавка xyz"]
    }
  ],
  "disclaimer": "Информация ознакомительная."
}
```

| Поле JSON | Назначение | Куда в системе |
|-----------|------------|----------------|
| `schemaVersion` | Версия контракта | Хранить в `deepseek_analysis` |
| `locale` | Язык текстов | Промпт / отображение |
| `productSummary`, `compositionOverview` | Описание продукта и состава | UI / `aiInsight` |
| `overallDanger` | Итоговая оценка | `analysis.overallDanger` (можно объединить с локальным правилом max-опасности) |
| `ingredientsNormalized` | Нормализованный состав | `Product.ingredients` при согласовании с OFF |
| `matches` | Вредные/спорные вещества по строкам состава | `analysis.matches`; пустой `id` до апрува модерации |
| `substanceCandidates` | Новые вещества | `substance_candidate_queue` |
| `disclaimer` | Дисклеймер | UI |

### Этап 11 — v2.0: Модерация кандидатов DeepSeek и энциклопедия

**[backend]**

- Очередь `substance_candidate_queue`: поле `source` (`deepseek`), JSON кандидата (как в `substanceCandidates` + сервер добавляет `barcode`), статусы `pending|approved|rejected`.
- `GET /v1/admin/moderation/queue`, `POST /v1/admin/moderation/{id}/approve`, `POST /v1/admin/moderation/{id}/reject` — approve создаёт/обновляет `substances`, bump `version`.
- Дедуп по `normalizedKey`.
- Rollback версии вещества через `admin_audit`.

**[dashboard]**

- `features/moderation/queue` — кандидаты DeepSeek, diff с `substances`, Approve / Edit & Approve / Reject, счётчики, история версий.

**[app]**

- `EncyclopediaScreen` по локальной базе; опционально счётчик «новых веществ».

**Deliverable:** модератор утверждает кандидатов из DeepSeek; пользователь при первом скане уже получает AI-обогащённый ответ с сохранением в БД.

### Этап 12 — v2.0: UX-полировка, локализация

**[app]**

- Полная поддержка светлой темы, переключатель в настройках.
- Анимации переходов (`Hero`, `PageTransitionsTheme`), Lottie на пустые состояния и успех.
- Адаптивная вёрстка для планшетов.
- Локализация RU + EN (`intl`, ARB).
- Доступность: `Semantics`, крупный шрифт, контраст.

**[backend]**

- Поля `name_i18n`, `description_i18n` в `substances` (JSONB по коду языка).
- `Accept-Language` → соответствующая локализация в ответах.

**[dashboard]**

- В формах редактирования — вкладки для каждого языка (RU/EN).
- Интерфейс админки переведён на RU + EN (react-intl/lingui).
- 2FA (TOTP) для админов.

**Deliverable:** приложение и админка готовы к международному релизу.

### Этап 13 — v2.0: Публикация, push, рост

**[backend]**

- Миграция `device_tokens` (APNs/FCM).
- `internal/notification`: отправка пушей, кампании (обновление базы, «ты давно не сканировал»).
- Реферальные ссылки: `referrals` таблица, бонусные сканы за приглашение.

**[app]**

- Регистрация push-токенов, обработка payload'ов.
- Экран «Пригласи друга».

**[infra]**

- Открытие публичных подписок в сторах.
- ASO: ключевые слова, скриншоты, превью.

**Deliverable:** публичный релиз 2.0.

---

## 7. Будущие версии (бэклог)

- **Социальная сеть:** шеринг карточек, рейтинги, комментарии — новая таблица `product_comments`, модерация.
- **Диетические профили:** аллергии, вегетарианство/веганство, keto, halal — персонализированная оценка на бэкенде.
- **OCR по фото этикетки:** Google ML Kit на клиенте → список строк → тот же маршрут анализа, что и для произвольного состава (`POST /v1/analysis/ingredients`, DeepSeek в v2).
- **Сравнение продуктов:** side-by-side two-column layout.
- **Web-версия:** Flutter Web на том же коде, SSR не нужен.
- **Домашний виджет** (iOS/Android) со счётчиком сканирований и оценкой последнего продукта.
- **Self-hosted** вариант бэкенда для энтузиастов (плюс очко сообществу).

---

## 8. Наблюдаемость и эксплуатация

- **Логи.** Структурированные JSON через `slog`; в проде — агрегация в Grafana Loki или просто stdout + `docker logs`.
- **Метрики.** Prometheus scrape `/metrics`; дашборд: RPS, p95-latency по ручкам, latency DeepSeek, cache hit-rate, квоты.
- **Алерты.** Alertmanager (или Grafana Alerts) на 5xx-spike, рост latency DeepSeek, низкий disk space Postgres.
- **Трассировка.** OpenTelemetry OTLP в Tempo/Jaeger (опционально, включаем при первых перформанс-инцидентах).
- **Бэкапы.** `pg_dump` каждую ночь в S3/B2, retention 30 дней; ежеквартально — restore-drill.
- **Миграции.** `goose up` запускается автоматически при деплое; down-миграции — только вручную.
- **Секреты.** `.env` только локально; в проде — переменные окружения через оркестратор.
- **Аудит админки.** Любое изменение через `dashboard/` пишется в `admin_audit` и доступно из интерфейса с возможностью rollback версии вещества.

---

## 9. Риски и меры


| Риск                                            | Митигация                                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Продукт не найден в OFF                         | Фоллбэк на Barcode Lookup / Icecat; обработка `PRODUCT_NOT_FOUND` на клиенте                |
| Стоимость LLM (DeepSeek)                         | Кэш `deepseek_cache`, один запрос на новый баркод при промахе кэша, rate-limit, опционально только premium для дорогих моделей |
| Утечка API-ключа DeepSeek                        | Ключ только на backend; клиент только `GET /v1/products` и др.                                                                |
| Пользователь обходит лимиты через переустановку | Server-authoritative счётчик в Redis по `user_id`, а не по устройству                       |
| Отказ стора из-за «медицинских заявлений»       | Дисклеймеры «не медицинский совет», ссылки на источники в каждой записи                     |
| Падение бэкенда                                 | Клиент умеет в офлайн-режим: локальный кэш продуктов + локальная база веществ               |
| Качество ответов DeepSeek                        | Строгая JSON-схема, очередь модерации, отсев дубликатов                                     |
| Конкуренты (Yuka)                               | Фокус на AI-объяснениях, локализация RU/EN, собственный бэкенд как основа для экосистемы    |
| Случайная ошибка модератора в админке           | Все мутации логируются в `admin_audit`, версии веществ monotonic, есть rollback             |
| Компрометация админ-аккаунта                    | Argon2id, короткоживущий JWT, в v2.0 — 2FA (TOTP), опционально IP-allowlist на уровне Caddy |


---

## 10. Definition of Done для этапа

1. Код покрыт тестами: unit на use cases / services, интеграционные на репозитории (testcontainers), widget-тесты ключевых экранов Flutter, компонентные тесты админки (Vitest + Testing Library).
2. `flutter analyze`, `golangci-lint run` и `npm run lint` (в dashboard) — без предупреждений.
3. Ручная проверка на iOS и Android-устройстве, смоук-прогон админки в Chrome и Firefox.
4. `README.md` и `CHANGELOG.md` обновлены; при изменении API — обновлён `api/openapi.yaml` и перегенерированы типы в `dashboard/src/api/generated/`.
5. Ветка смержена в `develop` через Pull Request с ревью.
6. CI (GitHub Actions) — зелёный; релевантные образы запушены в GHCR.

