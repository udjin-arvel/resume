# Сервер The Last of Guss

API пользователей и счёта. Описание продукта — в [корневом README](../README.md).

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

Перед запуском переименуйте `.env.example` в `.env` и поднимите PostgreSQL.
