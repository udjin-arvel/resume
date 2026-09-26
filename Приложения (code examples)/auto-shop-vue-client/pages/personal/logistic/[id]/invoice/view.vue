<template>
  <component
    :is="selectedView"
    :invoice="invoice"
    :can-edit-invoice="canEditInvoice"
    :can-download-excel="canDownloadExcel"
    :pdf-status="pdfStatus"
    :is-pdf-ready="isPdfReady"
    :is-pdf-generating="isPdfGenerating"
    :is-pdf-failed="isPdfFailed"
    :is-downloading-pdf="isDownloadingPdf"
    :excel-status="excelStatus"
    :is-excel-ready="isExcelReady"
    :is-excel-generating="isExcelGenerating"
    :is-excel-failed="isExcelFailed"
    :is-downloading-excel="isDownloadingExcel"
    @download-pdf="handleDownloadPdf"
    @download-excel="handleDownloadExcel"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue"
import { storeToRefs } from "pinia"
import InvoiceViewLegacy from "@/components/logistic/invoice/InvoiceViewLegacy.vue"
import InvoiceViewNew from "@/components/logistic/invoice/InvoiceViewNew.vue"
import { useLogistic } from "~/composables/useLogistic"
import { RoleEmployee, RoleDirector, RoleAdmin, RoleLogistic, RoleSellerClient } from "~/constants/roles"
import type { InvoiceExcelStatus, InvoicePdfStatus } from "@/types/responses/invoice"
import { useUserStore } from "~/stores/user"

definePageMeta({
  auth: true,
  roles: [RoleEmployee, RoleDirector, RoleAdmin, RoleLogistic, RoleSellerClient],
  layout: "personal",
  hideTitle: true,
})

const INVOICE_POLL_INTERVAL_MS = 2000
const INVOICE_POLL_MAX_ATTEMPTS = 90

const route = useRoute()
const orderId = computed(() => Number(route.params.id))
const { invoice, loadInvoiceView, downloadPdf, downloadExcel } = useLogistic()
const { isAdmin, isLogist, isSellerClient, isBuyer } = storeToRefs(useUserStore())

const isDownloadingPdf = ref(false)
const isDownloadingExcel = ref(false)
let pollTimer: ReturnType<typeof setInterval> | null = null
let pollAttempts = 0

const selectedView = computed(() =>
  invoice.value?.templateVersion === "new"
    ? InvoiceViewNew
    : InvoiceViewLegacy,
)

const canEditInvoice = computed(() =>
  isAdmin.value || isLogist.value || isBuyer.value,
)

const canDownloadExcel = computed(() =>
  isAdmin.value || isLogist.value || isSellerClient.value,
)

const pdfStatus = computed<InvoicePdfStatus | null | undefined>(() => invoice.value?.pdfStatus)
const excelStatus = computed<InvoiceExcelStatus | null | undefined>(() => invoice.value?.excelStatus)

const isPdfReady = computed(() => pdfStatus.value === "ready")
const isPdfGenerating = computed(() =>
  pdfStatus.value === "pending" || pdfStatus.value === "processing",
)
const isPdfFailed = computed(() => pdfStatus.value === "failed")

const isExcelReady = computed(() => excelStatus.value === "ready")
const isExcelGenerating = computed(() =>
  excelStatus.value === "pending" || excelStatus.value === "processing",
)
const isExcelFailed = computed(() => excelStatus.value === "failed")

const isAnyGenerating = computed(() =>
  isPdfGenerating.value || (canDownloadExcel.value && isExcelGenerating.value),
)

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

function startPolling() {
  stopPolling()
  pollAttempts = 0

  pollTimer = setInterval(async () => {
    pollAttempts += 1
    if (pollAttempts > INVOICE_POLL_MAX_ATTEMPTS) {
      stopPolling()
      return
    }

    await loadInvoiceView(orderId.value)

    if (!isAnyGenerating.value) {
      stopPolling()
    }
  }, INVOICE_POLL_INTERVAL_MS)
}

watch(
  isAnyGenerating,
  (generating) => {
    if (generating) {
      startPolling()
    }
    else {
      stopPolling()
    }
  },
)

async function handleDownloadPdf() {
  if (!isPdfReady.value || isDownloadingPdf.value) {
    return
  }

  isDownloadingPdf.value = true
  try {
    await downloadPdf(orderId.value)
  }
  finally {
    isDownloadingPdf.value = false
  }
}

async function handleDownloadExcel() {
  if (!canDownloadExcel.value || !isExcelReady.value || isDownloadingExcel.value) {
    return
  }

  isDownloadingExcel.value = true
  try {
    await downloadExcel(orderId.value)
  }
  finally {
    isDownloadingExcel.value = false
  }
}

onMounted(async () => {
  await loadInvoiceView(orderId.value)
  if (isAnyGenerating.value) {
    startPolling()
  }
})

onUnmounted(() => {
  stopPolling()
})
</script>
