# Примеры кода

Паттерны и архитектура на Python, а также CI/CD-пайплайн из коммерческого проекта.

- [Python: паттерны и Clean Architecture](#python-паттерны-и-clean-architecture)
- [CI/CD: GitLab для Laravel API](#cicd-gitlab-для-laravel-api)

## Python: паттерны и Clean Architecture

Небольшие самодостаточные модули по паттернам ООП и слоистой архитектуре. Redis и PostgreSQL не поднимаются — для тестов хватает in-memory реализаций.

Текстовая база: [Современное ООП: паттерны, которые действительно работают](../Теория%20(short%20posts)/Современный%20ООП.%20Паттерны,%20которые%20действительно%20работают.md).

### Что внутри

| Паттерн | Каталог |
| --- | --- |
| Abstract Factory / Factory Method | [creational/abstract_factory](./creational/abstract_factory/) |
| Builder | [creational/builder](./creational/builder/) |
| Adapter | [structural/adapter](./structural/adapter/) |
| Decorator | [structural/decorator](./structural/decorator/) |
| Observer (asyncio) | [behavioral/observer](./behavioral/observer/) |
| Strategy | [behavioral/strategy](./behavioral/strategy/) |
| Clean Architecture + DI | [architecture/clean_di](./architecture/clean_di/) |

### Запуск

```bash
cd "Примеры кода (code examples)"
py -3 -m pip install -r requirements.txt
py -3 -m pytest -q
```

HTTP-эндпоинт регистрации (`architecture/clean_di`):

```bash
cd architecture/clean_di
py -3 -c "import uvicorn; from container_and_api import create_app; uvicorn.run(create_app(), host='127.0.0.1', port=8000)"
```

`POST /register` — тело `{"email": "...", "password": "..."}`.

## CI/CD: GitLab для Laravel API

[ci-cd/gitlab-laravel](./ci-cd/gitlab-laravel/) — пайплайн из коммерческого проекта, переработанный и обезличенный: Pint и PHPStan с отчётом Code Quality, тесты на MySQL и Redis с покрытием в MR, сборка Docker-образов в GitLab Registry, деплой на staging и production по SSH с health check и автоматическим откатом. В README — схема и таблица «было → стало» с обоснованием каждого решения.
