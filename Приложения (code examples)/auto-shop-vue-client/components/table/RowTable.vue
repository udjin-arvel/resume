<template>
  <tr
    :class="[
      $style.tr,
      { [$style.hover]: hover },
      { [$style.last]: last },
    ]"
  >
    <td
      v-for="(item, index) in items"
      :key="index"
      :class="[
        $style.td,
        item.primary ? $style.tdPrimary : $style.tdSecondary,
        item.action ? $style.tdAction : '',
        item.paddingLeft ? $style.paddingLeft : '',
      ]"
    >
      <slot
        :name="`cell-${index}`"
        :item="item"
      >
        {{ item.value }}
      </slot>
    </td>
  </tr>
</template>

<script setup lang="ts">
import type { TableRow } from "@/types/common/table"

defineProps<{
  items: TableRow[]
  hover?: boolean
  last?: boolean
}>()
</script>

<style module>
.tr {
    @apply cursor-default;
}

.hover {
    @apply hover:bg-gray-50;
}

.last {
    @apply h-32;
}

.td {
    @apply py-4 text-sm align-top;
}

.tdPrimary {
    @apply whitespace-nowrap pl-4 pr-3 font-medium text-gray-900 sm:pl-6;
}

.tdSecondary {
    @apply whitespace-nowrap px-3 text-gray-900;
}

.tdAction {
    @apply relative pr-4 pl-3 text-right font-medium whitespace-nowrap flex justify-end items-center sm:pr-6;
}

.paddingLeft {
  @apply pl-16;
}
</style>
