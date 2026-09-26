# План разработки Mini CRM на базе Telegram Mini App

**Стек технологий:**

- **Бэкенд:** Go (Golang) + PostgreSQL
- **Фронтенд:** React 19 + TypeScript + TanStack (Start, Router, Query) + Telegram Mini App
- **UI:** shadcn/ui (Radix UI) + Tailwind CSS v4
- **Формы:** react-hook-form + Zod
- **API:** REST (не GraphQL)
- **Интеграция:** Telegram Bot API

**Версия:** 1.1  
**Основание:** Техническое задание (CRM_TZ_final_structure.docx)

**Прототип:** UI-прототип на React + TanStack уже находится в папке `client/` (Lovable). Маршруты и экраны менеджера собраны на мок-данных; далее — подключение к Go API.

### Текущее состояние прототипа (`client/`)

| Маршрут | Файл | Статус |
| --- | --- | --- |
| `/` | `routes/index.tsx` | UI готов (моки) |
| `/projects` | `routes/projects.index.tsx` | UI готов, BottomNav |
| `/projects/:id` | `routes/projects.$projectId.tsx` | UI готов |
| `/estimates` | `routes/estimates.index.tsx` | UI готов |
| `/estimates/:id` | `routes/estimates.$estimateId.tsx` | UI готов |
| `/workers` | `routes/workers.index.tsx` | UI готов |
| `/workers/:id` | `routes/workers.$workerId.tsx` | UI готов |
| `/reports` | `routes/reports.index.tsx` | UI готов |
| `/reports/:id` | `routes/reports.$reportId.tsx` | UI готов |
| `/daily-reports/:id` | `routes/daily-reports.$dailyId.tsx` | UI готов |
| `/finance` | `routes/finance.index.tsx` | UI готов |
| `/tools` | `routes/tools.index.tsx` | UI готов |
| `/tools/:id` | `routes/tools.$toolId.tsx` | UI готов |
| `/clients/:id` | `routes/clients.$clientId.tsx` | UI готов |
| `/auth/login` | `routes/auth/login.tsx` | **Не сделано** — вход по email/паролю |
| `/auth/register` | `routes/auth/register.tsx` | **Не сделано** — регистрация работника |

**Уже настроено:** React 19, TypeScript, TanStack Start/Router/Query, shadcn/ui, Tailwind v4, react-hook-form, zod, recharts, sonner.

**Ещё не сделано:** auth, Telegram SDK, API-слой, экраны работника, i18n, тесты.

**Аутентификация (план):** два способа входа — **Telegram Mini App** (основной для работников в поле) и **email + пароль** (веб-форма для менеджеров, локальной разработки и доступа вне Telegram). Самостоятельная регистрация работника через форму создаёт заявку со статусом `pending` (как при первом входе через Telegram); менеджеры — только по приглашению или через seed в dev.

---

## Этап 0. Проектирование и подготовка (перед началом разработки)

### 0.1. Архитектура проекта

- [ ] Создать структуру репозитория:
  ```
  /crm-backend/          # Go бэкенд
    /cmd/
    /internal/
    /pkg/
    /migrations/
    /docs/
  /client/               # React + TanStack фронтенд (прототип уже есть)
    /src/
      /routes/           # file-based routing (TanStack Router)
      /components/
        /ui/             # shadcn/ui
      /lib/
        /api/            # server functions и HTTP-клиент
      /hooks/
  /docker-compose.yml    # для локальной разработки
  ```
- [ ] Настроить Docker Compose с контейнерами для:
  - Go-сервера (с hot-reload через air)
  - PostgreSQL 15+
  - (опционально) Redis для кэша и очередей

### 0.2. Проектирование базы данных

- [ ] Создать ER-диаграмму со всеми сущностями
- [ ] Определить миграции с использованием `golang-migrate`
- [ ] Разработать схему таблиц:
  - `users` (менеджеры, работники; `email` UNIQUE для входа по форме, `password_hash`, `telegram_id` опционально)
  - `clients`
  - `estimates` (сметы)
  - `estimate_blocks` (блоки услуг, ресурсов, расходов)
  - `estimate_templates`
  - `projects`
  - `project_workers` (связь работников с проектами)
  - `reports_worker` (еженедельные)
  - `reports_supervisor` (ежедневные)
  - `report_expenses`
  - `tools`
  - `tool_assignments`
  - `tool_calibrations`
  - `documents`
  - `notifications`
  - `activity_logs`

### 0.3. Проектирование REST API

- [ ] Спецификация эндпоинтов (OpenAPI 3.0 в `swagger.yaml`):
  - `/api/v1/auth/*` – авторизация (Telegram + email/пароль):
    - `POST /auth/telegram` – вход через Mini App
    - `POST /auth/login` – вход по email и паролю
    - `POST /auth/register` – регистрация через форму (работник → заявка `pending`)
    - `POST /auth/refresh` – обновление access-токена (опционально)
    - `POST /auth/logout` – инвалидация refresh-токена (опционально)
    - `GET /auth/me` – текущий пользователь
    - `POST /auth/password/forgot` – запрос сброса пароля (опционально, этап 4+)
    - `POST /auth/password/reset` – установка нового пароля по токену (опционально)
  - `/api/v1/estimates/*` – сметы
  - `/api/v1/projects/*` – проекты
  - `/api/v1/workers/*` – работники
  - `/api/v1/reports/*` – отчеты
  - `/api/v1/finance/*` – финансы
  - `/api/v1/tools/*` – инструменты
  - `/api/v1/clients/*` – клиенты
  - `/api/v1/documents/*` – документы
  - `/api/v1/notifications/*` – уведомления
- [ ] Разработать структуру запросов/ответов (DTO)

### 0.4. Настройка инструментов разработки

- [ ] Установить и настроить:
  - Go: `air` (hot-reload), `swaggo` (генерация Swagger), `golang.org/x/crypto/bcrypt` (хеш паролей)
  - React: `Vite`, `@tanstack/react-start`, `@tanstack/react-router`, `@tanstack/react-query`, `react-hook-form`, `zod`
  - UI: `tailwindcss`, shadcn/ui (Radix), `lucide-react`, `sonner`, `recharts`
  - Telegram: `go-telegram-bot-api` или `telebot`; на фронте — `@telegram-apps/sdk` или `window.Telegram.WebApp`
  - Тестирование: `testing` (Go), `Vitest` + `@testing-library/react` (React)

### 0.5. Настройка окружений

- [ ] Создать `.env.example` для:
  - `DATABASE_URL`
  - `TELEGRAM_BOT_TOKEN`
  - `JWT_SECRET`
  - `JWT_REFRESH_SECRET` (если используется refresh-токен)
  - `REGISTRATION_ENABLED` (`true` в dev, `false` в prod — открытая регистрация работников)
  - `MANAGER_INVITE_SECRET` (опционально — токен/код для регистрации менеджера)
  - `APP_ENV` (dev/staging/prod)
  - `APP_URL` (для Mini App)

---

## Этап 1. Бэкенд: Базовая инфраструктура и аутентификация

### 1.1. Настройка Go-сервера

- [ ] Создать main.go с HTTP-сервером (использовать `gin` или `echo`)
- [ ] Настроить маршрутизацию с группами `/api/v1`
- [ ] Добавить middleware для:
  - Логирования запросов
  - CORS (для разработки)
  - Восстановления после паники (recovery)

### 1.2. Подключение к PostgreSQL

- [ ] Создать пакет `database` с пулом соединений (`pgxpool`)
- [ ] Написать миграции для базовых таблиц:
  - `users` (id, telegram_id, email, password_hash, role, name, phone, status, etc.)
  - `clients`
  - `estimates`
  - `projects`
- [ ] Создать репозитории (DAO) для работы с БД

### 1.3. Модели данных (базовые)

- [ ] **User (Worker)** – реализовать модель с полями из ТЗ п.5.5
- [ ] **Client** – п.2.3
- [ ] **Estimate** – п.3.2, 3.3–3.6
- [ ] **Project** – п.4.3
- [ ] Связать Estimate → Project → Client

### 1.4. Аутентификация

Два независимых способа входа с единым JWT и middleware. Пользователь может иметь `telegram_id`, `email` или оба (привязка Telegram к существующему аккаунту — опционально, этап 4+).

#### 1.4.1. Вход через Telegram Mini App

- [ ] Реализовать валидацию `Telegram.WebApp.initData`:
  - Проверка хеша (HMAC-SHA256)
  - Проверка срока действия `auth_date`
- [ ] Создать эндпоинт `POST /api/v1/auth/telegram`
- [ ] При первом входе — создать пользователя с `telegram_id`, статус `pending` для работника
- [ ] JWT-генерация после успешной проверки

#### 1.4.2. Вход и регистрация через форму (email + пароль)

- [ ] Миграция/поля `users`: `email` (UNIQUE, NOT NULL для учёток с паролем), `password_hash` (bcrypt)
- [ ] `POST /api/v1/auth/register`:
  - Тело: `email`, `password`, `firstName`, `lastName`, `phone` (опционально), `role` (только `worker` по умолчанию)
  - Валидация пароля (мин. длина, сложность)
  - Работник: статус `pending`, далее — анкета (п.7.2) и одобрение менеджером
  - Менеджер: регистрация только при `MANAGER_INVITE_SECRET` или отключена (`REGISTRATION_ENABLED=false`)
  - Ответ: JWT + `user` (как у Telegram-auth)
- [ ] `POST /api/v1/auth/login`:
  - Тело: `email`, `password`
  - Проверка bcrypt, статуса (`blocked` → 403), одобрения для работника
  - Ответ: JWT + `user`
- [ ] `GET /api/v1/auth/me` — профиль текущего пользователя по JWT
- [ ] (Опционально) `POST /api/v1/auth/refresh` — пара access + refresh токенов
- [ ] Seed первого менеджера для dev (`cmd/seed` или SQL): `admin@example.com` / пароль из `.env`

#### 1.4.3. Общая инфраструктура auth

- [ ] Middleware для проверки JWT в защищённых маршрутах
- [ ] Определение роли пользователя из JWT (менеджер / работник / супервайзер)
- [ ] Единый формат ответа `AuthResponse` (`token`, `user`) для Telegram и form-login

### 1.5. Загрузка файлов

- [ ] Настроить локальное хранилище `./uploads/`
- [ ] Создать эндпоинты:
  - `POST /api/v1/documents/upload`
  - `GET /api/v1/documents/:id`
  - `DELETE /api/v1/documents/:id`
- [ ] Добавить проверку типов файлов и максимального размера

### 1.6. Базовые репозитории и сервисы

- [ ] CRUD-операции для User
- [ ] CRUD-операции для Client
- [ ] CRUD-операции для Project

### 1.7. Тесты

- [ ] Написать unit-тесты для аутентификации (Telegram HMAC, bcrypt login/register, JWT)
- [ ] Написать интеграционные тесты для эндпоинтов `auth/telegram`, `auth/login`, `auth/register`, `auth/me`

---

## Этап 2. Бэкенд: Ключевые модули (базовая функциональность)

### 2.1. Модуль «Сметы» (раздел 3 ТЗ)

- [ ] **Estimate Service**:
  - Создание/редактирование/удаление (черновики)
  - Добавление/удаление/переупорядочивание блоков (услуги, ресурсы, расходы)
  - Расчет итоговой суммы
- [ ] **Estimate Controller**:
  - `GET /api/v1/estimates` – список с фильтрами (по статусу)
  - `GET /api/v1/estimates/:id` – детали сметы
  - `POST /api/v1/estimates` – создать
  - `PUT /api/v1/estimates/:id` – обновить
  - `DELETE /api/v1/estimates/:id` – удалить
  - `POST /api/v1/estimates/:id/status` – изменить статус
- [ ] **Шаблоны смет** (п.3.7):
  - `POST /api/v1/estimate-templates` – сохранить как шаблон
  - `GET /api/v1/estimate-templates` – список
  - `POST /api/v1/estimates/from-template` – создать из шаблона
- [ ] **Экспорт** (п.3.8):
  - `GET /api/v1/estimates/:id/export/pdf`
  - `GET /api/v1/estimates/:id/export/excel`
  - Использовать библиотеки: `go-pdf` / `excelize`

### 2.2. Модуль «Проекты» (раздел 4 ТЗ)

- [ ] **Project Service**:
  - Создание проекта из сметы (п.3.9) или вручную
  - Назначение/удаление работников (роль: работник/супервайзер)
  - Отправка приглашений (создание уведомлений)
- [ ] **Project Controller**:
  - `GET /api/v1/projects` – список с фильтрами (активные, завершенные, по клиенту)
  - `GET /api/v1/projects/:id` – карточка проекта
  - `POST /api/v1/projects` – создать
  - `PUT /api/v1/projects/:id` – обновить
  - `POST /api/v1/projects/:id/workers` – назначить работника
  - `DELETE /api/v1/projects/:id/workers/:workerId` – удалить работника
  - `POST /api/v1/projects/:id/workers/:workerId/role` – изменить роль
  - `POST /api/v1/projects/:id/invite` – отправить приглашение

### 2.3. Модуль «Работники» (раздел 5 ТЗ)

- [ ] **Worker Service**:
  - Регистрация заявки (первый вход)
  - Одобрение/отклонение менеджером
  - Блокировка/разблокировка
  - Обновление профиля (только менеджером)
- [ ] **Worker Controller**:
  - `GET /api/v1/workers` – список (с фильтрами по специализации, статусу)
  - `GET /api/v1/workers/:id` – карточка работника
  - `POST /api/v1/workers` – создать/зарегистрировать
  - `PUT /api/v1/workers/:id` – обновить
  - `POST /api/v1/workers/:id/approve` – одобрить
  - `POST /api/v1/workers/:id/reject` – отклонить
  - `POST /api/v1/workers/:id/block` – заблокировать
- [ ] **Ресурсы** (п.5.10):
  - `GET /api/v1/workers/resources` – статистика по специализациям
  - `GET /api/v1/workers/available` – свободные работники

---

## Этап 3. Бэкенд: Отчеты и Финансы (ключевые бизнес-процессы)

### 3.1. Модуль «Отчеты работников» (раздел 6.2-6.4 ТЗ)

- [ ] **Worker Report Service**:
  - Создание отчета (только для авторизованного работника)
  - Добавление расходов с файлами
  - Автоматический расчет часов и сумм
  - Изменение статуса: на проверке → принят / возвращен
  - Просроченные отчеты (автоматическая проверка)
- [ ] **Worker Report Controller**:
  - `GET /api/v1/reports/worker` – список с фильтрами (по проекту, статусу, периоду)
  - `GET /api/v1/reports/worker/:id` – детали
  - `POST /api/v1/reports/worker` – создать
  - `PUT /api/v1/reports/worker/:id` – редактировать (если статус "на проверке")
  - `POST /api/v1/reports/worker/:id/approve` – принять (менеджер)
  - `POST /api/v1/reports/worker/:id/reject` – вернуть на исправление

### 3.2. Модуль «Отчеты супервайзеров» (раздел 6.5-6.12 ТЗ)

- [ ] **Supervisor Report Service**:
  - Создание ежедневного отчета (только для супервайзера проекта)
  - Интеграция с AI-транскрибацией (п.6.9)
  - Фиксация статуса объекта, проблем, простоев
  - Привязка инструментов с отметкой использования
  - Проверка менеджером, добавление комментариев
- [ ] **Supervisor Report Controller**:
  - `GET /api/v1/reports/supervisor` – список с фильтрами
  - `GET /api/v1/reports/supervisor/:id` – детали
  - `POST /api/v1/reports/supervisor` – создать (с голосовым файлом)
  - `POST /api/v1/reports/supervisor/:id/transcribe` – транскрибировать (если AI не автоматический)
  - `POST /api/v1/reports/supervisor/:id/approve` – принять
  - `POST /api/v1/reports/supervisor/:id/attention` – пометить как требует внимания
  - `POST /api/v1/reports/supervisor/:id/comment` – добавить комментарий менеджера

### 3.3. Модуль «Финансы» (раздел 7 ТЗ)

- [ ] **Finance Service**:
  - Расчет бюджета проекта из сметы
  - Агрегация выплат из принятых отчетов работников
  - Расчет по проектам, работникам, категориям расходов
  - Учет потерянного времени/простоя для проектов по смете
- [ ] **Finance Controller**:
  - `GET /api/v1/finance/overview` – общая статистика
  - `GET /api/v1/finance/projects` – финансы по проектам
  - `GET /api/v1/finance/projects/:id` – детали по проекту
  - `GET /api/v1/finance/workers` – финансы по работникам
  - `GET /api/v1/finance/workers/:id` – детали по работнику
  - `GET /api/v1/finance/categories` – категории расходов

### 3.4. Модуль «Инструменты» (раздел 8 ТЗ)

- [ ] **Tool Service**:
  - CRUD инструментов с типами контроля
  - Назначение на проект с ответственным
  - Возврат с оценкой состояния
  - Автоматические проверки (калибровка, лимит использований)
- [ ] **Tool Controller**:
  - `GET /api/v1/tools` – список с фильтрами (доступные, на проекте, просроченные)
  - `GET /api/v1/tools/:id` – карточка инструмента
  - `POST /api/v1/tools` – создать
  - `PUT /api/v1/tools/:id` – обновить
  - `POST /api/v1/tools/:id/assign` – назначить на проект
  - `POST /api/v1/tools/:id/return` – вернуть
  - `POST /api/v1/tools/:id/calibrate` – записать калибровку

---

## Этап 4. Бэкенд: Дополнительный функционал и доработки

### 4.1. Главная страница менеджера (раздел 1 ТЗ)

- [ ] **Dashboard Service**:
  - Сбор срочных действий (счетчики по всем модулям)
  - Список проектов с проблемами
  - Лента последней активности
- [ ] **Dashboard Controller**:
  - `GET /api/v1/dashboard/urgent` – срочные действия
  - `GET /api/v1/dashboard/problem-projects` – проекты с проблемами
  - `GET /api/v1/dashboard/activity` – последняя активность

### 4.2. Модуль «Клиенты» (раздел 2 ТЗ)

- [ ] **Client Service**:
  - Автоматическое создание клиента из сметы при согласовании
  - Агрегация проектов, документов, финансов по клиенту
- [ ] **Client Controller**:
  - `GET /api/v1/clients` – список
  - `GET /api/v1/clients/:id` – карточка клиента
  - `PUT /api/v1/clients/:id` – обновить
  - `GET /api/v1/clients/:id/projects` – проекты клиента
  - `GET /api/v1/clients/:id/documents` – документы клиента
  - `GET /api/v1/clients/:id/finance` – финансы клиента

### 4.3. Модуль «Документы» (раздел 9 ТЗ)

- [ ] **Document Service**:
  - Привязка документов к сущностям (проект, работник, клиент, инструмент, отчет)
  - Проверка прав доступа к документам (п.9)
- [ ] **Document Controller**:
  - `GET /api/v1/documents` – список (с фильтром по владельцу)
  - `GET /api/v1/documents/:id` – скачать
  - `POST /api/v1/documents` – загрузить
  - `PUT /api/v1/documents/:id` – заменить
  - `DELETE /api/v1/documents/:id` – удалить

### 4.4. Модуль «Уведомления» (раздел 10 ТЗ)

- [ ] **Notification Service**:
  - Создание уведомлений в БД
  - Отправка через Telegram Bot (личные сообщения)
  - Автоматические триггеры (приглашения, напоминания, проблемы)
- [ ] **Notification Controller**:
  - `GET /api/v1/notifications` – список (для текущего пользователя)
  - `PUT /api/v1/notifications/:id/read` – пометить прочитанным
  - `POST /api/v1/notifications/send` – отправить вручную (менеджер)

### 4.5. Мультиязычность (раздел 12 ТЗ)

- [ ] Создать структуру для переводов:
  - `internal/i18n/ru.json`
  - `internal/i18n/en.json`
  - `internal/i18n/kk.json` (при необходимости)
- [ ] Middleware для определения языка (из запроса или из профиля пользователя)
- [ ] Функции для интерполяции строк
- [ ] Автоматический перевод инструкций (опционально через AI API)

### 4.6. Планировщик задач (cron)

- [ ] Настроить `robfig/cron` в Go
- [ ] Задачи:
  - Ежедневно: проверка просроченных отчетов работников
  - Ежедневно: проверка истекающей калибровки инструментов
  - Ежедневно: проверка невозвращенных инструментов
  - Еженедельно: напоминания о необходимости отправить отчеты

---

## Этап 5. Фронтенд: Базовые компоненты и навигация

> **Статус прототипа:** проект `client/` уже создан (Vite + TanStack Start). Есть маршруты, shadcn/ui-компоненты и экраны менеджера на мок-данных. Задачи ниже — довести до production-ready и подключить API.

### 5.1. Настройка React-приложения

- [x] Создать проект на TanStack Start (`client/`, Vite, TypeScript)
- [x] Установить зависимости:
  - `@tanstack/react-router` – file-based маршрутизация (`src/routes/`)
  - `@tanstack/react-start` – SSR, server functions (`createServerFn`)
  - `@tanstack/react-query` – кэш и загрузка данных
  - `react-hook-form` + `@hookform/resolvers` + `zod` – формы и валидация
  - `tailwindcss` v4 + shadcn/ui – UI-кит
  - `sonner` – toast-уведомления
  - `recharts` – графики (финансы, дашборд)
  - `lucide-react` – иконки
- [ ] Настроить `vite.config.ts`: прокси `/api` → Go-бэкенд (dev), env-переменные
- [ ] Зафиксировать структуру папок (расширить прототип):
  ```
  client/src/
    /routes/              # страницы (file-based routing, не pages/)
      __root.tsx          # app shell, QueryClientProvider
      index.tsx           # главная менеджера
      projects.index.tsx
      projects.$projectId.tsx
      estimates.index.tsx
      estimates.$estimateId.tsx
      workers.index.tsx
      workers.$workerId.tsx
      reports.index.tsx
      reports.$reportId.tsx
      daily-reports.$dailyId.tsx
      finance.index.tsx
      tools.index.tsx
      tools.$toolId.tsx
      clients.$clientId.tsx
    /components/
      /ui/                # shadcn/ui (button, dialog, tabs, ...)
      /layout/            # AppLayout, BottomNav, AppHeader
      /common/            # StatusBadge, EmptyState, FileUpload, ...
      /estimates/         # доменные компоненты
      /projects/
      /workers/
      /reports/
    /lib/
      /api/               # HTTP-клиент, server functions, типы DTO
      utils.ts
      config.server.ts
    /hooks/               # useAuth, useTelegram, use-mobile
    /types/               # общие TypeScript-типы (User, Project, ...)
    /i18n/                # переводы (react-i18next)
  ```

### 5.2. Подключение Telegram WebApp SDK

- [ ] Установить `@telegram-apps/sdk` или подключить скрипт `telegram-web-app.js` в `__root.tsx`
- [ ] Создать хук `useTelegram()`:
  - Получение `initData` из `Telegram.WebApp.initData`
  - Определение темы (светлая/тёмная) и синхронизация с Tailwind (`class="dark"`)
  - Обёртки над `WebApp.showAlert`, `WebApp.showConfirm`, `WebApp.HapticFeedback`
  - Кнопки `BackButton`, `MainButton` (привязка к навигации TanStack Router)
- [ ] Адаптировать viewport под Mini App (`viewport-fit=cover`, safe-area)

### 5.3. Аутентификация и состояние пользователя

- [ ] Создать `AuthProvider` + хук `useAuth()`:
  - `user` – данные пользователя
  - `isAuthenticated`, `isLoading`
  - `role` – `'manager' | 'worker' | 'supervisor'`
  - `authMethod` – `'telegram' | 'credentials'` (как пользователь вошёл)
- [ ] Страницы входа и регистрации — `routes/auth/login.tsx`, `routes/auth/register.tsx`:
  - Формы на **react-hook-form + zod**: email, пароль; для регистрации — имя, фамилия, телефон
  - Кнопка «Войти» → `POST /api/v1/auth/login`
  - Кнопка «Зарегистрироваться» → `POST /api/v1/auth/register`
  - Ссылка «Войти через Telegram» (если открыто в Mini App — автоматический вход через `initData`)
  - Показывать форму email/пароль, если приложение открыто **вне** Telegram (браузер, dev)
- [ ] Реализовать `lib/api/auth.ts`:
  - `loginWithCredentials(email, password)`, `registerWithCredentials(...)`, `loginWithTelegram(initData)`
  - `fetchCurrentUser()` → `GET /api/v1/auth/me`
  - Сохранение JWT (localStorage; в Mini App — опционально `WebApp.CloudStorage`)
  - Интерцептор для fetch/axios: заголовок `Authorization: Bearer <token>`
- [ ] Route guard в TanStack Router (`beforeLoad`):
  - Редирект неавторизованных на `/auth/login`
  - Редирект работника без одобрения на `/onboarding` или `/pending-approval`
  - Разделение маршрутов менеджера и работника по роли
- [ ] **Важно:** при первом входе работника (любой способ auth) — редирект на страницу анкеты, если профиль не заполнен

### 5.4. Общие компоненты

- [x] shadcn/ui: `Button`, `Dialog`, `Tabs`, `Badge`, `Input`, `Select`, `Sheet`, `Skeleton`, `Table`, ...
- [ ] Вынести из маршрутов в переиспользуемые компоненты:
  - `AppLayout` – общий макет с нижним меню
  - `BottomNav` – навигация (7 пунктов, горизонтальный скролл для менеджера)
  - `AppHeader` – заголовок раздела + кнопка «Назад» (интеграция с `BackButton`)
  - `LoadingSpinner` / `Skeleton` – состояние загрузки
  - `EmptyState` – «нет данных»
  - `StatusBadge` – статусы (на проверке, принят, просрочен и т.д.)
  - `SearchInput` – поле поиска
  - `FilterDropdown` – выпадающий фильтр
  - `FileUpload` – загрузка файлов с превью
  - `ConfirmDialog` – подтверждение (shadcn `AlertDialog`)
  - Toasts через `sonner` (`toast.success`, `toast.error`)

### 5.5. Работа с API

- [ ] Создать `lib/api/client.ts` – базовый fetch/axios с JWT и обработкой ошибок
- [ ] Типизированные модули API (TypeScript + Zod-схемы ответов):
  - `auth.ts`
  - `estimates.ts`
  - `projects.ts`
  - `workers.ts`
  - `reports.ts`
  - `finance.ts`
  - `tools.ts`
  - `clients.ts`
  - `documents.ts`
  - `notifications.ts`
  - `dashboard.ts`
- [ ] TanStack Query: query keys, `useQuery` / `useMutation` / `useInfiniteQuery`
- [ ] Опционально: `createServerFn` для проксирования чувствительных запросов через TanStack Start (BFF-паттерн)
- [ ] Заменить мок-данные в маршрутах на реальные запросы к Go API

---

## Этап 6. Фронтенд: Менеджерский интерфейс

> **Статус прототипа:** экраны собраны в `client/src/routes/` на мок-данных. Нужны: вынос компонентов, формы с react-hook-form, мутации через TanStack Query, подключение API.

### 6.1. Страница «Главная» (Dashboard) — `routes/index.tsx`

- [x] **Срочные действия** – блоки со счётчиками и превью записей
- [x] **Проекты с проблемами** – первые 3 проекта
- [x] **Последняя активность** – список последних событий
- [x] **Быстрые действия** – кнопки (создать проект, работника, смету, инструмент, уведомление)
- [ ] Подключить `GET /api/v1/dashboard/*`, loading/error states (Query + Skeleton)

### 6.2. Страница «Проекты» — `routes/projects.index.tsx`, `routes/projects.$projectId.tsx`

- [x] Список проектов с карточками (п.4.2)
- [x] Фильтры: Все / Активные / Завершённые / Архив / По клиенту
- [x] Поиск по названию
- [ ] Кнопка «Создать проект» (выбор: вручную / из сметы) + форма
- [x] **Карточка проекта** (п.4.5) с табами: Обзор, Работники, Отчёты, Инструменты, Документы, Финансы
- [ ] Быстрые действия внутри проекта (п.4.7) + мутации API

### 6.3. Страница «Сметы» — `routes/estimates.index.tsx`, `routes/estimates.$estimateId.tsx`

- [x] Список с табами: Черновики / Отправленные / Согласованные / Отклонённые
- [x] Поиск
- [ ] Кнопка «Создать смету»
- [x] **Конструктор сметы** (UI на моках): блоки услуг/ресурсов/расходов, расчёт итогов, шаблон
- [ ] Drag-and-drop блоков (`@dnd-kit/core` или аналог)
- [ ] Экспорт: PDF / Excel (скачивание с бэкенда)
- [ ] Изменение статуса: Отправить / Согласовать / Отклонить
- [ ] Из согласованной сметы → создать проект (п.3.9)

### 6.4. Страница «Работники» — `routes/workers.index.tsx`, `routes/workers.$workerId.tsx`

- [x] Список с табами, фильтры, поиск
- [ ] Кнопка «Добавить работника»
- [x] **Карточка работника** (п.5.4) с табами: Профиль, Документы, Проекты, Финансы, Инструменты
- [ ] Вкладка «Ресурсы» (п.5.10)

### 6.5. Страница «Отчёты» — `routes/reports.*`, `routes/daily-reports.$dailyId.tsx`

- [x] Переключение: Отчёты работников / Отчёты супервайзеров
- [x] Фильтры (п.6.1), списки и детальный просмотр
- [ ] Кнопки: Принять / Вернуть / Требует внимания / Комментарий (мутации)

### 6.6. Страница «Финансы» — `routes/finance.index.tsx`

- [x] Обзор с диаграммами (recharts), финансы по проектам/работникам, категории расходов
- [ ] Детализация при клике + данные с API

### 6.7. Страница «Инструменты» — `routes/tools.index.tsx`, `routes/tools.$toolId.tsx`

- [x] Список с табами, фильтры, поиск, карточка инструмента
- [ ] Кнопка «Добавить инструмент», назначение/возврат, предупреждения (п.8.11–8.13)

### 6.8. Клиенты — `routes/clients.$clientId.tsx`

- [x] Переключатель Проекты / Клиенты, карточка клиента (п.2.2)
- [ ] Подключение API, редактирование контактов

---

## Этап 7. Фронтенд: Рабочий интерфейс (работник/супервайзер)

> **Статус:** экраны работника ещё не вынесены в отдельные маршруты — реализовать после менеджерского интерфейса и auth.

### 7.1. Определение роли

- [ ] `beforeLoad` в TanStack Router: читать роль из JWT / `useAuth()`
- [ ] Layout `_worker.tsx` с упрощённым нижним меню:
  - Главная
  - Мои проекты
  - Отчёты
  - Документы
  - Профиль
- [ ] Условный рендер `BottomNav` по роли (менеджер vs работник)

### 7.2. Первый вход работника (п.11.1) — `routes/onboarding.tsx`

> Применяется после **любого** первого входа: Telegram или `POST /auth/register`. Если профиль неполный или статус `pending` — показать анкету / ожидание.

- [ ] Страница анкеты (react-hook-form + zod):
  - Имя, фамилия, телефон, Telegram
  - Должность, специализация, ставка
  - Загрузка документов (паспорт, права, фото) — `FileUpload`
- [ ] Отправка на проверку (`POST /api/v1/workers`)
- [ ] Страница ожидания одобрения — `routes/pending-approval.tsx`

### 7.3. Главная работника — `routes/worker/index.tsx`

- [ ] Мои активные проекты
- [ ] Быстрые действия:
  - Подтвердить участие
  - Отправить отчёт
  - Загрузить документ
  - Исправить отчёт (если возвращён)

### 7.4. Мои проекты — `routes/worker/projects.tsx`

- [ ] Список проектов: роль, статус подтверждения
- [ ] Подтверждение участия
- [ ] Детали проекта (ограниченный просмотр)

### 7.5. Еженедельные отчёты — `routes/worker/reports.tsx`

- [ ] Создание отчёта (форма + react-hook-form):
  - Выбор проекта (только активные)
  - Часы по дням (пн–вс)
  - Описание работ
  - Расходы (тип, сумма, комментарий, файл)
  - Автоматический расчёт итогов
- [ ] Список своих отчётов с фильтрами
- [ ] Редактирование (статус «на проверке» или «возвращён»)

### 7.6. Супервайзерский режим (п.11.3)

- [ ] Кнопка «Создать ежедневный отчёт» в карточке проекта (если роль супервайзер)
- [ ] Форма ежедневного отчёта (п.6.6–6.12):
  - Запись голоса (WebApp) + отправка на транскрибацию
  - Статус объекта: Работа идёт / Есть проблема / Есть простой
  - Текстовое описание, фото
  - Выполненные работы, состав бригады
  - Проблемы, простой, инструменты на объекте
- [ ] Просмотр созданных отчётов

### 7.7. Документы работника — `routes/worker/documents.tsx`

- [ ] Список документов, загрузка/замена

### 7.8. Профиль работника — `routes/worker/profile.tsx`

- [ ] Просмотр данных (read-only)
- [ ] Смена языка (react-i18next)
- [ ] Выход (очистка JWT)

---

## Этап 8. Интеграция с Telegram Bot и Mini App

### 8.1. Создание и настройка бота

- [ ] Зарегистрировать бота через @BotFather
- [ ] Получить `TELEGRAM_BOT_TOKEN`
- [ ] Настроить команды:
  - `/start` – приветствие и ссылка на Mini App
  - `/myprojects` – список проектов
  - `/report` – быстро создать отчет
  - `/help` – справка

### 8.2. Настройка WebApp

- [ ] В `@BotFather` настроить `setWebApp` для кнопки "Открыть приложение"
- [ ] Сгенерировать URL для фронтенда (например, `https://crm.example.com`)
- [ ] Передавать параметры через `start_param` для глубоких ссылок:
  - `?project=123` – открыть проект
  - `?report=456` – открыть отчет
  - `?estimate=789` – открыть смету

### 8.3. Бэкенд: Интеграция с Telegram Bot API

- [ ] Создать пакет `telegram` с клиентом (использовать `go-telegram-bot-api`)
- [ ] Реализовать отправку сообщений:
  ```go
  type TelegramService interface {
      SendNotification(chatID int64, text string, buttons [][]InlineButton) error
      SendDocument(chatID int64, file []byte, filename string) error
  }
  ```
- [ ] Webhook handler для обработки входящих команд (если требуется)

### 8.4. Отправка уведомлений через бота

- [ ] При создании уведомления в БД:
  - Отправлять сообщение через Telegram
  - В сообщение добавлять кнопку "Открыть" с URL на Mini App
- [ ] Обработка ошибок при отправке (пользователь не начал бота)

### 8.5. Безопасность

- [ ] Валидация `initData` на бэкенде (п.1.4)
- [ ] Использование HTTPS для фронтенда
- [ ] Ограничение CORS в продакшене

### 8.6. Фронтенд: Интеграция с ботом

- [ ] В `__root.tsx` или `AuthProvider`: при старте Mini App
  - Получение `initData` из `Telegram.WebApp` (хук `useTelegram`)
  - Отправка на `POST /api/v1/auth/telegram` через TanStack Query mutation
- [ ] Deep links через `start_param` → `router.navigate()` (TanStack Router)
- [ ] `WebApp.showAlert()` / `showConfirm()` для системных сообщений
- [ ] `WebApp.CloudStorage` для JWT (опционально, вместо localStorage)
- [ ] `BackButton` / `MainButton` — синхронизация с навигацией и submit-форм

---

## 📋 Общие советы для работы с Cursor

### 🚀 Как эффективно использовать Cursor на каждом этапе

**1. Создание моделей и миграций (Go)**

```
Prompt: "Создай модель Estimate в Go с полями: ID, Name, CompanyName, ContactPerson, Phone, Email, Country, City, Comment, Status (draft/sent/approved/rejected), CreatedAt, UpdatedAt. Используй gorm. И создай миграцию для PostgreSQL."
```

**2. REST API контроллеры**

```
Prompt: "Создай REST контроллер для смет на Go с использованием gin. Нужны эндпоинты: GET /estimates (список с фильтрами), GET /estimates/:id, POST /estimates, PUT /estimates/:id, DELETE /estimates/:id. Используй сервисный слой."
```

**3. React-компоненты и маршруты**

```
Prompt: "В client/src/routes/projects.index.tsx замени мок-данные на useQuery с GET /api/v1/projects. Добавь фильтры по статусу и поиск. Используй shadcn/ui Table и Badge, TanStack Query для кэша."
```

**4. Работа с формами**

```
Prompt: "Создай форму создания сметы в client/src/components/estimates/EstimateForm.tsx с react-hook-form и zod. Динамические блоки (услуги, ресурсы, расходы) через useFieldArray. Кнопки добавления/удаления блоков."
```

**5. TanStack Query + API**

```
Prompt: "Создай lib/api/estimates.ts с типами TypeScript и zod-схемами. Добавь useEstimates(), useEstimate(id), useCreateEstimate() — хуки на TanStack Query с invalidateQueries после мутаций."
```

**6. Написание тестов**

```
Prompt: "Напиши unit-тесты для сервиса отчетов на Go. Нужно протестировать: создание отчета, добавление расходов, изменение статуса, расчет итогов."
```

### 🛠️ Полезные инструменты и команды


| Для чего          | Что использовать | Пример команды                                          |
| ----------------- | ---------------- | ------------------------------------------------------- |
| Генерация Swagger | `swaggo`         | `swag init -g main.go`                                  |
| Hot-reload Go     | `air`            | `air` в корне проекта                                   |
| Генерация типов   | `go generate`    | `//go:generate ...`                                     |
| Миграции БД       | `golang-migrate` | `migrate -path migrations -database "$DATABASE_URL" up` |
| Линтер Go         | `golangci-lint`  | `golangci-lint run`                                     |
| Сборка React      | `vite` (bun)     | `cd client && bun run build`                            |
| Dev-сервер        | TanStack Start   | `cd client && bun run dev`                              |
| Линтер React      | `eslint`         | `cd client && bun run lint`                             |
| Тесты React       | `Vitest`         | `cd client && bun run test`                             |
| shadcn/ui         | CLI              | `cd client && bunx shadcn@latest add <component>`       |


### 📁 Структура проекта (рекомендация)

**Бэкенд (Go):**

```
crm-backend/
├── cmd/
│   └── server/
│       └── main.go
├── internal/
│   ├── config/
│   ├── database/
│   ├── models/
│   ├── repositories/
│   ├── services/
│   ├── handlers/
│   ├── middleware/
│   ├── telegram/
│   ├── i18n/
│   └── utils/
├── pkg/
│   └── (переиспользуемые пакеты)
├── migrations/
├── docs/
├── test/
├── go.mod
├── go.sum
├── .air.toml
└── .env.example
```

**Фронтенд (React + TanStack) — `client/`:**

```
client/
├── src/
│   ├── routes/                  # file-based routing (TanStack Router)
│   │   ├── __root.tsx           # app shell, QueryClientProvider
│   │   ├── index.tsx            # главная менеджера
│   │   ├── projects.index.tsx
│   │   ├── projects.$projectId.tsx
│   │   ├── estimates.index.tsx
│   │   ├── estimates.$estimateId.tsx
│   │   ├── workers.index.tsx
│   │   ├── workers.$workerId.tsx
│   │   ├── reports.index.tsx
│   │   ├── reports.$reportId.tsx
│   │   ├── daily-reports.$dailyId.tsx
│   │   ├── finance.index.tsx
│   │   ├── tools.index.tsx
│   │   ├── tools.$toolId.tsx
│   │   ├── clients.$clientId.tsx
│   │   ├── auth/
│   │   │   ├── login.tsx        # вход email + пароль
│   │   │   └── register.tsx     # регистрация работника
│   │   └── worker/              # маршруты работника (этап 7)
│   ├── components/
│   │   ├── ui/                  # shadcn/ui
│   │   ├── layout/              # AppLayout, BottomNav, AppHeader
│   │   ├── common/
│   │   ├── estimates/
│   │   ├── projects/
│   │   └── ...
│   ├── lib/
│   │   ├── api/                 # HTTP-клиент, server functions, хуки Query
│   │   ├── utils.ts
│   │   └── config.server.ts
│   ├── hooks/                   # useAuth, useTelegram, use-mobile
│   ├── types/
│   ├── i18n/
│   ├── router.tsx
│   ├── routeTree.gen.ts         # автогенерация, не редактировать
│   ├── server.ts
│   ├── start.ts
│   └── styles.css
├── package.json
├── vite.config.ts
├── tsconfig.json
└── .env.example
```

### ⚠️ Важные моменты при разработке

1. **Мультиязычность** – закладывайте с самого начала. В Go — структуры с мапами переводов. В React — `react-i18next`.
2. **Аутентификация** – два канала: Telegram `initData` (обязательная проверка на бэкенде) и email/пароль (bcrypt). Не доверяйте данным с фронтенда. В dev менеджера удобно создавать через seed или форму логина.
3. **Telegram WebApp** – при открытии внутри Telegram предпочитать автоматический вход через `initData`; форма email/пароль — fallback для браузера.
4. **Типизация** – в Go `struct` для ответов; в React — TypeScript + Zod-схемы для валидации API-ответов.
5. **TanStack Router** – маршруты только в `src/routes/`, не создавать `pages/` (это Next.js-конвенция). `routeTree.gen.ts` генерируется автоматически.
6. **Состояние сервера** – TanStack Query для данных с API; локальный UI-state — `useState` / `useReducer`. Не дублировать серверные данные в глобальном store без необходимости.
7. **Финансовые расчёты** – `decimal.Decimal` в Go; на фронте — целые копейки (`number` в минорных единицах) или `decimal.js`.
8. **Тестирование** – unit-тесты Go-сервисов + компонентные тесты React (`@testing-library/react`).
9. **Логирование** – структурированное (`log/slog` в Go).
10. **Обработка ошибок** – понятные сообщения для фронта; на клиенте — `toast.error()` через sonner.
11. **Загрузка файлов** – лимит 10–20 MB, проверка MIME-типов.