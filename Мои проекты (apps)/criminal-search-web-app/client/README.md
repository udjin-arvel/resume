# Клиент: поиск по УК РФ

Веб-интерфейс [AI-агента по УК РФ](../README.md): поле для описания случая, шаги поиска в реальном времени и итоговый ответ.

- Запрос уходит на `POST ${VITE_API_URL}/search`, ответ читается как NDJSON-стрим (`step`, `result`, `error`).
- Без `VITE_API_URL` включается демо-режим с заготовленным ответом.

Стек: React 19, TypeScript, TanStack Start / Router / Query, Tailwind CSS, shadcn/ui, Vitest.

```bash
cp .env.example .env
npm install
npm run dev
npm test
```
