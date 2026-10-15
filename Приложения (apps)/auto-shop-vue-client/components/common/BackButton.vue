<template>
  <NuxtLink
    v-if="to"
    :to="to"
    :class="$style.btn"
    :aria-label="label"
  >
    <ArrowLeftIcon
      class="w-4 h-4"
      aria-hidden="true"
    />
  </NuxtLink>
  <button
    v-else
    type="button"
    :class="$style.btn"
    :aria-label="label"
    @click="$emit('click')"
  >
    <ArrowLeftIcon
      class="w-4 h-4"
      aria-hidden="true"
    />
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import type { RouteLocationRaw } from "vue-router"
import { ArrowLeftIcon } from "@heroicons/vue/24/outline"

const props = defineProps<{
  to?: RouteLocationRaw
  ariaLabel?: string
}>()

defineEmits<{
  (e: "click"): void
}>()

const { t } = useI18n()

const label = computed(() => props.ariaLabel || t("common.back"))
</script>

<style module>
.btn {
  @apply flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] border border-gray-200 bg-white text-gray-900 transition-colors hover:border-gray-400 hover:text-gray-700;
}
</style>
