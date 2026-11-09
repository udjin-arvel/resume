# Мои проекты

19 публичных проектов. Каждый каталог — отдельный продукт со своим README: задача, что внутри, стек и как запустить.

[← На главную](../README.md)

## AI и LLM

| Проект | Что это | Стек |
| --- | --- | --- |
| [criminal-search-web-app](./criminal-search-web-app) | AI-агент по УК РФ: описываешь случай своими словами, агент находит статьи и объясняет квалификацию. **RAG + tool calling**, шаги поиска стримятся в интерфейс | Python, FastAPI, DeepSeek, ChromaDB, e5-эмбеддинги, React |
| [media-generator-react-client](./media-generator-react-client) | Студия контента для карточек маркетплейсов: генерация и редактирование изображений, канвас из цепочек шагов | React 19, Redux Toolkit, FSD, React Flow, Konva, GraphQL |
| [proxy-python-app](./proxy-python-app) | Backend студии: собирает спецификацию правки и промпт под конкретную модель, ходит в модели генерации текста, изображений и видео | Python, FastAPI, Pydantic, OpenAI, Runway |
| [conquer-web-app](./conquer-web-app) | Разбор сайта конкурента: парсинг страницы, анализ моделью, метрики и сводка; тяжёлая работа в очереди | FastAPI, Celery, Redis, PostgreSQL, Playwright, DeepSeek |
| [product-description-ai-package](./product-description-ai-package) | PHP-библиотека на Packagist: продающее описание товара по названию и фото | PHP 8.1, PSR, Vision API, PHPUnit, PHPStan lvl 8 |
| [math-help-chrome-ext](./math-help-chrome-ext) | API расширения Chrome: пошаговое решение задачи по скриншоту, стриминг ответа, подписки. **В Chrome Web Store: 871 пользователь, рейтинг 5,0** | NestJS, TypeORM, PostgreSQL, OpenAI, Stripe |
| [hh-hunter-chrome-ext](./hh-hunter-chrome-ext) | Расширение Chrome: сопроводительное письмо под вакансию HeadHunter и опыт кандидата | WXT, React 19, Zustand, Zod, Vitest, DeepSeek |
| [smart-resume-chrome-ext](./smart-resume-chrome-ext) | Расширение Chrome: резюме и сопроводительное под описание вакансии, тарифы и оплата | React, NestJS, PostgreSQL, OpenAI, Stripe |

## Бэкенд, базы данных и производительность

| Проект | Что это | Стек |
| --- | --- | --- |
| [polyglot-backend-benchmark](./polyglot-backend-benchmark) | **Один REST API на Go, Node.js, PHP и Python** без фреймворков: общий OpenAPI-контракт, PostgreSQL на 100 000 записей, нагрузочные прогоны k6 с RPS, p95/p99, памятью и cold start, сверка ответов всех бэкендов в UI | Go, Node.js, PHP, Python, PostgreSQL, OpenAPI, k6, Docker Compose, GitHub Actions, React |
| [db-demo](./db-demo) | **ClickHouse против PostgreSQL, MySQL и SQLite** на одних и тех же 5 млн строк: пять запросов, латентность и планы каждой СУБД. На агрегациях ClickHouse быстрее в 4–140 раз, на точечном поиске проигрывает B-tree | Go (chi, pgx, clickhouse-go), PostgreSQL, MySQL, SQLite, ClickHouse, React, Docker Compose |

## Веб-продукты

| Проект | Что это | Стек |
| --- | --- | --- |
| [auto-shop-vue-client](./auto-shop-vue-client) | Сервис импорта автомобилей из Китая: витрина и кабинет менеджера от заявки до логистики, RU/CN | Nuxt 3, Vue 3, TypeScript, Pinia, Tailwind, Docker, GitLab CI |
| [food-source-web-app](./food-source-web-app) | B2B-помощник закупщика: подбор поставщиков под запрос, прозрачный скоринг с объяснением причин, сравнение 2–3 вариантов, шортлист в CSV | FastAPI, SQLModel, pytest, React 19, TanStack, Docker Compose |
| [network-manager-crm-web-app](./network-manager-crm-web-app) | Mini CRM для полевых команд: объекты, сметы, отчёты; работает как Telegram Mini App | Go (Gin), PostgreSQL, React, TanStack |
| [mybook-web-app](./mybook-web-app) | Платформа для историй, лора и заметок одной вселенной с уровнями и внутренней экономикой | Nuxt 4, Vue 3, Express, Prisma, PostgreSQL |
| [street-cameras-vue-client](./street-cameras-vue-client) | Карта городских камер с живым видео и архивом | Vue 3, Leaflet, Video.js |
| [landing-example](./landing-example) | Личный сайт [arvelov.online](https://arvelov.online): услуги, TheBook, контакты; статика с деплоем на shared-хостинг | HTML, CSS, JS, React (прототип), Bash |

## DevOps и инфраструктура

| Проект | Что это | Стек |
| --- | --- | --- |
| [gitops-demo (k8s)](./gitops-demo%20%28k8s%29) | GitOps-стенд: кластер целиком описан в Git, Argo CD (App of Apps) разворачивает приложение и мониторинг сам. Sync waves, SOPS-секреты, сценарий сбоя и восстановления через коммит | Kubernetes (Kind), Argo CD, Helm, Prometheus, Grafana, SOPS |

## Мобильные приложения

| Проект | Что это | Стек |
| --- | --- | --- |
| [scanme-mobile-app](./scanme-mobile-app) | Сканер состава продуктов по штрих-коду: приложение, API и админка | Flutter, Go, PostgreSQL, Redis, React |
| [legal-search-mobile-app](./legal-search-web-app) | Полнотекстовый поиск по статьям УК, ТК, КоАП, ГК и НК | React Native (Expo), Supabase, PostgreSQL FTS |
