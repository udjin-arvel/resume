# Сборка и публикация (EAS)

Приложение: **Поиск по кодексам** (`legal-search`), Expo SDK 57. Hermes включён по умолчанию в нативных сборках (отдельный ключ в `app.json` не требуется).

## Предварительные требования

1. Аккаунт [Expo](https://expo.dev/signup).
2. Установленный EAS CLI: `npm install -g eas-cli` или `npx eas-cli@latest`.
3. В корне проекта файл `.env` с ключами Supabase (см. `.env.example`).
4. Один раз привязать проект к Expo:

```bash
npx eas-cli login
npx eas-cli init
```

`eas init` добавит `extra.eas.projectId` в `app.json` и создаст проект на expo.dev.

## Переменные окружения в облачной сборке

Локальный `.env` на сервер EAS не попадает. Задайте переменные для профилей сборки:

```bash
npx eas-cli env:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://YOUR.supabase.co" --environment production --visibility plaintext
npx eas-cli env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "YOUR_ANON_KEY" --environment production --visibility sensitive
```

Повторите для окружений `preview` и `development`, если нужны отдельные ключи.

Проверка конфигурации перед сборкой:

```bash
npm run validate:build
```

## Профили `eas.json`


| Профиль       | Назначение                       | Android          |
| ------------- | -------------------------------- | ---------------- |
| `development` | Dev Client, внутренняя установка | APK              |
| `preview`     | Тест на устройстве без магазина  | APK              |
| `production`  | Google Play / App Store          | AAB (app-bundle) |


## Сборка

Preview APK для Android:

```bash
npx eas-cli build -p android --profile preview
```

Другие варианты:

```bash
npm run build:preview:android
npm run build:preview:ios
npm run build:production
```

Development-сборка (нужен `expo-dev-client`):

```bash
npx eas-cli build -p android --profile development
```

После сборки скачайте артефакт по ссылке из CLI или с [expo.dev](https://expo.dev) → Projects → Builds.

## Публикация в магазины

1. **Android (Google Play)** — production AAB:

```bash
npx eas-cli build -p android --profile production
npx eas-cli submit -p android --profile production
```

1. **iOS** — нужны Apple Developer, сертификаты (EAS может создать их при первой сборке):

```bash
npx eas-cli build -p ios --profile production
npx eas-cli submit -p ios --profile production
```

Перед submit заполните `eas.json` → `submit.production` (Apple ID, ASC App ID, team) по [документации EAS Submit](https://docs.expo.dev/submit/introduction/).

## Размер бандла и оптимизация

Локальная оценка размера экспортируемого бандла:

```bash
npm run analyze:bundle
```

Рекомендации:

- Hermes (по умолчанию в SDK 57) — меньше памяти и быстрее старт на устройстве.
- Импортируйте только нужные символы (`import { X } from '…'`), избегайте `import *`.
- Шрифты подключаются через `@expo-google-fonts/*` — в бандл попадают только используемые начертания.
- Перед релизом: `npm run lint`, `npm run typecheck`, `npx expo-doctor`.

## Идентификаторы приложения


| Платформа | Значение              |
| --------- | --------------------- |
| iOS       | `com.legalsearch.app` |
| Android   | `com.legalsearch.app` |


Для другого аккаунта разработчика измените `ios.bundleIdentifier` и `android.package` в `app.json` до первой production-сборки.

## Чек-лист перед релизом MVP

- [ ] `eas init` выполнен, `projectId` в `app.json`
- [ ] `EXPO_PUBLIC_*` заданы в EAS Environment
- [ ] Preview APK установлен на реальное устройство, поиск и избранное работают
- [ ] Production AAB/IPA собраны
- [ ] Дисклеймер на экране статьи отображается