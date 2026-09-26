<template>
  <div>
    <div :class="$style.headerRow">
      <CommonBackButton
        :aria-label="t('common.back')"
        @click="goBack"
      />
      <h1 :class="$style.title">
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
import ReportForm from "@/components/compensation/ReportForm.vue"
import ReportView from "@/components/compensation/ReportView.vue"
import { useApiListing } from "@/composables/api/useApiListing"
import { useCompensationReportUrl } from "@/composables/useCompensationReportUrl"
import { useCopyToClipboard } from "@/composables/useCopyToClipboard"
import type { CompensationReport } from "@/types/responses/compensationReport"
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
const { getCompensationReport } = useApiListing()
const { buildCompensationReportUrl } = useCompensationReportUrl()
const { copy } = useCopyToClipboard()

const report = ref<CompensationReport | null>(null)
const listingNumber = ref<string | null>(null)
const mode = ref<"view" | "edit" | null>(null)
const isLoaded = ref(false)
const alert = ref<Alert | null>(null)

const reportTitle = computed(() =>
  t("listing.insurance_and_dealer_statements", { number: listingNumber.value || listingId }),
)

const reportUrl = computed(() => buildCompensationReportUrl(report.value?.code))

function goBack() {
  router.push({ name: "personal-listings-id", params: { id: listingId } })
}

async function handleCopyLink() {
  if (!reportUrl.value) {
    return
  }
  if (await copy(reportUrl.value)) {
    notificationsStore.successNotify(t("notification.compensation_report.link_copied"))
  }
}

function handleSaved(payload: { report: CompensationReport, listingNumber: string | null, requestsStayOpen: boolean }) {
  report.value = payload.report
  listingNumber.value = payload.listingNumber
  mode.value = "view"

  if (!payload.requestsStayOpen) {
    listingRequestStore.setListingTotals({
      ...listingRequestStore.listingTotals,
      total_compensation: 0,
    })
  }
}

onMounted(async () => {
  try {
    const response = await getCompensationReport(listingId)
    report.value = response.data ?? null
    listingNumber.value = response.listing_number ?? null
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
  @apply flex flex-row flex-wrap gap-4 items-start mb-6 sm:flex-nowrap;
}

.title {
  @apply text-3xl font-extrabold max-w-2xl;
}

.hiddenLabel {
  @apply whitespace-nowrap;
}

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
