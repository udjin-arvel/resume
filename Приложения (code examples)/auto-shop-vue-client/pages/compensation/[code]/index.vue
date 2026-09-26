<template>
  <h1 :class="$style.header">
    {{ reportTitle }}
  </h1>
  <ReportView
    :report="report"
    :title="pageTitle"
  />
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { computed } from "vue"
import { useRoute, createError } from "#imports"
import ReportView from "@/components/compensation/ReportView.vue"
import { useApiListing } from "@/composables/api/useApiListing"
import type { CompensationReport } from "@/types/responses/compensationReport"

const { t } = useI18n()
const route = useRoute()
const { getPublicCompensationReport } = useApiListing()

const code = route.params.code as string

const reportTitle = computed(() =>
  t("listing.insurance_and_dealer_statements", { number: listingName }),
)

const { data: reportData, error } = await useAsyncData(
  `compensation-report-${code}`,
  async () => {
    const response = await getPublicCompensationReport(code)
    return response.data
      ? { report: response.data, listingName: response.listing_name ?? "" }
      : null
  },
  { server: true },
)

if (error.value || !reportData.value) {
  throw createError({ statusCode: 404, statusMessage: "Page not found", fatal: true })
}

const report = reportData.value.report as CompensationReport
const listingName = reportData.value.listingName

const pageTitle = listingName
  ? t("catalog.compensation_report_public_title", { name: listingName })
  : t("catalog.compensation_report_label")

usePageSeoMeta({
  title: () => pageTitle,
})
</script>

<style module>
.header {
  @apply text-3xl leading-9 font-extrabold mb-4;
}
</style>
