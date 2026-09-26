<template>
  <div>
    <UiWarningBlock
      v-if="report.is_expired"
      :title="t('catalog.report_expired_title')"
      kind="warning"
      :show-icon="true"
    />

    <div :class="$style.layout">
      <div :class="$style.left">
        <Slider
          v-if="photoUrls.length > 0"
          id="report-photo-slider"
          type="image"
          :items="photoUrls"
          :label="t('catalog.report_photos')"
        />
        <Slider
          v-if="defectUrls.length > 0"
          id="report-defect-slider"
          type="image"
          :items="defectUrls"
          :label="t('catalog.report_defects')"
          :class="$style.sliderSpacing"
        />
        <Slider
          v-if="videoUrls.length > 0"
          id="report-video-slider"
          type="video"
          :items="videoUrls"
          :posters="videoPosters"
          :label="t('catalog.report_videos')"
          :class="$style.sliderSpacing"
        />
      </div>

      <div :class="$style.right">
        <h1
          v-if="title"
          :class="$style.title"
        >
          {{ title }}
        </h1>
        <p :class="$style.inspectedAt">
          {{ t("catalog.report_inspected_at") }}: {{ formattedInspectedAt }}
        </p>
        <p
          v-if="report.description"
          :class="$style.description"
        >
          {{ report.description }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import Slider from "@/components/common/Slider.vue"
import UiWarningBlock from "@/components/ui/UiWarningBlock.vue"
import { useDate } from "@/composables/useDate"
import type { DiagnosticReport } from "@/types/responses/diagnosticReport"

const props = defineProps<{
  report: DiagnosticReport
  title: string
}>()

const { t } = useI18n()
const { formatDate } = useDate()

const photoUrls = computed(() => props.report.photos.map(m => m.url))
const defectUrls = computed(() => props.report.defects.map(m => m.url))
const videoUrls = computed(() => props.report.videos.map(m => m.url))
const videoPosters = computed(() => props.report.videos.map(m => m.poster ?? null))

const formattedInspectedAt = computed(() => formatDate(props.report.inspected_at, "DD.MM.YYYY") ?? "")
</script>

<style module>
.layout {
  @apply flex flex-col md:flex-row gap-8;
}
.left {
  @apply w-full md:w-1/3 md:max-w-[420px];
}
.right {
  @apply w-full md:w-2/3;
}
.sliderSpacing {
  @apply mt-6;
}
.title {
  @apply text-3xl font-extrabold;
}
.inspectedAt {
  @apply text-sm text-gray-500 mt-2 mb-6;
}
.description {
  @apply text-base text-black whitespace-pre-line;
}
</style>
