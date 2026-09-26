<template>
  <div :class="$style.wrap">
    <div :class="$style.overflowWrapper">
      <div :class="$style.inlineBlock">
        <div :class="$style.shadowWrapper">
          <table :class="$style.table">
            <thead :class="$style.thead">
              <tr>
                <th
                  v-for="(column, index) in columns"
                  :key="index"
                  :class="[$style.th, $style[getHeaderClass(column)], column.width ? column.width : '']"
                >
                  <template v-if="column.action">
                    <span :class="$style.srOnly">Action</span>
                  </template>
                  <template v-else>
                    {{ column.label }}
                  </template>
                </th>
              </tr>
            </thead>
            <tbody :class="$style.tbody">
              <slot />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from "@/types/common/table"

defineProps<{
  columns: (TableColumn & { width?: string })[]
}>()

const getHeaderClass = (column: TableColumn) => {
  if (column.action) {
    return "thAction"
  }
  return column.primary ? "thPrimary" : "thSecondary"
}
</script>

<style module>
.wrap {
  @apply mt-8 flow-root;
}

.srOnly {
  @apply sr-only;
}

.overflowWrapper {
  @apply -mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8;
}

.inlineBlock {
  @apply inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8;
}

.shadowWrapper {
  @apply overflow-hidden shadow ring-1 ring-black/5 sm:rounded-lg;
}

.table {
  @apply min-w-full divide-y divide-gray-300;
  table-layout: fixed;
  width: 100%;
}

.thead {
  @apply bg-gray-50;
}

.th {
  @apply px-3 py-3.5 text-left text-sm font-semibold text-gray-900;
}

.thPrimary {
  @apply py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6;
}

.thSecondary {
  @apply px-3 py-3.5 text-left text-sm font-semibold text-gray-900;
}

.thAction {
  @apply relative py-3.5 pr-4 pl-3 sm:pr-6;
}

.tbody {
  @apply divide-y divide-gray-200 bg-white;
}
</style>
