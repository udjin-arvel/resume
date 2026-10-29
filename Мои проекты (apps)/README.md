# Мои проекты

15 публичных проектов. Каждый каталог — отдельный продукт со своим README: задача, что внутри, стек и как запустить.

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

## Веб-продукты

| Проект | Что это | Стек |
| --- | --- | --- |
| [auto-shop-vue-client](./auto-shop-vue-client) | Сервис импорта автомобилей из Китая: витрина и кабинет менеджера от заявки до логистики, RU/CN | Nuxt 3, Vue 3, TypeScript, Pinia, Tailwind, Docker, GitLab CI |
| [network-manager-crm-web-app](./network-manager-crm-web-app) | Mini CRM для полевых команд: объекты, сметы, отчёты; работает как Telegram Mini App | Go (Gin), PostgreSQL, React, TanStack |
| [mybook-web-app](./mybook-web-app) | Платформа для историй, лора и заметок одной вселенной с уровнями и внутренней экономикой | Nuxt 4, Vue 3, Express, Prisma, PostgreSQL |
| [street-cameras-vue-client](./street-cameras-vue-client) | Карта городских камер с живым видео и архивом | Vue 3, Leaflet, Video.js |
| [landing-example](./landing-example) | Лендинг выездного сервиса ремонта техники | Vue 3, TypeScript, Vite, Tailwind |

## Мобильные приложения

| Проект | Что это | Стек |
| --- | --- | --- |
| [scanme-mobile-app](./scanme-mobile-app) | Сканер состава продуктов по штрих-коду: приложение, API и админка | Flutter, Go, PostgreSQL, Redis, React |
| [legal-search-web-app](./legal-search-web-app) | Полнотекстовый поиск по статьям УК, ТК, КоАП, ГК и НК | React Native (Expo), Supabase, PostgreSQL FTS |
