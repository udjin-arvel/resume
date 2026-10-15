# The Last of Guss

Браузерная мини-игра: тапаешь гуся, счёт хранится на сервере, войти можно только со своим аккаунтом.

Часть [портфолио приложений](../README.md).

## Задача

Короткое fullstack-задание: игровой экран, регистрация и сессия, чтобы прогресс не жил только в памяти вкладки. Клиент отвечает за жест и отрисовку, сервер — за пользователя и число очков.

## Что внутри

```
client/    экран игры и вход
server/    API, пользователи, счёт
```

- Экран логина и кнопка-гусь.
- Регистрация и JWT в http-only cookie.
- Сохранение счёта в PostgreSQL.

## Стек

React 18, TypeScript, Vite, Redux Toolkit, Tailwind CSS. NestJS, Prisma, PostgreSQL, Passport JWT.

## Запуск

Сервер: PostgreSQL, `.env` из примера, затем в `server/`:

```bash
npm install
npx prisma migrate dev
npm run start:dev
```

Клиент в `client/`: `npm install && npm run dev`.
