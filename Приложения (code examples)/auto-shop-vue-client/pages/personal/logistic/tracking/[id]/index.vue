<template>
  <div>
    <div :class="$style.topRow">
      <div :class="$style.leftGroup">
        <CommonBackButton :to="{ name: 'personal-logistic' }" />
        <h1 :class="$style.title">
          {{ t("logistic.tracking_list.page_title") }}
        </h1>
      </div>
      <ToChat
        v-if="listingIdForChat && buyerIdForChat"
        type="listing"
        :listing-id="listingIdForChat"
        :buyer-id="buyerIdForChat"
      >
        <template #default="{ chatLoading, clickDisabled, goToChat }">
          <button
            type="button"
            :class="$style.adminBtn"
            :disabled="clickDisabled"
            :aria-busy="chatLoading || undefined"
            @click="goToChat"
          >
            <span :class="$style.adminBtnText">
              {{ t("logistic.tracking_list.contact_admin") }}
            </span>
            <ExclamationTriangleIcon
              class="w-4 h-4"
              aria-hidden="true"
            />
          </button>
        </template>
      </ToChat>
    </div>

    <div :class="$style.twocols">
      <div :class="$style.colMain">
        <div :class="$style.heroCard">
          <div :class="$style.boxRow">
            <img
              :src="carImage"
              alt=""
              :class="[$style.thumb, isCarStub && $style.thumbStub]"
              @error="onCarImageError"
            >
            <div :class="$style.selectGroup">
              <SearchableSelect
                v-model="selected"
                :options="options"
                :label="t('logistic.tracking_list.car_and_client')"
                class="w-full"
              />
              <div :class="$style.metaGrid">
                <div
                  v-if="deliveryId"
                  :class="$style.metaItem"
                >
                  <span :class="$style.metaLabel">
                    {{ t("logistic.tracking_list.info_delivery_id") }}
                  </span>
                  <span :class="$style.metaValue">
                    {{ deliveryId }}
                  </span>
                </div>
                <div
                  v-if="arrivalPortName"
                  :class="$style.metaItem"
                >
                  <span :class="$style.metaLabel">
                    {{ t("logistic.tracking_list.info_arrival_port") }}
                  </span>
                  <span :class="$style.metaValue">
                    {{ arrivalPortName }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="canShowAddStatusBtn"
            :class="$style.actionsBar"
          >
            <div class="relative inline-block">
              <NuxtLink
                :to="{ name: 'personal-logistic-tracking-id-status-status', params: { id, status: 0 } }"
                class="inline-block transition-opacity duration-200"
                :class="isStatusLocked ? 'opacity-50 pointer-events-none grayscale' : ''"
              >
                <button
                  type="button"
                  :class="$style.addStatusBtn"
                >
                  <PlusIcon
                    class="w-4 h-4"
                    aria-hidden="true"
                  />
                  {{ t("logistic.tracking_list.add_status") }}
                </button>
              </NuxtLink>

              <div
                v-if="isStatusLocked"
                class="absolute inset-0 flex items-center justify-center z-10"
              >
                <CommonLabelTooltip
                  :icon="LockClosedIcon"
                  :tooltip-text="lockedTooltipText"
                  kind="black"
                />
              </div>
            </div>

            <div
              v-if="isAdmin || isLogist"
              :class="$style.assigneeWrap"
            >
              <span :class="$style.assigneeLabel">
                {{ t("logistic.tracking_list.responsible") }}:
              </span>
              <AssigneeSelector
                :current-assignee="currentLogist"
                :options="availableLogists"
                :show-take-to-work="false"
                :show-dropdown-when-empty="true"
                :invalid-message="errors.get('logistId')"
                :empty-text="t('logistic.tracking_list.unassigned_logist')"
                :search-placeholder="t('needs.search_executor')"
                :assign-text="t('needs.assign')"
                :cancel-text="t('common.cancel')"
                @assign="handleAssignLogist"
              />
            </div>
          </div>
        </div>

        <div :class="$style.cards">
          <div
            v-for="card in trackingCards"
            :key="card.id"
            :ref="(el: Element | ComponentPublicInstance | null) => setCardRef(card.id, el)"
            :class="$style.cardItem"
          >
            <TrackingInfo
              :status="card.status"
              :info="card.info"
              :classic-fields="card.classicFields"
              :invoice-groups="card.invoiceGroups"
              :show-invoice-downloads="card.showInvoiceDownloads"
              :can-download-excel="canDownloadInvoiceExcel"
              :is-pdf-ready="card.isPdfReady"
              :is-pdf-generating="card.isPdfGenerating"
              :is-downloading-pdf="isDownloadingInvoicePdf"
              :is-excel-ready="card.isExcelReady"
              :is-excel-generating="card.isExcelGenerating"
              :is-downloading-excel="isDownloadingInvoiceExcel"
              :media="card.media"
              :files="card.files"
              :buyer-files="card.buyerFiles"
              :notice="card.notice"
              :comment="card.comment"
              :comment-ru="card.commentRu"
              :comment-zh="card.commentZh"
              :edit-route="card.editRoute"
              :updated-at="card.updatedAt"
              @download-invoice-pdf="handleDownloadInvoicePdf"
              @download-invoice-excel="handleDownloadInvoiceExcel"
            />
          </div>

          <CommonDataState
            :loading="isTrackingsPending"
            :has-data="trackingCards.length > 0"
            :loading-text="t('logistic.tracking_list.loading_statuses')"
            :empty-text="t('logistic.tracking_list.no_statuses')"
          />
        </div>
      </div>

      <aside :class="$style.colSide">
        <div :class="$style.sideCard">
          <div :class="$style.sideHeader">
            <Bars3Icon
              class="w-4 h-4 text-gray-400"
              aria-hidden="true"
            />
            <span :class="$style.sideHeaderText">
              {{ t("logistic.tracking_list.on_page") }}
            </span>
          </div>
          <div
            v-if="logisticCards.length"
            :class="$style.sideSection"
          >
            <p :class="$style.sideGroupTitle">
              {{ t("logistic.tracking_list.logistic_status_group") }}
            </p>
            <ul :class="$style.sideList">
              <li
                v-for="card in logisticCards"
                :key="`logistic-${card.id}`"
              >
                <button
                  type="button"
                  :class="$style.sideListBtn"
                  @click="scrollToCard(card.id)"
                >
                  {{ card.navStatus }}
                </button>
              </li>
            </ul>
          </div>
          <div
            v-if="buyerCards.length"
            :class="$style.sideSection"
          >
            <p :class="$style.sideGroupTitle">
              {{ t("logistic.tracking_list.buyer_status_group") }}
            </p>
            <ul :class="$style.sideList">
              <li
                v-for="card in buyerCards"
                :key="`buyer-${card.id}`"
              >
                <button
                  type="button"
                  :class="$style.sideListBtn"
                  @click="scrollToCard(card.id)"
                >
                  {{ card.navStatus }}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, type ComponentPublicInstance } from "vue"
import { ExclamationTriangleIcon, PlusIcon, Bars3Icon, LockClosedIcon } from "@heroicons/vue/24/outline"
import { storeToRefs } from "pinia"
import type { RouteLocationRaw } from "vue-router"
import { useRouter } from "vue-router"
import { useRoute, useI18n } from "#imports"
import { useDate } from "~/composables/useDate"
import { useMoney } from "~/composables/useMoney"
import SearchableSelect from "~/components/form/SearchableSelect.vue"
import TrackingInfo from "~/components/tracking/info.vue"
import type { OptionBase } from "~/types/form/optionType"
import { useLogisticOrderTracking } from "~/composables/useLogisticOrderTracking"
import { LogisticOrderStatuses } from "~/constants/orderStatuses"
import type { LogisticOrderStatus } from "~/types/common/logisticOrder"
import type { LogisticOrderTracking } from "~/types/common/logisticOrderTracking"
import type { SimpleFile } from "~/types/common/file"
import { useUserStore } from "~/stores/user"
import { RoleAdmin, RoleDirector, RoleEmployee, RoleLogistic, RoleSellerClient } from "~/constants/roles"
import ToChat from "@/components/chat/ToChat.vue"
import usePorts from "~/composables/usePorts"
import { useLogistic } from "~/composables/useLogistic"
import AssigneeSelector from "~/components/common/AssigneeSelector.vue"

definePageMeta({
  auth: true,
  layout: "personal",
  hideTitle: true,
  roles: [RoleDirector, RoleAdmin, RoleEmployee, RoleLogistic, RoleSellerClient],
})

type InfoPair = { label: string, value: string }
type InvoiceGroup = { title: string, rows: InfoPair[] }
type InvoiceGroups = {
  car?: InvoiceGroup
  payer?: InvoiceGroup
  delivery?: InvoiceGroup
}

const userStore = useUserStore()
const { isAdmin, isLogist, isBuyer, isSellerClient } = storeToRefs(userStore)
const route = useRoute()
const { t } = useI18n()
const { formatDateTime } = useDate()
const { formatNumberWithSpace } = useMoney()

const id = computed(() => String(route.params.id))
const listingIdForChat = computed<number | null>(() =>
  meta.value?.order?.listingId ?? null,
)
const deliveryId = computed(() => meta.value?.order?.deliveryId)

const arrivalPortName = computed(() => {
  const code = meta.value?.order?.invoice?.arrivalPortCode
  if (!code) {
    return null
  }

  return portNameByCode(code)
})

const buyerIdForChat = computed<number | null>(() =>
  meta.value?.order?.creator?.id ?? null,
)

const {
  items,
  fetchTrackings,
  isLoading,
  meta,
} = useLogisticOrderTracking({
  logisticOrderId: id.value,
})

const hasFetchedTrackings = ref(false)
const isTrackingsPending = computed(() => !hasFetchedTrackings.value || isLoading.value)

const CAR_STUB_IMAGE = "/car-stub.svg"
const carImageFailed = ref(false)
const carImage = computed(() => {
  const src = meta.value?.image
  if (!src || carImageFailed.value) {
    return CAR_STUB_IMAGE
  }
  return src
})
const isCarStub = computed(() => carImage.value === CAR_STUB_IMAGE)

watch(() => meta.value?.image, () => {
  carImageFailed.value = false
})

function onCarImageError() {
  carImageFailed.value = true
}

const { assignLogist, errors, downloadPdf, downloadExcel } = useLogistic()
const { reload: reloadPorts, portNameByCode } = usePorts()

const currentLogist = computed(() => {
  const logist = meta.value?.order?.logist
  if (!logist) {
    return null
  }
  return { id: logist.id, name: logist.name }
})

const availableLogists = computed(() => {
  const logists = meta.value?.logists || []
  return logists.map((l: any) => ({
    id: l.id,
    name: l.name,
  }))
})

const currentOrderStatus = computed<LogisticOrderStatus | null>(() => {
  return meta.value?.order?.status ?? null
})

const canShowAddStatusBtn = computed(() => {
  if (isAdmin.value || isLogist.value) {
    return true
  }

  if (isBuyer.value) {
    return currentOrderStatus.value === LogisticOrderStatuses.PreparedForRuDispatch
  }

  return false
})

async function handleAssignLogist(logistId: string | number) {
  try {
    await assignLogist(Number(id.value), Number(logistId))
    await fetchTrackings()
  }
  catch (error) {
    console.error("Ошибка при назначении логиста:", error)
  }
}

const router = useRouter()

const options = computed<OptionBase[]>(() => {
  const list = meta.value?.orders || []
  return list.map(item => ({
    id: item.id,
    value: item.id,
    name: item.name,
    disabled: false,
  }))
})

const selected = ref<OptionBase | undefined>(undefined)

watch([options, id], ([newOptions, currentId]) => {
  if (newOptions.length) {
    const found = newOptions.find(o => String(o.value) === String(currentId))
    if (found && selected.value?.value !== found.value) {
      selected.value = found
    }
  }
}, { immediate: true })

watch(selected, (newVal) => {
  if (newVal && String(newVal.value) !== String(id.value)) {
    router.push({
      name: "personal-logistic-tracking-id",
      params: { id: newVal.value },
    })
  }
})

const isStatusLocked = computed(() => {
  if (isAdmin.value || isLogist.value) {
    return false
  }

  if (isBuyer.value) {
    return !items.value.some(tr => tr.status === LogisticOrderStatuses.PaymentDocsUploaded)
  }

  return false
})

const lockedTooltipText = computed(() => {
  if (isBuyer.value && isStatusLocked.value) {
    return "logistic.tracking_list.unlock_after_payment_received"
  }
  return ""
})

const buyerStatusSet = new Set<LogisticOrderStatus>([
  LogisticOrderStatuses.AwaitingBuyerData,
  LogisticOrderStatuses.AddedBuyerData,
  LogisticOrderStatuses.InvoiceIssued,
  LogisticOrderStatuses.PaymentDocsUploaded,
  LogisticOrderStatuses.AttachDispatchData,
])

function pushIfValue(
  arr: InfoPair[],
  label: string,
  value: string | number | null | undefined,
) {
  if (value === null || value === undefined) {
    return
  }
  const str = String(value).trim()
  if (!str) {
    return
  }
  arr.push({ label, value: str })
}

function formatCny(value: string | number | null | undefined): string | undefined {
  if (value === null || value === undefined) {
    return undefined
  }
  const raw = String(value).trim()
  if (!raw) {
    return undefined
  }
  const num = Number(raw.replace(/\s/g, ""))
  if (!Number.isFinite(num)) {
    return raw
  }
  return `${formatNumberWithSpace(num)} CNY`
}

function buildBookingFields(): InfoPair[] {
  const fields: InfoPair[] = []
  const order = meta.value?.order
  if (!order) {
    return fields
  }

  pushIfValue(fields, t("logistic.tracking_list.info_departure_city"), order.departureCity)

  const seller = order.sellerProfile
  if (!seller) {
    return fields
  }

  pushIfValue(fields, t("logistic.tracking_list.info_seller_wechat"), seller.wechat)
  pushIfValue(fields, t("logistic.tracking_list.info_seller_phone"), seller.phone)
  pushIfValue(fields, t("logistic.tracking_list.info_seller_address"), seller.address)
  pushIfValue(fields, t("logistic.tracking_list.info_seller_additional"), seller.additionalInfo)
  pushIfValue(fields, t("logistic.tracking_list.info_seller_insurance_expiry"), seller.insuranceExpiryDate)

  return fields
}

function buildBuyerFields(): InfoPair[] {
  const fields: InfoPair[] = []
  const buyer = meta.value?.order?.buyerProfile
  if (!buyer) {
    return fields
  }

  pushIfValue(fields, t("logistic.tracking_list.info_buyer_fullname"), buyer.fullname)
  pushIfValue(fields, t("logistic.tracking_list.info_buyer_passport"), buyer.passportNumber)
  pushIfValue(fields, t("logistic.tracking_list.info_buyer_address"), buyer.address)
  pushIfValue(fields, t("logistic.tracking_list.info_buyer_phone"), buyer.phone)
  pushIfValue(fields, t("logistic.tracking_list.info_buyer_additional"), buyer.additionalInfo)

  return fields
}

function buildInvoiceGroups(): InvoiceGroups | undefined {
  const invoice = meta.value?.order?.invoice
  if (!invoice) {
    return undefined
  }

  const car: InfoPair[] = []
  const payer: InfoPair[] = []
  const delivery: InfoPair[] = []

  pushIfValue(car, t("logistic.tracking_list.info_invoice_number"), invoice.invoiceNumber)
  if (invoice.invoiceDate) {
    pushIfValue(
      car,
      t("logistic.tracking_list.info_invoice_date"),
      formatDateTime(invoice.invoiceDate, "DD.MM.YYYY") || invoice.invoiceDate,
    )
  }
  pushIfValue(car, t("logistic.tracking_list.info_invoice_vin"), invoice.vin)
  pushIfValue(car, t("logistic.tracking_list.info_invoice_car_price_cny"), formatCny(invoice.carPriceCny))
  pushIfValue(car, t("logistic.tracking_list.info_invoice_sum_cny"), formatCny(invoice.invoiceSumCny))

  pushIfValue(payer, t("logistic.tracking_list.info_invoice_payer_type"), invoice.payerType)
  pushIfValue(payer, t("logistic.tracking_list.info_invoice_broker"), invoice.broker)
  pushIfValue(payer, t("logistic.tracking_list.info_invoice_payer_fullname"), invoice.payerFullname)
  pushIfValue(payer, t("logistic.tracking_list.info_invoice_payer_address"), invoice.payerAddress)
  pushIfValue(payer, t("logistic.tracking_list.info_invoice_payer_phone"), invoice.payerPhone)
  pushIfValue(
    payer,
    t("logistic.tracking_list.info_invoice_verified"),
    invoice.invoiceVerified
      ? t("logistic.tracking_list.yes")
      : t("logistic.tracking_list.no"),
  )

  pushIfValue(delivery, t("logistic.tracking_list.info_invoice_arrival_port"), invoice.arrivalPortCode)
  pushIfValue(delivery, t("logistic.tracking_list.info_invoice_delivery_to_port_cny"), formatCny(invoice.deliveryToPortCny))
  pushIfValue(delivery, t("logistic.tracking_list.info_invoice_expenses_markup_cny"), formatCny(invoice.expensesMarkupCny))
  pushIfValue(delivery, t("logistic.tracking_list.info_invoice_diagnostic_count"), invoice.diagnosticCount)
  pushIfValue(delivery, t("logistic.tracking_list.info_invoice_diagnostic_price_cny"), formatCny(invoice.diagnosticPriceCny))
  pushIfValue(delivery, t("logistic.tracking_list.info_invoice_diagnostic_total_cny"), formatCny(invoice.diagnosticTotalCny))
  pushIfValue(delivery, t("logistic.tracking_list.info_invoice_compensation_count"), invoice.compensationCount)
  pushIfValue(delivery, t("logistic.tracking_list.info_invoice_compensation_price_cny"), formatCny(invoice.compensationPriceCny))
  pushIfValue(delivery, t("logistic.tracking_list.info_invoice_compensation_total_cny"), formatCny(invoice.compensationTotalCny))

  const groups: InvoiceGroups = {}
  if (car.length) {
    groups.car = { title: t("logistic.tracking_list.invoice_group_car"), rows: car }
  }
  if (payer.length) {
    groups.payer = { title: t("logistic.tracking_list.invoice_group_payer"), rows: payer }
  }
  if (delivery.length) {
    groups.delivery = { title: t("logistic.tracking_list.invoice_group_delivery"), rows: delivery }
  }

  return groups.car || groups.payer || groups.delivery ? groups : undefined
}

function buildInfoForTracking(tr: LogisticOrderTracking): InfoPair[] {
  const info: InfoPair[] = []
  const order = meta.value?.order
  if (!order) {
    return info
  }

  if (
    tr.status === LogisticOrderStatuses.AwaitingBuyerData
    || tr.status === LogisticOrderStatuses.AddedBuyerData
    || tr.status === LogisticOrderStatuses.InvoiceIssued
  ) {
    return info
  }

  const trackingStatuses: LogisticOrderStatus[] = [
    LogisticOrderStatuses.SentToChinaHub,
    LogisticOrderStatuses.PhotoFromTransit,
    LogisticOrderStatuses.PreparedForRuDispatch,
    LogisticOrderStatuses.ShippedToRussia,
    LogisticOrderStatuses.ArrivedInRussia,
    LogisticOrderStatuses.SentToCfs,
  ]

  if (trackingStatuses.includes(tr.status) && order.deliveryId) {
    pushIfValue(
      info,
      t("logistic.tracking_list.info_delivery_id"),
      order.deliveryId,
    )
  }

  return info
}

function buildFilesForTracking(tr: LogisticOrderTracking): SimpleFile[] {
  const base = tr.documents ?? []
  const order = meta.value?.order
  if (!order) {
    return base
  }

  if (tr.status === LogisticOrderStatuses.AddedBuyerData && order.buyerProfile?.files?.length) {
    return [...base, ...order.buyerProfile.files]
  }

  if (tr.status === LogisticOrderStatuses.PaymentDocsUploaded && order.invoice?.paymentFiles?.length) {
    return [...base, ...order.invoice.paymentFiles]
  }

  return base
}

function hasReachedStatus(
  currentStatuses: LogisticOrderTracking[],
  targetStatus: LogisticOrderStatus,
): boolean {
  return currentStatuses.some(tr => tr.status === targetStatus)
}

const canEditBeforePayment = computed<boolean>(() => {
  return !hasReachedStatus(items.value, LogisticOrderStatuses.PaymentDocsUploaded)
})

const canDownloadInvoiceExcel = computed(() =>
  isAdmin.value || isLogist.value || isSellerClient.value,
)

const isDownloadingInvoicePdf = ref(false)
const isDownloadingInvoiceExcel = ref(false)

const INVOICE_POLL_INTERVAL_MS = 2000
const INVOICE_POLL_MAX_ATTEMPTS = 90
let invoicePollTimer: ReturnType<typeof setInterval> | null = null
let invoicePollAttempts = 0

function isGeneratingStatus(status?: string | null) {
  return status === "pending" || status === "processing"
}

const isInvoiceGenerating = computed(() => {
  const invoice = meta.value?.order?.invoice
  if (!invoice) {
    return false
  }

  const pdfGenerating = isGeneratingStatus(invoice.pdfStatus)
  const excelGenerating = canDownloadInvoiceExcel.value && isGeneratingStatus(invoice.excelStatus)

  return pdfGenerating || excelGenerating
})

function stopInvoicePolling() {
  if (invoicePollTimer) {
    clearInterval(invoicePollTimer)
    invoicePollTimer = null
  }
}

function startInvoicePolling() {
  stopInvoicePolling()
  invoicePollAttempts = 0

  invoicePollTimer = setInterval(async () => {
    invoicePollAttempts += 1
    if (invoicePollAttempts > INVOICE_POLL_MAX_ATTEMPTS) {
      stopInvoicePolling()
      return
    }

    await fetchTrackings()

    if (!isInvoiceGenerating.value) {
      stopInvoicePolling()
    }
  }, INVOICE_POLL_INTERVAL_MS)
}

async function handleDownloadInvoicePdf() {
  if (isDownloadingInvoicePdf.value) {
    return
  }

  isDownloadingInvoicePdf.value = true
  try {
    await downloadPdf(Number(id.value))
  }
  finally {
    isDownloadingInvoicePdf.value = false
  }
}

async function handleDownloadInvoiceExcel() {
  if (!canDownloadInvoiceExcel.value || isDownloadingInvoiceExcel.value) {
    return
  }

  isDownloadingInvoiceExcel.value = true
  try {
    await downloadExcel(Number(id.value))
  }
  finally {
    isDownloadingInvoiceExcel.value = false
  }
}

const hasBuyerAttachedDispatchData = computed(() =>
  items.value.some(tr => tr.status === LogisticOrderStatuses.AttachDispatchData),
)

const allTrackingCards = computed(() =>
  items.value.map((tr) => {
    const info = buildInfoForTracking(tr)
    const classicFields = (
      tr.status === LogisticOrderStatuses.AddedBuyerData
        ? buildBuyerFields()
        : tr.status === LogisticOrderStatuses.AwaitingBuyerData && !isBuyer.value
          ? buildBookingFields()
          : []
    )
    const order = meta.value?.order
    const invoiceGroups = tr.status === LogisticOrderStatuses.InvoiceIssued
      ? buildInvoiceGroups()
      : undefined
    const invoice = order?.invoice
    const showInvoiceDownloads = tr.status === LogisticOrderStatuses.InvoiceIssued && !!invoice
    const isPdfReady = invoice?.pdfStatus === "ready"
    const isPdfGenerating = isGeneratingStatus(invoice?.pdfStatus)
    const isExcelReady = invoice?.excelStatus === "ready"
    const isExcelGenerating = isGeneratingStatus(invoice?.excelStatus)
    const files = buildFilesForTracking(tr)
    const orderId = id.value

    let notice: string | undefined
    if (
      (isAdmin.value || isLogist.value)
      && tr.status === LogisticOrderStatuses.PreparedForRuDispatch
      && !hasBuyerAttachedDispatchData.value
    ) {
      notice = t("logistic.tracking_info.awaiting_buyer_docs")
    }

    let editRoute: RouteLocationRaw | undefined

    if (isAdmin.value || isLogist.value) {
      if (tr.status === LogisticOrderStatuses.AwaitingBuyerData) {
        if (isAdmin.value && order?.listingId && order?.listingRequestId) {
          editRoute = {
            path: `/personal/listings/${order.listingId}/booking/${order.listingRequestId}/confirm`,
          }
        }
      }
      else if (tr.status === LogisticOrderStatuses.AddedBuyerData) {
        editRoute = { path: `/personal/logistic/${orderId}/buyer` }
      }
      else if (tr.status === LogisticOrderStatuses.InvoiceIssued) {
        editRoute = { path: `/personal/logistic/${orderId}/invoice` }
      }
      else if (tr.status === LogisticOrderStatuses.PaymentDocsUploaded) {
        editRoute = { path: `/personal/logistic/${orderId}/payment` }
      }
      else if (tr.status === LogisticOrderStatuses.AttachDispatchData) {
        editRoute = undefined
      }
      else {
        editRoute = {
          name: "personal-logistic-tracking-id-status-status",
          params: { id: orderId, status: tr.id },
        }
      }
    }
    else if (isBuyer.value) {
      if (canEditBeforePayment.value) {
        if (tr.status === LogisticOrderStatuses.AddedBuyerData) {
          editRoute = { path: `/personal/logistic/${orderId}/buyer` }
        }
        else if (tr.status === LogisticOrderStatuses.InvoiceIssued) {
          editRoute = { path: `/personal/logistic/${orderId}/invoice` }
        }
      }

      if (tr.status === LogisticOrderStatuses.AttachDispatchData) {
        if (currentOrderStatus.value === LogisticOrderStatuses.AttachDispatchData) {
          editRoute = {
            name: "personal-logistic-tracking-id-status-status",
            params: { id: orderId, status: tr.id },
          }
        }
      }
    }

    const updated = tr.updatedAt || tr.createdAt
    const updatedAt = updated
      ? (formatDateTime(updated, "DD.MM.YYYY HH:mm") || undefined)
      : undefined

    return {
      id: tr.id,
      rawStatus: tr.status,
      status: t(`order_status.default.${tr.status}`),
      navStatus:
        tr.status === LogisticOrderStatuses.ExportDocsPrepared
          ? t("logistic.tracking_list.nav_export_docs_prepared")
          : t(`order_status.default.${tr.status}`),
      comment: tr.comment || "",
      commentRu: tr.commentRu || "",
      commentZh: tr.commentZh || "",
      media: tr.media,
      files,
      buyerFiles: tr.buyerDocuments ?? [],
      notice,
      info,
      classicFields: classicFields.length ? classicFields : undefined,
      invoiceGroups,
      showInvoiceDownloads,
      isPdfReady,
      isPdfGenerating,
      isExcelReady,
      isExcelGenerating,
      editRoute,
      updatedAt,
    }
  }),
)

watch(isInvoiceGenerating, (generating) => {
  if (generating) {
    startInvoicePolling()
  }
  else {
    stopInvoicePolling()
  }
})

const trackingCards = computed(() =>
  allTrackingCards.value.filter(
    card => !(isBuyer.value && card.rawStatus === LogisticOrderStatuses.AwaitingBuyerData),
  ),
)

const buyerCards = computed(() =>
  trackingCards.value.filter(card => buyerStatusSet.has(card.rawStatus)),
)

const logisticCards = computed(() =>
  trackingCards.value.filter(card => !buyerStatusSet.has(card.rawStatus)),
)

const cardRefs = new Map<number, HTMLElement>()

function setCardRef(id: number, el: Element | ComponentPublicInstance | null) {
  if (el instanceof HTMLElement) {
    cardRefs.set(id, el)
  }
  else {
    cardRefs.delete(id)
  }
}

function scrollToCard(id: number) {
  const el = cardRefs.get(id)
  if (!el) {
    return
  }
  el.scrollIntoView({ behavior: "smooth", block: "start" })
}

onMounted(async () => {
  try {
    await reloadPorts()
    await fetchTrackings()
    if (isInvoiceGenerating.value) {
      startInvoicePolling()
    }
  }
  finally {
    hasFetchedTrackings.value = true
  }
})

onUnmounted(() => {
  stopInvoicePolling()
})
</script>

<style module>
.topRow {
  @apply flex items-center justify-between gap-4;
}
.leftGroup {
  @apply flex min-w-0 items-center gap-3;
}
.title {
  @apply truncate text-2xl font-bold leading-tight tracking-tight text-gray-900 md:text-[28px];
}
.adminBtn {
  @apply inline-flex h-10 shrink-0 items-center gap-2 rounded-[9px] border border-gray-200 bg-white px-4 text-sm text-gray-900 transition-colors hover:border-gray-400 hover:text-gray-700 disabled:opacity-60;
}
.adminBtnText {
  @apply hidden sm:inline;
}
.heroCard {
  @apply rounded-[9px] border border-gray-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)];
}
.boxRow {
  @apply flex flex-col gap-5 md:flex-row;
}
.thumb {
  @apply aspect-[16/10] w-full shrink-0 overflow-hidden rounded-[9px] border border-gray-200 object-cover md:h-[116px] md:w-[186px];
}
@media (min-width: 768px) {
  .thumb {
    aspect-ratio: auto;
  }
}
.thumbStub {
  @apply bg-gray-50 object-contain p-4;
}
.selectGroup {
  @apply flex min-w-0 flex-1 flex-col;
}
.metaGrid {
  @apply mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2;
}
.metaItem {
  @apply flex min-w-0 flex-col gap-0.5;
}
.metaLabel {
  @apply text-[11px] uppercase tracking-wide text-gray-500;
}
.metaValue {
  @apply truncate text-sm font-medium text-gray-900;
}
.actionsBar {
  @apply mt-4 flex flex-wrap items-center gap-3 border-t border-gray-200 pt-4;
}
.addStatusBtn {
  @apply inline-flex h-10 items-center gap-2 rounded-[9px] bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700;
}
.assigneeWrap {
  @apply flex min-w-0 items-center gap-2;
}
.assigneeLabel {
  @apply hidden text-sm text-gray-500 sm:inline;
}
.twocols {
  @apply mt-5 grid gap-5;
  grid-template-columns: 1fr;
}
@media (min-width: 1024px) {
  .twocols {
    grid-template-columns: minmax(0, 1fr) 300px;
  }
}
.colMain {
  @apply flex min-w-0 flex-col gap-3;
}
.cards {
  @apply flex flex-col gap-3;
}
.cardItem {
  scroll-margin-top: 96px;
}
.colSide {
  @apply hidden lg:block;
}
.sideCard {
  @apply sticky top-4 h-fit rounded-[9px] border border-gray-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)];
}
.sideHeader {
  @apply flex items-center gap-2.5;
}
.sideHeaderText {
  @apply text-xs font-semibold uppercase tracking-wide text-gray-500;
}
.sideSection {
  @apply mt-3 first:mt-0;
}
.sideGroupTitle {
  @apply text-[11px] uppercase tracking-wide text-gray-500;
}
.sideSection + .sideSection .sideGroupTitle {
  @apply mt-3 border-t border-gray-200 pt-3;
}
.sideList {
  @apply m-0 flex flex-col p-0 list-none;
}
.sideListBtn {
  @apply -mx-2 mt-1 w-[calc(100%+1rem)] rounded-[9px] px-2 py-1.5 text-left text-sm text-gray-900 transition-colors hover:bg-gray-50;
}
</style>
