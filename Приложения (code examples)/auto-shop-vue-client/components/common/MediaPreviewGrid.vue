<template>
  <div>
    <div
      :class="$style.mediaGrid"
      :style="{ gridTemplateColumns: `repeat(${colsPerRow}, minmax(0, 1fr))` }"
    >
      <div
        v-for="item in visibleMedia"
        :key="item.file.id"
        :class="$style.mediaItem"
      >
        <Media
          :type="item.file.mimeType?.startsWith('video/') ? 'video' : 'image'"
          :src="item.file.url"
          :thumb="item.file.thumb || undefined"
          :items="galleryItems"
          :index="item.index"
        />
      </div>
      <button
        v-if="showMoreTile"
        type="button"
        :class="$style.moreTile"
        @click="isExpanded = true"
      >
        <span :class="$style.moreOverlay">
          +{{ hiddenCount }}
        </span>
      </button>
    </div>
    <button
      v-if="isExpanded && hasOverflow"
      type="button"
      :class="$style.collapseBtn"
      @click="isExpanded = false"
    >
      {{ collapseLabel }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import Media from "@/components/common/Media.vue"
import type { SimpleFile } from "@/types/common/file"

const props = withDefaults(defineProps<{
  items: SimpleFile[]
  collapseLabel?: string
  colsDesktop?: number
  colsTablet?: number
  colsMobile?: number
}>(), {
  colsDesktop: 8,
  colsTablet: 4,
  colsMobile: 1,
})

const { t } = useI18n()

const isExpanded = ref(false)
const colsPerRow = ref(props.colsDesktop)

const collapseLabel = computed(() =>
  props.collapseLabel || t("logistic.tracking_info.collapse_media"),
)

function updateColsPerRow() {
  if (typeof window === "undefined") {
    return
  }
  const width = window.innerWidth
  if (width < 768) {
    colsPerRow.value = props.colsMobile
  }
  else if (width < 1024) {
    colsPerRow.value = props.colsTablet
  }
  else {
    colsPerRow.value = props.colsDesktop
  }
}

onMounted(() => {
  updateColsPerRow()
  window.addEventListener("resize", updateColsPerRow)
})

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateColsPerRow)
})

const mediaCount = computed(() => props.items.length)

const hasOverflow = computed(() => mediaCount.value > colsPerRow.value)

const collapsedVisibleCount = computed(() => Math.max(colsPerRow.value - 1, 0))

const showMoreTile = computed(() => hasOverflow.value && !isExpanded.value)

const hiddenCount = computed(() => {
  if (!showMoreTile.value) {
    return 0
  }
  return mediaCount.value - collapsedVisibleCount.value
})

const visibleMedia = computed(() => {
  const list = props.items
  if (!list.length) {
    return []
  }
  if (isExpanded.value || !hasOverflow.value) {
    return list.map((file, index) => ({ file, index }))
  }
  return list
    .slice(0, collapsedVisibleCount.value)
    .map((file, index) => ({ file, index }))
})

const galleryItems = computed(() => {
  return props.items.map(f => ({
    url: f.url,
    type: (f.mimeType?.startsWith("video/") ? "video" : "image") as "video" | "image",
  }))
})
</script>

<style module>
.mediaGrid {
  @apply grid gap-2;
}
.mediaItem {
  @apply h-[100px] overflow-hidden rounded-[9px] border border-gray-200 bg-white;
}
.moreTile {
  @apply relative flex h-[100px] cursor-pointer items-center justify-center overflow-hidden rounded-[9px] border border-blue-100 bg-blue-50 p-0 transition-colors hover:bg-blue-100;
}
.moreOverlay {
  @apply text-base font-semibold text-blue-600;
}
.collapseBtn {
  @apply mt-2 inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-700;
}
</style>
