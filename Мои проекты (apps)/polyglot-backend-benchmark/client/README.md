# Polyglot Bench: клиент

Интерфейс [Polyglot Backend Benchmark](../README.md):

- **Записи** — список, поиск, фильтр по категории, создание, правка и удаление через выбранный бэкенд (Go, Node.js, PHP или Python).
- **Сравнить бэкенды** — один запрос во все четыре реализации, сверка ответов с эталоном и медиана времени.
- **Бенчмарки** — графики RPS, латентности, памяти и cold start из JSON в `public/bench/` (обновляются командой `make publish-bench`).

Стек: React, TypeScript, TanStack Start / Router / Query, Tailwind CSS. Снаружи отдаётся через nginx, который проксирует `/api/<backend>/` на нужный сервис.

```bash
npm install
npm run dev        # адреса бэкендов — VITE_API_BASE_* в .env.local
```

В Docker собирается вместе со всем стендом: `make up` из корня проекта.
