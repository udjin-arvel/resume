<template>
  <div :class="$style.box">
    <header :class="[$style.header, isOpen && $style.headerOpen]">
      <button
        v-if="hasContent"
        type="button"
        :class="$style.iconBtn"
        :aria-expanded="isOpen"
        @click="toggle"
      >
        <ChevronDownIcon
          :class="[$style.chevron, isOpen && $style.chevronOpen]"
        />
      </button>
      <div :class="$style.titleGroup">
        <h2
          :class="$style.status"
          @click="toggle"
        >
          {{ status }}
        </h2>
        <span
          v-if="updatedAt"
          :class="$style.headerMeta"
        >
          {{ t("logistic.tracking_list.info_updated_at") }}
          <span class="text-[15px]">{{ updatedAt }}</span>
        </span>
      </div>
      <NuxtLink
        v-if="editRoute"
        :to="editRoute"
        :class="$style.editLink"
      >
        {{ t("logistic.tracking_info.edit") }}
      </NuxtLink>
    </header>

    <div :class="[$style.bodyWrap, isOpen && $style.bodyWrapOpen]">
      <div :class="$style.bodyInner">
        <div :class="$style.body">
          <div
            v-if="notice"
            :class="$style.notice"
          >
            <ClockIcon
              :class="$style.noticeIcon"
              aria-hidden="true"
            />
            <span>{{ notice }}</span>
          </div>

          <div
            v-if="info?.length"
            :class="$style.infoGrid"
          >
            <div
              v-for="(pair, i) in info"
              :key="i"
              :class="$style.infoItem"
            >
              <span :class="$style.infoLabel">{{ pair.label }}</span>
              <span :class="$style.infoValue">{{ pair.value }}</span>
            </div>
          </div>

          <div
            v-if="classicFields?.length"
            :class="$style.classicTableWrap"
          >
            <table :class="$style.classicTable">
              <thead>
                <tr>
                  <th :class="$style.classicTh">
                    {{ t("logistic.tracking_list.table_param") }}
                  </th>
                  <th :class="$style.classicTh">
                    {{ t("logistic.tracking_list.table_value") }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="pair in classicFields"
                  :key="pair.label"
                  :class="$style.classicTr"
                >
                  <td :class="$style.classicTdLabel">
                    {{ pair.label }}
                  </td>
                  <td :class="$style.classicTdValue">
                    {{ pair.value }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            v-if="hasInvoiceGroups"
            :class="$style.invoiceGroups"
          >
            <div
              v-if="invoiceTopGroups.length"
              :class="$style.invoiceTopRow"
            >
              <div
                v-for="group in invoiceTopGroups"
                :key="group.title"
                :class="$style.groupTable"
              >
                <div :class="$style.groupTitle">
                  {{ group.title }}
                </div>
                <dl :class="[$style.groupList, $style.groupListStacked]">
                  <div
                    v-for="row in group.rows"
                    :key="row.label"
                    :class="$style.groupRow"
                  >
                    <dt :class="$style.groupLabel">
                      {{ row.label }}
                    </dt>
                    <dd :class="$style.groupValue">
                      {{ row.value }}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
            <div
              v-if="invoiceGroups?.delivery"
              :class="$style.groupTable"
            >
              <div :class="$style.groupTitle">
                {{ invoiceGroups.delivery.title }}
              </div>
              <dl :class="[$style.groupList, $style.groupListStacked]">
                <div
                  v-for="row in invoiceGroups.delivery.rows"
                  :key="row.label"
                  :class="$style.groupRow"
                >
                  <dt :class="$style.groupLabel">
                    {{ row.label }}
                  </dt>
                  <dd :class="$style.groupValue">
                    {{ row.value }}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div
            v-if="showInvoiceDownloads"
            :class="$style.invoiceDownloads"
          >
            <Button
              kind="black"
              :disabled="!isPdfReady || isDownloadingPdf"
              @click="$emit('download-invoice-pdf')"
            >
              <Spinner v-if="isPdfGenerating" />
              {{ downloadPdfLabel }}
            </Button>
            <Button
              v-if="canDownloadExcel"
              kind="black"
              :disabled="!isExcelReady || isDownloadingExcel"
              @click="$emit('download-invoice-excel')"
            >
              <Spinner v-if="isExcelGenerating" />
              {{ downloadExcelLabel }}
            </Button>
          </div>

          <div
            v-if="comment"
            :class="$style.commentSection"
          >
            <p :class="$style.sectionTitle">
              {{ t("logistic.tracking_info.comment_title") }}
            </p>
            <div class="relative">
              <TranslatableWrapper
                :data="commentData"
                :config="{
                  keys: {
                    ru: 'comment_ru',
                    zh: 'comment_zh',
                    original: 'comment_original',
                  },
                }"
                control-class="absolute top-0 right-0 z-10"
                class="pr-10"
              >
                <template #default="{ displayedText }">
                  <div :class="$style.commentText">
                    {{ displayedText || comment }}
                  </div>
                </template>
              </TranslatableWrapper>
            </div>
          </div>

          <div
            v-if="media?.length"
            :class="$style.docsBox"
          >
            <div :class="$style.docsHeader">
              <span :class="$style.docsHeaderTitle">
                {{ t("logistic.tracking_info.media_title") }}
              </span>
              <a
                href="#"
                :class="[$style.downloadAll, { 'opacity-50 cursor-not-allowed': isDownloading }]"
                @click.prevent="handleDownloadAll(media)"
              >
                <ArrowDownTrayIcon
                  class="w-4 h-4"
                  aria-hidden="true"
                />
                {{ isDownloading ? t("logistic.tracking_info.downloading") : t("logistic.tracking_info.download_all") }}
              </a>
            </div>
            <div :class="$style.mediaGridWrap">
              <MediaPreviewGrid :items="media" />
            </div>
          </div>

          <div
            v-if="files?.length"
            :class="$style.docsBox"
          >
            <div :class="$style.docsHeader">
              <span :class="$style.docsHeaderTitle">
                {{ t("logistic.tracking_info.files_title") }}
              </span>
              <a
                href="#"
                :class="[$style.downloadAll, { 'opacity-50 cursor-not-allowed': isDownloading }]"
                @click.prevent="handleDownloadAll(files)"
              >
                <ArrowDownTrayIcon
                  class="w-4 h-4"
                  aria-hidden="true"
                />
                {{ isDownloading ? t("logistic.tracking_info.downloading") : t("logistic.tracking_info.download_all") }}
              </a>
            </div>
            <ul :class="$style.fileList">
              <li
                v-for="file in files"
                :key="file.id"
                :class="$style.fileItem"
              >
                <DocumentTextIcon
                  :class="$style.fileIcon"
                  aria-hidden="true"
                />
                <a
                  :href="file.url"
                  :class="$style.fileLink"
                >
                  {{ file.name }}
                </a>
              </li>
            </ul>
          </div>

          <div
            v-if="buyerFiles?.length"
            :class="$style.buyerDocsSection"
          >
            <div :class="$style.docsHeader">
              <span :class="$style.buyerDocsTitle">
                {{ t("logistic.tracking_info.buyer_docs_title") }}
              </span>
              <a
                href="#"
                :class="[$style.downloadAll, { 'opacity-50 cursor-not-allowed': isDownloading }]"
                @click.prevent="handleDownloadAll(buyerFiles)"
              >
                <ArrowDownTrayIcon
                  class="w-4 h-4"
                  aria-hidden="true"
                />
                {{ isDownloading ? t("logistic.tracking_info.downloading") : t("logistic.tracking_info.download_all") }}
              </a>
            </div>
            <ul :class="$style.fileList">
              <li
                v-for="file in buyerFiles"
                :key="file.id"
                :class="$style.fileItem"
              >
                <DocumentTextIcon
                  :class="$style.fileIcon"
                  aria-hidden="true"
                />
                <a
                  :href="file.url"
                  :class="$style.fileLink"
                >
                  {{ file.name }}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowDownTrayIcon, ChevronDownIcon, ClockIcon, DocumentTextIcon } from "@heroicons/vue/24/outline"
import type { RouteLocationRaw } from "vue-router"
import { ref, computed } from "vue"
import { useI18n } from "vue-i18n"
import Button from "@/components/common/Button.vue"
import Spinner from "@/components/icon/Spinner.vue"
import MediaPreviewGrid from "@/components/common/MediaPreviewGrid.vue"
import TranslatableWrapper from "@/components/common/TranslatableWrapper.vue"
import type { SimpleFile } from "@/types/common/file"
import { useApiTracking } from "@/composables/api/useApiTracking"

type InfoPair = { label: string, value: string }
type InvoiceGroup = { title: string, rows: InfoPair[] }
type InvoiceGroups = {
  car?: InvoiceGroup
  payer?: InvoiceGroup
  delivery?: InvoiceGroup
}

const { t } = useI18n()
const { downloadArchive } = useApiTracking()

const props = defineProps<{
  status: string
  info?: InfoPair[]
  classicFields?: InfoPair[]
  invoiceGroups?: InvoiceGroups
  showInvoiceDownloads?: boolean
  canDownloadExcel?: boolean
  isPdfReady?: boolean
  isPdfGenerating?: boolean
  isDownloadingPdf?: boolean
  isExcelReady?: boolean
  isExcelGenerating?: boolean
  isDownloadingExcel?: boolean
  media?: SimpleFile[]
  files?: SimpleFile[]
  buyerFiles?: SimpleFile[]
  notice?: string
  comment?: string
  commentRu?: string
  commentZh?: string
  editRoute?: RouteLocationRaw
  updatedAt?: string
}>()

defineEmits<{
  "download-invoice-pdf": []
  "download-invoice-excel": []
}>()

const isDownloading = ref(false)
const isOpen = ref(false)

const hasInvoiceGroups = computed(() => {
  return Boolean(
    props.invoiceGroups?.car?.rows.length
    || props.invoiceGroups?.payer?.rows.length
    || props.invoiceGroups?.delivery?.rows.length,
  )
})

const invoiceTopGroups = computed(() => {
  return [props.invoiceGroups?.car, props.invoiceGroups?.payer].filter(
    (group): group is InvoiceGroup => Boolean(group?.rows.length),
  )
})

const downloadPdfLabel = computed(() => {
  if (props.isDownloadingPdf) {
    return t("logistic.invoice.pdf_downloading")
  }
  if (props.isPdfGenerating) {
    return t("logistic.invoice.pdf_generating")
  }
  return t("logistic.invoice.download_pdf")
})

const downloadExcelLabel = computed(() => {
  if (props.isDownloadingExcel) {
    return t("logistic.invoice.excel_downloading")
  }
  if (props.isExcelGenerating) {
    return t("logistic.invoice.excel_generating")
  }
  return t("logistic.invoice.download_excel")
})

const hasContent = computed(() => {
  return (
    (props.info && props.info.length > 0)
    || (props.classicFields && props.classicFields.length > 0)
    || hasInvoiceGroups.value
    || props.showInvoiceDownloads
    || (props.media && props.media.length > 0)
    || (props.files && props.files.length > 0)
    || (props.buyerFiles && props.buyerFiles.length > 0)
    || !!props.notice
    || !!props.comment
    || !!props.commentRu
    || !!props.commentZh
  )
})

function toggle() {
  isOpen.value = !isOpen.value
}

const commentData = computed(() => ({
  comment_ru: props.commentRu,
  comment_zh: props.commentZh,
}))

async function handleDownloadAll(collection?: SimpleFile[]) {
  if (!collection || collection.length === 0 || isDownloading.value) {
    return
  }

  isDownloading.value = true
  try {
    const ids = collection.map(f => f.id)
    const blob = await downloadArchive(ids)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url

    const timestamp = new Date().toISOString().slice(0, 10)
    link.setAttribute("download", `archive-${timestamp}.zip`)

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    window.URL.revokeObjectURL(url)
  }
  catch (error) {
    console.error("Download failed:", error)
  }
  finally {
    isDownloading.value = false
  }
}
</script>

<style module>
.box {
  @apply overflow-hidden rounded-[9px] border border-gray-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-sm;
}
.header {
  @apply flex items-center gap-3 px-5 py-3.5;
}
.headerOpen {
  @apply border-b border-gray-200;
}
.titleGroup {
  @apply flex min-w-0 flex-1 justify-between items-baseline gap-8;
}
.status {
  @apply min-w-0 truncate text-[15px] font-semibold text-gray-900;
}
.headerMeta {
  @apply shrink-0 whitespace-nowrap text-sm text-gray-500;
}
.editLink {
  @apply pb-1 shrink-0 text-red-600 underline hover:text-red-700;
}
.bodyWrap {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.28s ease;
}
.bodyWrapOpen {
  grid-template-rows: 1fr;
}
.bodyInner {
  overflow: hidden;
  min-height: 0;
}
.body {
  @apply px-5 py-4 flex flex-col gap-3;
}
.infoGrid {
  @apply grid gap-x-8 gap-y-3 sm:grid-cols-2;
}
.infoItem {
  @apply flex min-w-0 flex-col gap-0.5;
}
.infoLabel {
  @apply text-[11px] uppercase tracking-wide text-gray-500;
}
.infoValue {
  @apply truncate text-sm font-medium text-gray-900;
}
.classicTableWrap {
  @apply rounded-[9px] border border-gray-200;
}
.classicTable {
  @apply w-full border-collapse text-sm;
}
.classicTh {
  @apply bg-gray-50 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500;
}
.classicTh:first-child {
  width: 38%;
}
.classicTdLabel {
  @apply px-4 py-2.5 align-top leading-6 text-gray-500 border-t border-gray-200;
}
.classicTdValue {
  @apply break-words px-4 py-2.5 align-top font-medium leading-6 text-gray-900 border-t border-gray-200;
}
.classicTr:hover {
  @apply bg-gray-50;
}
.invoiceGroups {
  @apply flex flex-col gap-3;
}
.invoiceDownloads {
  @apply flex flex-wrap gap-3;
}
.invoiceTopRow {
  @apply grid items-stretch gap-3;
  grid-template-columns: 1fr;
}
@media (min-width: 768px) {
  .invoiceTopRow {
    grid-template-columns: 1fr 1fr;
  }
}
.groupTable {
  @apply flex h-full flex-col overflow-hidden rounded-[9px] border border-gray-200 bg-white;
}
.groupTitle {
  @apply border-b border-gray-200 bg-gray-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500;
}
.groupList {
  @apply m-0;
}
.groupListStacked {
  @apply divide-y divide-gray-200;
}
.groupRow {
  @apply grid items-baseline gap-3 px-4 py-2.5 text-sm;
  grid-template-columns: 42% 58%;
}
.groupLabel {
  @apply leading-6 text-gray-500;
}
.groupValue {
  @apply m-0 break-words font-medium leading-6 text-gray-900;
}
.commentSection {
  @apply mt-1;
}
.commentText {
  @apply whitespace-pre-wrap break-words text-sm text-gray-700;
}
.sectionTitle {
  @apply mb-2 text-[11px] uppercase tracking-wide text-gray-500;
}
.docsBox {
  @apply rounded-[9px] border border-gray-200 bg-gray-50 p-3;
}
.docsHeader {
  @apply flex items-center justify-between gap-3;
}
.docsHeaderTitle {
  @apply text-[11px] uppercase tracking-wide text-gray-500;
}
.mediaGridWrap {
  @apply mt-2;
}
.downloadAll {
  @apply inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 no-underline hover:text-blue-700;
}
.fileList {
  @apply mt-2 m-0 flex list-none flex-col gap-1.5 p-0;
}
.fileItem {
  @apply flex min-w-0 items-center gap-2;
}
.fileIcon {
  @apply h-4 w-4 shrink-0 text-gray-400;
}
.fileLink {
  @apply truncate text-sm text-blue-600 no-underline hover:text-blue-700;
}
.notice {
  @apply mb-4 flex items-center gap-2 rounded-[9px] border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800;
}
.noticeIcon {
  @apply h-5 w-5 flex-shrink-0 text-blue-500;
}
.buyerDocsSection {
  @apply rounded-[9px] border border-amber-200 bg-amber-50 p-3;
}
.buyerDocsTitle {
  @apply text-[11px] font-semibold uppercase tracking-wide text-amber-800;
}
.iconBtn {
  @apply inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900;
}
.chevron {
  @apply h-4 w-4 transition-transform duration-200;
}
.chevronOpen {
  @apply rotate-180;
}
@media (max-width: 767px) {
  .titleGroup {
    @apply gap-3;
  }
  .headerMeta {
    @apply truncate;
  }
}
</style>
