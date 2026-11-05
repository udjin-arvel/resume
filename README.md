# Евгений Арвелов — портфолио

**Fullstack / AI-разработчик** · 10 лет коммерческой разработки · Томск, удалённо

[Резюме на hh.ru](https://hh.ru/resume/59a0cd89ff114ae8f50039ed1f6b51454d3951) · [Telegram @arvelov](https://t.me/arvelov) · udjin.arvel@gmail.com

Публичные проекты, примеры кода и короткие статьи по веб-разработке и работе с LLM. У каждого проекта свой README: задача, что внутри, стек и как запустить.

## Для рекрутера

Fullstack / AI-разработчик: Python, PHP, Go, TypeScript, React, Vue; запускаю продукты на LLM до production.
- [Студия контента для маркетплейсов](./Мои%20проекты%20(apps)/media-generator-react-client) + [прокси к моделям генерации](./Мои%20проекты%20(apps)/proxy-python-app) — AI-генератор фото и видео, ~8 000 генераций за первый месяц.
- [AI-агент по УК РФ](./Мои%20проекты%20(apps)/criminal-search-web-app) — RAG и tool calling: агент сам ищет статьи кодекса по описанию случая.
- [Импорт автомобилей из Китая](./Мои%20проекты%20(apps)/auto-shop-vue-client) — витрина и кабинет менеджера: от заявки до логистики, RU/CN.

Контакты: Telegram [@arvelov](https://t.me/arvelov) · udjin.arvel@gmail.com · [резюме на hh.ru](https://hh.ru/resume/59a0cd89ff114ae8f50039ed1f6b51454d3951)

## Как это выглядит

| Студия контента для маркетплейсов | FoodSource: помощник закупщика | Импорт автомобилей из Китая |
| --- | --- | --- |
| [<img src="./Мои%20проекты%20(apps)/media-generator-react-client/screenshot2.png" alt="Канвас студии контента" width="300">](./Мои%20проекты%20(apps)/media-generator-react-client) | [<img src="./Мои%20проекты%20(apps)/food-source-web-app/screenshot.png" alt="FoodSource" width="300">](./Мои%20проекты%20(apps)/food-source-web-app) | [<img src="./Мои%20проекты%20(apps)/auto-shop-vue-client/preview.png" alt="Импорт автомобилей из Китая" width="300">](./Мои%20проекты%20(apps)/auto-shop-vue-client) |
| **Math Help AI** (871 пользователь в Chrome Web Store) | **TheBook** | **Личный сайт arvelov.online** |
| [<img src="./Мои%20проекты%20(apps)/math-help-chrome-ext/screenshot1.png" alt="Math Help AI в Chrome Web Store" width="300">](./Мои%20проекты%20(apps)/math-help-chrome-ext) | [<img src="./Мои%20проекты%20(apps)/mybook-web-app/screenshot.png" alt="TheBook" width="300">](./Мои%20проекты%20(apps)/mybook-web-app) | [<img src="./Мои%20проекты%20(apps)/landing-example/preview.png" alt="arvelov.online" width="300">](./Мои%20проекты%20(apps)/landing-example) |
| **GitOps на Kubernetes: Argo CD** | **Мониторинг: Grafana** | **Сбой и восстановление через Git** |
| [<img src="./Мои%20проекты%20(apps)/gitops-demo%20%28k8s%29/screens/screenshot2.png" alt="Argo CD: App of Apps" width="300">](./Мои%20проекты%20(apps)/gitops-demo%20%28k8s%29/) | [<img src="./Мои%20проекты%20(apps)/gitops-demo%20%28k8s%29/screens/screenshot4-preview.png" alt="Grafana: ресурсы пода" width="300">](./Мои%20проекты%20(apps)/gitops-demo%20%28k8s%29/) | [<img src="./Мои%20проекты%20(apps)/gitops-demo%20%28k8s%29/screens/screenshot6.png" alt="Grafana Explore: под вернулся в Running" width="300">](./Мои%20проекты%20(apps)/gitops-demo%20%28k8s%29/) |
| **ScanMe: мобильное приложение** | **AI-агент по УК РФ** | **Radar CRM** |
| [<img src="./Мои%20проекты%20(apps)/scanme-mobile-app/screenshot.jpg" alt="ScanMe" width="200">](./Мои%20проекты%20(apps)/scanme-mobile-app) | [<img src="./Мои%20проекты%20(apps)/criminal-search-web-app/screenshot.png" alt="AI-агент по УК РФ" width="300">](./Мои%20проекты%20(apps)/criminal-search-web-app) | [<img src="./Мои%20проекты%20(apps)/network-manager-crm-web-app/screenshot.png" alt="Radar CRM" width="300">](./Мои%20проекты%20(apps)/network-manager-crm-web-app) |

## Стек

| Направление | Технологии |
| --- | --- |
| AI / LLM | RAG, tool calling, structured output, OpenAI API, DeepSeek, ChromaDB, sentence-transformers, Claude Code, Cursor |
| Backend | Python (FastAPI, Celery, SQLAlchemy), PHP (Laravel), Go (Gin, chi), Node.js (NestJS, Express) |
| Frontend | React, TypeScript, Redux Toolkit, Zustand, TanStack, Vue 3, Nuxt, Pinia, Tailwind CSS |
| Данные | PostgreSQL, ClickHouse, MySQL, Redis, Kafka |
| Mobile | Flutter, React Native (Expo) |
| Инфраструктура | Kubernetes, Argo CD (GitOps), Helm, SOPS, Docker, GitLab CI/CD, Nginx, Linux, Sentry, Prometheus, Grafana |

## Что внутри

| Раздел | Что там |
| --- | --- |
| [Мои проекты (apps)](./Мои%20проекты%20(apps)/README.md) | 17 проектов: AI и LLM, веб-продукты, DevOps (Kubernetes, GitOps), мобильные приложения, расширения Chrome |
| [Примеры кода (code examples)](./Примеры%20кода%20(code%20examples)/README.md) | Паттерны и Clean Architecture на Python (покрыты pytest); [CI/CD-пайплайн GitLab для Laravel](./Примеры%20кода%20(code%20examples)/ci-cd/gitlab-laravel/) с деплоем, health check и откатом |
| [Теория (short posts)](./Теория%20(short%20posts)/README.md) | Короткие статьи: Docker и безопасность, FSD, надёжность интеграций, React Hooks, ООП, работа с контекстом LLM |
