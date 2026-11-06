# DB Demo: фронтенд

Интерфейс [стенда сравнения СУБД](../README.md): состояние четырёх баз, выбор СУБД и запроса, таблица результатов с латентностью и метриками, пример возвращённых данных.

- API: `GET /api/status`, `GET /api/queries`, `POST /api/run` (адрес — `VITE_API_URL`, по умолчанию `http://localhost:8080`).
- Стек: React, TypeScript, TanStack Start / Router / Query, Tailwind CSS, shadcn/ui.

```bash
npm install
VITE_API_URL=http://localhost:8080 npm run dev
```

В Docker собирается вместе со всем стендом: `docker compose up -d --build` из корня проекта.
