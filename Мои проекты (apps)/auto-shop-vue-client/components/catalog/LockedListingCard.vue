<template>
  <button
    type="button"
    :class="[$style.card, isTile ? $style.tile : $style.row]"
    :aria-label="t('catalog.guest.archive_locked')"
    @click="goToLogin"
  >
    <div :class="[$style.media, isTile ? $style.mediaTile : $style.mediaRow]">
      <AuthLockIcon :icon-class="$style.icon" />
    </div>

    <div :class="$style.body">
      <span :class="$style.caption">{{ t('catalog.guest.archive_locked') }}</span>
      <span :class="[$style.bar, $style.barWide]" />
      <span :class="[$style.bar, $style.barNarrow]" />
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import AuthLockIcon from "@/components/common/AuthLockIcon.vue"
import { useLoginRedirect } from "@/composables/useLoginRedirect"

const props = withDefaults(defineProps<{
  view?: "list" | "tile"
}>(), {
  view: "list",
})

const { t } = useI18n()
const { goToLogin } = useLoginRedirect()

const isTile = computed(() => props.view === "tile")
</script>

<style module>
.card {
  @apply w-full text-left bg-transparent border-none p-0 cursor-pointer;
}

.tile {
  @apply flex flex-col gap-3;
}

.row {
  @apply flex flex-col md:flex-row gap-4 md:gap-6;
}

.media {
  @apply relative flex items-center justify-center rounded-xl bg-gray-100 border border-gray-200;
}

.mediaTile {
  @apply w-full h-[280px] sm:h-[280px] md:h-[240px];
}

.mediaRow {
  @apply w-full md:w-[300px] flex-shrink-0 h-[200px] md:h-[240px];
}

.icon {
  @apply w-10 h-10 text-gray-400;
}

.body {
  @apply flex flex-col gap-2 justify-center flex-1 py-1;
}

.caption {
  @apply text-sm font-medium text-gray-500;
}

.bar {
  @apply block h-3 rounded bg-gray-100;
}

.barWide {
  @apply w-2/3 max-w-[280px];
}

.barNarrow {
  @apply w-1/3 max-w-[160px];
}
</style>
