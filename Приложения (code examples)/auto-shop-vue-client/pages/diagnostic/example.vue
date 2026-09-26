<template>
  <div>
    <p :class="$style.badge">
      {{ t("landing.reportExample.badge") }}
    </p>
    <ReportView
      :report="report"
      :title="pageTitle"
    />
    <p :class="$style.note">
      {{ t("landing.reportExample.note") }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import ReportView from "@/components/diagnostic/ReportView.vue"
import { landingDiagnosticExample, landingDiagnosticExampleMedia } from "@/constants/landing"
import type { DiagnosticReport, DiagnosticReportMedia } from "@/types/responses/diagnosticReport"

const { t } = useI18n()

const carName = "Mercedes-Benz GLB 2021 180 dynamic type"
const pageTitle = t("catalog.report_public_title", { name: carName })

const toMedia = (urls: string[], offset: number, posters: string[] = []): DiagnosticReportMedia[] =>
  urls.map((url, index) => ({
    id: offset + index + 1,
    url,
    poster: posters[index] ?? null,
  }))

const report = computed<DiagnosticReport>(() => ({
  id: 0,
  code: "example",
  description: t("landing.reportExample.description"),
  inspected_at: landingDiagnosticExample.inspectedAt,
  is_visible: true,
  is_visible_on_site: true,
  is_expired: false,
  listing_id: 0,
  photos: toMedia(landingDiagnosticExampleMedia("photos", landingDiagnosticExample.photos, "webp"), 0),
  defects: toMedia(landingDiagnosticExampleMedia("defects", landingDiagnosticExample.defects, "webp"), 1000),
  videos: toMedia(
    landingDiagnosticExampleMedia("videos", landingDiagnosticExample.videos, "mp4"),
    2000,
    landingDiagnosticExampleMedia("videos/posters", landingDiagnosticExample.videos, "webp"),
  ),
}))

usePageSeoMeta({
  title: () => pageTitle,
  robots: "noindex, nofollow",
})
</script>

<style module>
.badge {
  @apply inline-block mb-4 rounded-full bg-primary-100 px-4 py-1.5 text-sm font-semibold text-primary;
}

.note {
  @apply mt-8 border-t border-gray-200 pt-4 text-sm text-grey;
}
</style>
