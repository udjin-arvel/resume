# Video Compressor: клиент

Демо-интерфейс [микросервиса сжатия видео](../README.md): загрузка перетаскиванием, статус задачи в очереди, превью готового MP4 с перемоткой, размер до и после, скачивание.

- Собирается TanStack Start в SPA-режиме: на выходе статика, которую отдаёт nginx, без Node в рантайме.
- API и файлы на том же origin: `/api/*` и `/files/*` через nginx, CORS не нужен.
- Стек: React, TypeScript, TanStack Start, Tailwind CSS, Vitest.

```sh
cd client && bun install && bun run dev   # Vite проксирует /api и /files на http://localhost:8080 (BACKEND_URL)
```
