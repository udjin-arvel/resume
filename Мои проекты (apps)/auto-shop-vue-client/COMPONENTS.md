# Components

## CommonDataState

`components/common/DataState.vue` — статус списка, когда данных нет: Spinner + текст при `loading`, иначе `emptyText`. При `hasData` ничего не рендерит.

```vue
<CommonDataState
  :loading="isLoading"
  :has-data="items.length > 0"
  :loading-text="t('common.loading')"
  :empty-text="t('common.no_results')"
/>
```

Props: `loading`, `hasData`, `loadingText`, `emptyText`.

## CarPreviewImage

`components/common/CarPreviewImage.vue` — `<img>` авто с фолбэком (`/car-stub.svg` по умолчанию), если `src` пустой или не загрузился.

Props: `src`, `alt`, `fallbackSrc`, `imageClass`.

## MediaPreviewGrid

`components/common/MediaPreviewGrid.vue` — сетка превью фото/видео (`Media`). Лишнее сворачивается в плитку `+N`, есть кнопка свернуть.

Props: `items`, `collapseLabel`, `colsDesktop` (8), `colsTablet` (4), `colsMobile` (1).

## BackButton

`components/common/BackButton.vue` — кнопка «назад» со стрелкой. С `to` — `NuxtLink`, без — `button` + emit `click`.

Props: `to`, `ariaLabel`.
