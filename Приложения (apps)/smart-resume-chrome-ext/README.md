# Smart Resume

Расширение Chrome: описание вакансии на странице или вставленный текст превращается в резюме или сопроводительное письмо. Рядом — API с авторизацией и оплатой.

Часть [портфолио приложений](../README.md).

## Задача

На LinkedIn и Indeed вакансия уже открыта, а резюме под неё всё равно собирается вручную. Боковая панель забирает текст со страницы, проводит по шагам и отдаёт готовый документ, не уводя с сайта.

## Что внутри

```
client/    расширение, side panel
server/    NestJS API
```

- Контент-скрипт читает описание на LinkedIn, Indeed, Glassdoor и ещё нескольких досках. Текст можно вставить вручную.
- Шаги: тип документа, исходное резюме или опыт, оформление, тон письма, результат и правка по комментарию.
- PDF из готового резюме.
- Вход через Google. Лимит генераций и тарифы Free, Pro и Pro+.
- Stripe: checkout, вебхук, докупка генераций.
- История генераций и заказов в PostgreSQL.

Ключ модели остаётся на сервере.

## Стек

Chrome Extension Manifest V3, React 18, TypeScript, Vite, Tailwind CSS. NestJS, TypeORM, PostgreSQL, JWT, Passport Google, OpenAI, Stripe.

## Запуск

```bash
cd server
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d
npm install
npm run start:dev
```

```bash
cd client
cp .env.example .env
npm install
npm run build
```

В Chrome: `chrome://extensions`, режим разработчика, загрузить `client/dist`. В `.env` сервера нужны `OPENAI_API_KEY`, Google OAuth и ключи Stripe. `VITE_API_URL` в клиенте указывает на API.
