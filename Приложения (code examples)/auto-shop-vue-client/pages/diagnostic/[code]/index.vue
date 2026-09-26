<template>
  <ReportView
    :report="report"
    :title="pageTitle"
  />
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { useRoute, createError } from "#imports"
import ReportView from "@/components/diagnostic/ReportView.vue"
import { useApiListing } from "@/composables/api/useApiListing"
import type { DiagnosticReport } from "@/types/responses/diagnosticReport"

const { t } = useI18n()
const route = useRoute()
const { getPublicDiagnosticReport } = useApiListing()

const code = route.params.code as string

const { data: reportData, error } = await useAsyncData(
  `diagnostic-report-${code}`,
  async () => {
    const response = await getPublicDiagnosticReport(code)
    return response.data
      ? { report: response.data, listingName: response.listing_name ?? "" }
      : null
  },
  { server: true },
)

if (error.value || !reportData.value) {
  throw createError({ statusCode: 404, statusMessage: "Page not found", fatal: true })
}

const report = reportData.value.report as DiagnosticReport
const listingName = reportData.value.listingName

const pageTitle = listingName
  ? t("catalog.report_public_title", { name: listingName })
  : t("catalog.report_label")

usePageSeoMeta({
  title: () => pageTitle,
})
</script>
