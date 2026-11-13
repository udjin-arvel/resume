# BMap: клиент

Интерфейс [карты рынка](../README.md): холст с узлами и связями, панель типов (процесс, актор, ресурс, логистика), переключатель веток, undo/redo, мини-карта, вход и режим редактирования, AI-достройка цепочки от выбранного узла.

- API: `VITE_API_URL` (в Docker - `/`, nginx проксирует `/api`). Без бэкенда работает на моке.
- Живые обновления для редакторов - WebSocket `/api/ws`.
- Стек: React, TypeScript, TanStack Start, Tailwind CSS, Vitest.

```bash
cp .env.example .env.local
bun run dev        # или npm run dev
```
