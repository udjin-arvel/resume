<template>
  <div
    class="mb-2 flex items-center rounded-lg border"
    :class="selected ? 'border-red-600 bg-red-50' : 'border-gray-100'"
  >
    <label class="flex min-w-0 flex-1 cursor-pointer items-center gap-3 p-3">
      <input
        type="radio"
        :name="name"
        :value="option.id"
        :checked="selected"
        :disabled="disabled"
        class="shrink-0 border-gray-300 text-red-600 focus:ring-red-500"
        @change="emit('select', option)"
      >
      <span class="text-xs text-gray-500">{{ number(option.id) }}</span>
      <span class="min-w-0 flex-1">
        <span class="block font-medium">{{ title(option) }}</span>
        <span
          v-if="details(option)"
          class="mt-1 block text-xs text-gray-500"
        >{{ details(option) }}</span>
      </span>
      <Label
        :text="t(`catalog.need_selection.status_${option.status}`)"
        :kind="RequestStatusColorMap[option.status] ?? 'blue'"
        size="sm"
        class="shrink-0"
      />
    </label>
    <NuxtLink
      :to="{ name: 'personal-needs-id', params: { id: option.id } }"
      target="_blank"
      rel="noopener noreferrer"
      :title="t('catalog.need_selection.open_request', { number: number(option.id) })"
      :aria-label="t('catalog.need_selection.open_request', { number: number(option.id) })"
      class="mr-2 inline-flex shrink-0 items-center justify-center rounded p-1 text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
    >
      <ArrowUpRightIcon
        class="h-4 w-4"
        aria-hidden="true"
      />
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { ArrowUpRightIcon } from "@heroicons/vue/24/outline"
import Label from "@/components/common/Label.vue"
import { RequestStatusColorMap } from "@/constants/statuses"
import { useSearchRequestOption } from "@/composables/useSearchRequestOption"
import type { SearchRequestForListingRequestOption } from "@/types/responses/searchRequestForListingRequest"

defineProps<{
  option: SearchRequestForListingRequestOption
  name: string
  selected: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  select: [option: SearchRequestForListingRequestOption]
}>()

const { t } = useI18n()
const { number, title, details } = useSearchRequestOption()
</script>
