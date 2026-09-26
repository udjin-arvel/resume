---
name: multi source products
overview: "Расширим поиск товаров за пределы еды через цепочку источников: собственный кэш/БД, Open Food Facts, Open Beauty Facts и Open Products Facts. Для косметики и гигиены добавим нормализацию состава и fallback на собственную базу, чтобы влажные салфетки и похожие товары можно было добавлять через админку при отсутствии во внешних источниках."
todos:
  - id: provider-chain
    content: Спроектировать и добавить backend provider chain для Open Food Facts, Open Beauty Facts и Open Products Facts
    status: pending
  - id: product-schema
    content: Расширить модель и БД продукта полями sourceProvider, productType и compositionText
    status: pending
  - id: scanme-products
    content: Добавить собственную ScanMe product DB и admin CRUD для ручного наполнения пропущенных товаров
    status: pending
  - id: app-result-states
    content: Обновить app UI для не-food товаров, состава и состояния submit/missing
    status: pending
  - id: tests
    content: "Покрыть provider chain тестами: hit в OBF/OPF, fallback order, PRODUCT_NOT_FOUND"
    status: pending
isProject: false
---

# План расширения источников продуктов

## Что есть сейчас

Сейчас backend использует один источник: `Open Food Facts` в [`backend/internal/product/off_client.go`](backend/internal/product/off_client.go). Запрос идёт на `/api/v2/product/{barcode}.json`, а `Product.Source` фактически принимает `open_food_facts` или `cache` в [`backend/internal/product/model.go`](backend/internal/product/model.go).

На app стороне fallback тоже напрямую привязан к `https://world.openfoodfacts.org` в [`app/lib/data/repositories/product_repository.dart`](app/lib/data/repositories/product_repository.dart). Поэтому не-food товары вроде влажных салфеток закономерно часто дают `PRODUCT_NOT_FOUND`.

## Варианты источников

- Open Facts family: `Open Food Facts`, `Open Beauty Facts`, `Open Products Facts`. Это лучший первый шаг: похожий API, open-data, подходит для косметики/гигиены. Минус: покрытие неполное.
- Собственная база ScanMe: добавляем товары вручную через админку, когда внешние источники ничего не нашли. Это нужно для реального покрытия влажных салфеток и локальных брендов.
- Коммерческие barcode API: можно добавить позже для покрытия названия/бренда/фото, но составы и лицензии часто слабее, плюс появляются платежи.
- OCR/GPT по упаковке: полезно позже для состава, но не стоит делать основным источником на MVP из-за качества и стоимости.

## Рекомендуемая архитектура

В backend заменить один `OFFClient` на цепочку provider-ов:

```mermaid
flowchart LR
  appScanner[Mobile Scanner] --> backendProduct[GET /v1/products barcode]
  backendProduct --> pgCache[Postgres Cache]
  pgCache -->|"miss or expired"| ownDb[ScanMe Product DB]
  ownDb -->|"miss"| off[Open Food Facts]
  off -->|"miss"| obf[Open Beauty Facts]
  obf -->|"miss"| opf[Open Products Facts]
  opf --> normalized[Unified Product]
  normalized --> analysis[Substance Analysis]
  analysis --> appResult[Result Screen]
```

Новая модель должна различать:

- `sourceProvider`: `scanme_admin`, `open_food_facts`, `open_beauty_facts`, `open_products_facts`.
- `productType`: `food`, `cosmetics`, `hygiene`, `household`, `unknown`.
- `ingredients` или `composition`: для косметики/гигиены состав может приходить как INCI/текст, а не как food ingredients.
- `confidence`: чтобы UI понимал, насколько надёжно распознано совпадение.

## Backend изменения

- Вынести общий интерфейс в [`backend/internal/product`](backend/internal/product): `Provider.FetchProduct(ctx, barcode) (Product, rawJSON, error)`.
- Переименовать текущий `OFFClient` в более общий `OpenFactsClient` или сделать три клиента с общим парсером.
- Добавить provider configs: `OPEN_FOOD_FACTS_BASE_URL`, `OPEN_BEAUTY_FACTS_BASE_URL`, `OPEN_PRODUCTS_FACTS_BASE_URL`.
- Расширить `products` миграцией: `source_provider`, `product_type`, `composition_text`, возможно переименовать `raw_off_json` в будущей миграции или добавить `raw_source_json`.
- В [`backend/internal/product/service.go`](backend/internal/product/service.go) заменить один fetch на provider chain: cache -> ScanMe own DB -> OFF -> OBF -> OPF.
- Сохранять найденный внешний товар в Postgres с TTL, как сейчас.
- Оставить `PRODUCT_NOT_FOUND`, но добавить в ответ ошибки подсказку категории/следующего действия для app: например `canSubmitProduct: true`.

## Собственная база через админку

- Добавить admin CRUD для продуктов: barcode, name, brand, imageUrl, productType, compositionText, ingredients, source notes.
- В dashboard добавить раздел “Products” или вкладку в текущей панели.
- Сценарий: пользователь сканирует влажные салфетки -> не найдено -> админ добавляет товар -> следующие пользователи получают результат из ScanMe DB.

## App изменения

- Убрать прямой fallback только на Open Food Facts или расширить его до Open Beauty/Open Products, но лучше держать все внешние источники на backend, чтобы ключи/лимиты/кэш были серверными.
- В [`app/lib/presentation/result/result_screen.dart`](app/lib/presentation/result/result_screen.dart) показать `productType` и корректные пустые состояния: “товар найден, но состав не указан” отдельно от “товар не найден”.
- Для не найденного товара добавить CTA “Сообщить о товаре” или “Добавить вручную позже”.

## Почему так

Для косметики и гигиены Open Beauty Facts даст лучший шанс на состав/INCI, Open Products Facts покроет часть общих товаров, а собственная база закроет реальные пропуски. Коммерческий API можно подключить позже как ещё один provider без переписывания сервиса.