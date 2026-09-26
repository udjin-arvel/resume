<template>
  <div class="flex flex-wrap items-center gap-x-1 gap-y-1">
    <template v-if="parts?.length">
      <span
        v-for="(part, idx) in parts"
        :key="`${idx}-${part.value || 'text'}`"
        class="flex items-center"
      >
        <span>{{ part.text }}</span>

        <LabelTooltip
          v-if="part.type === 'powerType' && part.value === PowerTypeHybrid"
          :icon="InformationCircleIcon"
          tooltip-text="catalog.common.hybrid_tooltip"
          kind="unset"
          class="flex flex-shrink-0 items-center justify-center w-4 h-4 ml-1 text-current opacity-70 hover:opacity-100 transition-opacity"
        />

        <span v-if="idx < parts.length - 1">,</span>
      </span>
    </template>

    <template v-else>
      <span>{{ fallback }}</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { InformationCircleIcon } from "@heroicons/vue/24/outline"
import LabelTooltip from "@/components/common/LabelTooltip.vue"
import { PowerTypeHybrid } from "@/constants/cars"

export interface DescriptionPart {
  text: string
  type?: "powerType" | string
  value?: string
}

defineProps<{
  parts?: DescriptionPart[]
  fallback?: string
}>()
</script>
