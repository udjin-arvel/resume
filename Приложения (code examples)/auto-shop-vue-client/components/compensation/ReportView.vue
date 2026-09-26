<template>
  <div>
    <UiWarningBlock
      v-if="report.is_expired"
      :title="t('catalog.report_expired_title')"
      kind="warning"
      :show-icon="true"
    />

    <div :class="$style.layout">
      <p
        v-if="report.description"
        :class="$style.description"
      >
        {{ report.description }}
      </p>

      <Slider
        v-if="photoUrls.length > 0"
        id="report-photo-slider"
        type="image"
        :items="photoUrls"
        :label="t('listing.document_photos')"
      />

      <div
        v-if="report.documents.length > 0"
        :class="$style.documentsWrapper"
      >
        <h2 class="text-lg">
          {{ t('listing.documents') }}
        </h2>
        <ul :class="$style.documentsList">
          <li
            v-for="document in report.documents"
            :key="document.id"
          >
            <a
              :href="document.url"
              target="_blank"
              rel="noopener noreferrer"
              :class="$style.documentLink"
            >
              {{ getDocumentName(document) }}
            </a>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import Slider from "@/components/common/Slider.vue"
import UiWarningBlock from "@/components/ui/UiWarningBlock.vue"
import type { CompensationReport, CompensationReportMedia } from "@/types/responses/compensationReport"

const props = defineProps<{
  report: CompensationReport
}>()

const { t } = useI18n()

const photoUrls = computed(() => props.report.photos.map(m => m.url))

function getDocumentName(document: CompensationReportMedia) {
  const filename = document.url.split("/").pop()?.split("?")[0] || document.url
  try {
    return decodeURIComponent(filename)
  }
  catch {
    return filename
  }
}
</script>

<style module>
.layout {
  @apply flex flex-col gap-8;
}

.description {
  @apply text-base text-black whitespace-pre-line;
}

.compensationRequestsText {
  @apply text-[#757575] text-base mb-6;
}

.documentsWrapper {
  @apply text-base rounded-[1.25rem] border-grey-900 py-5 px-[1.5625rem] border;
}

.documentsList {
  @apply flex flex-col gap-2 mt-3;
}

.documentLink {
  @apply block text-primary hover:underline break-words;
}
</style>
