<template>
  <div>
    <div :class="$style.headerRow">
      <CommonBackButton
        :aria-label="t('common.back')"
        @click="goBack"
      />
      <h1
        v-if="mode === 'edit'"
        :class="$style.title"
      >
        {{ reportTitle }}
      </h1>
      <CommonLabel
        v-if="mode === 'view' && report && !report.is_visible"
        kind="gray"
        :class="$style.hiddenLabel"
        :text="t('listing.report_hidden')"
      />
      <div
        v-if="mode === 'view' && report"
        :class="$style.actions"
      >
        <CommonButton
          v-if="report.is_visible"
          type="button"
          kind="white"
          :class="$style.copyLinkBtn"
          @click="handleCopyLink"
        >
          {{ t("listing.report_copy_anon_link") }}
        </CommonButton>
        <CommonButton
          type="button"
          kind="white"
          :class="$style.editBtn"
          @click="mode = 'edit'"
        >
          {{ t("actions.edit") }}
        </CommonButton>
      </div>
    </div>

    <CommonAlert
      v-if="alert"
      :alert="alert"
      :class="$style.alert"
    />

    <ReportView
      v-if="mode === 'view' && report"
      :report="report"
      :title="reportTitle"
    />
    <ReportForm
      v-else-if="isLoaded"
      :listing-id="listingId"
      :report="report"
      :listing-number="listingNumber"
      @saved="handleSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute, useRouter } from "vue-router"
import ReportForm from "@/components/diagnostic/ReportForm.vue"
import ReportView from "@/components/diagnostic/ReportView.vue"
import { useApiListing } from "@/composables/api/useApiListing"
import { useDiagnosticReportUrl } from "@/composables/useDiagnosticReportUrl"
import { useCopyToClipboard } from "@/composables/useCopyToClipboard"
import type { DiagnosticReport } from "@/types/responses/diagnosticReport"
import type { Alert } from "@/types/common/alert"
import { AlertTypeEnum } from "@/types/common/alert"
import {
  RoleAdmin,
  RoleLogistic,
  RoleSellerClient,
  RoleSellerContent,
  RoleSellerSearch,
} from "@/constants/roles"

definePageMeta({
  auth: true,
  roles: [RoleAdmin, RoleLogistic, RoleSellerSearch, RoleSellerContent, RoleSellerClient],
  layout: "catalog",
  hideTitle: true,
})

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const notificationsStore = useNotificationsStore()
const listingRequestStore = useListingRequestStore()

const listingId = Number(route.params.id)
const { getDiagnosticReport } = useApiListing()
const { buildDiagnosticReportUrl } = useDiagnosticReportUrl()
const { copy } = useCopyToClipboard()

const report = ref<DiagnosticReport | null>(null)
const listingNumber = ref<string | null>(null)
const mode = ref<"view" | "edit" | null>(null)
const isLoaded = ref(false)
const alert = ref<Alert | null>(null)

const reportTitle = computed(() =>
  t("listing.report_title", { number: listingNumber.value || listingId }),
)

const reportUrl = computed(() => buildDiagnosticReportUrl(report.value?.code))

function goBack() {
  router.push({ name: "personal-listings-id-diagnostic", params: { id: listingId } })
}

async function handleCopyLink() {
  if (!reportUrl.value) {
    return
  }
  if (await copy(reportUrl.value)) {
    notificationsStore.successNotify(t("notification.diagnostic_report.link_copied"))
  }
}

function handleSaved(payload: { report: DiagnosticReport, listingNumber: string | null, requestsStayOpen: boolean }) {
  report.value = payload.report
  listingNumber.value = payload.listingNumber
  mode.value = "view"

  if (!payload.requestsStayOpen) {
    listingRequestStore.setListingTotals({
      ...listingRequestStore.listingTotals,
      total_diagnostic: 0,
    })
  }
}

onMounted(async () => {
  try {
    const response = await getDiagnosticReport(listingId)
    report.value = response.data ?? null
    listingNumber.value = response.listing_number ?? null
    // Есть отчёт — открываем просмотр; нет — сразу форму добавления.
    mode.value = report.value ? "view" : "edit"
  }
  catch {
    alert.value = {
      type: AlertTypeEnum.Error,
      subtitle: t("navigation.error"),
    }
  }
  finally {
    isLoaded.value = true
  }
})
</script>

<style module>
.headerRow {
  @apply flex flex-row flex-wrap gap-4 items-center mb-6 sm:flex-nowrap;
}

.title {
  @apply text-3xl font-extrabold;
}

.hiddenLabel {
  @apply whitespace-nowrap;
}

/* ml-auto висит на группе, а не на кнопке копирования: она может быть скрыта
   у невидимого отчёта, и тогда «Редактировать» прилипала к левому краю.
   Только с sm и выше — на мобильном при переносе строки кнопки идут влево. */
.actions {
  @apply flex flex-wrap items-center gap-4 sm:ml-auto;
}

.copyLinkBtn {
  @apply whitespace-nowrap;
}

.editBtn {
  @apply whitespace-nowrap;
}

.alert {
  @apply mb-4;
}
</style>
