<template>
  <div>
    <NuxtLink
      :to="{ name: 'tracking' }"
      :class="$style.backLink"
      :aria-label="t('logistic.tracking_incognito_list.back_link')"
    >
      <CommonButton
        :kind="'white'"
        :size="'base'"
      >
        <ArrowLongLeftIcon
          class="w-5 h-5 mr-2"
          aria-hidden="true"
        />
        {{ t('logistic.tracking_incognito_list.back_link') }}
      </CommonButton>
    </NuxtLink>

    <h1 :class="$style.title">
      {{ t('logistic.tracking_incognito_list.title') }}
    </h1>

    <div :class="$style.box">
      <div :class="$style.row">
        <span :class="$style.label">
          {{ t('logistic.tracking_incognito_list.car_name_label') }}
        </span>
        <span :class="$style.value">
          {{ name || "—" }}
        </span>
      </div>
      <div :class="$style.row">
        <span :class="$style.label">
          {{ t('logistic.tracking_incognito_list.year_label') }}
        </span>
        <span :class="$style.value">
          {{ year || "—" }}
        </span>
      </div>
      <div :class="$style.row">
        <span :class="$style.label">
          {{ t('logistic.tracking_incognito_list.vin_label') }}
        </span>
        <span :class="$style.value">
          {{ vin || "—" }}
        </span>
      </div>
      <div :class="$style.row">
        <span :class="$style.label">
          {{ t('logistic.tracking_incognito_list.delivery_id_label') }}
        </span>
        <span :class="$style.value">
          {{ deliveryId || "—" }}
        </span>
      </div>
      <p :class="$style.meta">
        {{ t('logistic.tracking_incognito_list.updated_at_label') }}
        {{ updatedAt || "—" }}
      </p>
    </div>

    <div :class="[$style.box, $style.boxTable, 'mt-6']">
      <table :class="$style.table">
        <thead :class="$style.thead">
          <tr>
            <th :class="$style.th" />
            <th :class="[$style.th, $style.thDate]">
              {{ t('logistic.tracking_incognito_list.table.date_header') }}
            </th>
            <th :class="$style.th">
              {{ t('logistic.tracking_incognito_list.table.status_header') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.id"
            :class="$style.tr"
          >
            <td :class="$style.tdIcon">
              <button
                v-if="row.hasContent"
                type="button"
                :class="$style.iconBtn"
                @click="toggle(row.id)"
              >
                <ChevronDownIcon
                  :class="[$style.chevron, isExpanded(row.id) && $style.chevronOpen]"
                />
              </button>
            </td>
            <td :class="[$style.td, $style.tdDate]">
              {{ row.date }}
            </td>
            <td :class="$style.td">
              <div>{{ row.status }}</div>

              <div
                v-if="isExpanded(row.id)"
                :class="$style.details"
              >
                <div
                  v-if="row.commentData.comment_ru || row.commentData.comment_zh"
                  :class="$style.detailsTextWrapper"
                >
                  <TranslatableWrapper
                    :data="row.commentData"
                    :config="{
                      keys: {
                        ru: 'comment_ru',
                        zh: 'comment_zh',
                        original: 'original_locale',
                      },
                    }"
                    class="grid grid-cols-[auto_auto] justify-start items-baseline gap-x-2 !w-fit"
                    control-class="col-start-2 row-start-2 static ml-0"
                  >
                    <template #default="{ displayedText }">
                      <span :class="[$style.detailsText, 'col-start-1 row-start-2']">
                        {{ displayedText }}
                      </span>
                    </template>
                  </TranslatableWrapper>
                </div>
                <div
                  v-if="row.photos.length"
                  :class="$style.photosSection"
                >
                  <p :class="$style.photosTitle">
                    {{ t('logistic.tracking_incognito_list.table.photos_title') }}
                  </p>
                  <div :class="$style.photosGrid">
                    <div
                      v-for="(photo, i) in row.photos"
                      :key="photo.id"
                      :class="$style.photoItem"
                    >
                      <Media
                        type="image"
                        :src="photo.url"
                        :thumb="photo.thumb || photo.url"
                        :items="row.photos.map(p => p.url)"
                        :index="i"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </td>
          </tr>
          <tr
            v-if="!rows.length && !isLoading"
            :class="$style.tr"
          >
            <td
              :colspan="3"
              :class="$style.td"
            >
              {{ t('logistic.tracking_incognito_list.table.empty') }}
            </td>
          </tr>
          <tr
            v-if="isLoading"
            :class="$style.tr"
          >
            <td
              :colspan="3"
              :class="$style.td"
            >
              {{ t('logistic.tracking_incognito_list.table.loading') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue"
import { ArrowLongLeftIcon, ChevronDownIcon } from "@heroicons/vue/24/outline"
import { useRoute, useI18n } from "#imports"
import { useLogisticOrderTracking } from "@/composables/useLogisticOrderTracking"
import { useDate } from "@/composables/useDate"
import Media from "@/components/common/Media.vue"
import TranslatableWrapper from "@/components/common/TranslatableWrapper.vue"
import type { SimpleFile } from "~/types/common/file"

definePageMeta({
  auth: false,
  layout: "personal",
  hideBread: true,
  hideTitle: true,
})

const { t } = useI18n()
const { formatDateTime } = useDate()
const route = useRoute()

type CommentData = {
  comment_ru: string | null
  comment_zh: string | null
  original_locale: string
}

type Row = {
  id: number
  date: string
  status: string
  photos: SimpleFile[]
  hasContent: boolean
  commentData: CommentData
}

const uin = computed(() => String(route.params.id))

const {
  publicItems,
  publicMeta,
  fetchPublicTrackings,
  isLoading,
} = useLogisticOrderTracking({ logisticOrderId: 0 })

const name = computed(() => publicMeta.value?.name || "")
const year = computed(() => publicMeta.value?.year || "")

const vin = computed(() => publicMeta.value?.vin || "")
const deliveryId = computed(() => publicMeta.value?.deliveryId || "")
const updatedAt = computed(() => formatDateTime(publicMeta.value?.updatedAt) || "")

const rows = computed<Row[]>(() =>
  publicItems.value.map((item, index) => {
    const rawItem = item as any
    const photos = item.media.filter(file => file.mimeType?.startsWith("image/"))

    const commentRu = rawItem.commentRu || rawItem.comment
    const commentZh = rawItem.commentZh
    const originalLocale = rawItem.originalLocale || "zh"

    const hasComment = !!commentRu || !!commentZh
    const hasContent = hasComment || photos.length > 0

    const commentData: CommentData = {
      comment_ru: commentRu,
      comment_zh: commentZh,
      original_locale: originalLocale,
    }

    return {
      id: index + 1,
      date: formatDateTime(item.createdAt) || "",
      status: t(`order_status.default.${item.status}`),
      photos,
      hasContent,
      commentData,
    }
  }),
)

const expanded = ref<Set<number>>(new Set())

watch(
  rows,
  (value) => {
    expanded.value = new Set(
      value
        .filter(r => r.hasContent)
        .map(r => r.id),
    )
  },
  { immediate: true },
)

function toggle(id: number) {
  const s = new Set(expanded.value)
  if (s.has(id)) {
    s.delete(id)
  }
  else {
    s.add(id)
  }
  expanded.value = s
}

function isExpanded(id: number) {
  return expanded.value.has(id)
}

onMounted(async () => {
  await fetchPublicTrackings(uin.value)
})
</script>

<style module>
.backLink {
  @apply inline-block mb-4;
}
.title {
  font-size: 2.5rem;
  @apply font-bold mb-4 leading-tight;
}
.box {
  @apply bg-white shadow sm:rounded-lg border border-gray-200;
}
.boxTable {
  @apply p-0;
}
.row {
  @apply flex items-baseline gap-2 px-6 py-2;
}
.meta {
  @apply text-sm text-gray-500 mt-2 px-6 pb-6;
}
.label {
  @apply text-black font-normal;
}
.value {
  @apply text-black font-bold;
}
.table {
  @apply w-full border-collapse;
}
.thead {
  @apply bg-[#f5f5f5];
}
.th {
  @apply text-left px-4 py-3 text-sm font-medium border-b border-gray-200 text-[#757575];
}
.thDate {
  width: 160px;
}
.tr {
  @apply border-b border-gray-100;
}
.td {
  @apply px-4 py-3 text-sm text-gray-900 align-top;
}
.tdDate {
  width: 160px;
  @apply whitespace-nowrap;
}
.tdIcon {
  @apply pl-2 pr-1 py-2 w-10 align-top;
}
.iconBtn {
  @apply inline-flex items-center justify-center w-7 h-7 rounded hover:bg-gray-100 focus:outline-none;
}
.chevron {
  @apply w-5 h-5 text-gray-700 transition-transform duration-200;
}
.chevronOpen {
  @apply rotate-180;
}
.details {
  @apply mt-2 pt-3 border-t border-gray-200;
}
.detailsTextWrapper {
  @apply mb-3;
}
.detailsText {
  @apply text-sm text-gray-700 inline;
}
.photosSection {
  @apply mt-2;
}
.photosTitle {
  @apply text-sm text-gray-500 mb-2;
}
.photosGrid {
  @apply grid gap-2;
  grid-template-columns: repeat(8, minmax(0, 1fr));
}
@media (max-width: 767px) {
  .photosGrid {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}
@media (min-width: 768px) and (max-width: 1023px) {
  .photosGrid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
.photoItem {
  @apply overflow-hidden rounded border border-gray-200 relative;
  height: 100px;
}
</style>
