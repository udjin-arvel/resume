<template>
  <div :class="$style.tableWrapper">
    <table :class="$style.table">
      <thead>
        <tr
          v-for="headerGroup in table.getHeaderGroups()"
          :key="headerGroup.id"
          :class="$style.headerRow"
        >
          <th
            v-for="header in headerGroup.headers"
            :key="header.id"
            :colSpan="header.colSpan"
            :rowSpan="header.rowSpan"
            :class="[
              (header.column.columnDef as ExternalColumn).meta?.headerClass || '',
            ]"
            :style="(header.column.columnDef as ExternalColumn).meta?.style"
          >
            {{ header.column.columnDef.header }}
          </th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="row in table.getRowModel().rows"
          :key="row.id"
          :class="[$style.bodyRow, row.depth > 0 ? $style.subRow : '', rowClassFn ? rowClassFn(row) : '']"
        >
          <td
            v-for="cell in row.getVisibleCells()"
            :key="cell.id"
            :class="getCellClasses(cell, row.depth)"
            :style="(cell.column.columnDef as ExternalColumn).meta?.style"
          >
            <slot
              :name="cell.column.id"
              :row="row"
              :value="cell.getValue()"
            >
              <component
                :is="cell.column.columnDef.cell"
                v-if="cell.column.columnDef.cell"
                v-bind="cell.getContext()"
              />
              <template v-else>
                {{ cell.getValue() }}
              </template>
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { Cell } from "@tanstack/vue-table"
import type { ExternalColumn, TanstackProps } from "@/types/common/tanstackTable"

defineProps<TanstackProps>()

const getCellClasses = (cell: Cell<any, unknown>, depth: number) => {
  const meta = (cell.column.columnDef as ExternalColumn).meta
  return [
    meta?.cellClass || "",
    meta?.cellClassFn ? meta.cellClassFn(cell.getContext()) : "",
    depth > 0 ? "tableSubRowCell" : "",
  ]
}
</script>

<style module>
.tableWrapper {
  @apply border border-gray-300 rounded-lg overflow-x-auto;
}

.table {
  @apply min-w-full border-collapse;
}

.headerRow {
  @apply bg-gray-100 text-gray-500;
}

.bodyRow {
  @apply border-b hover:bg-gray-50;
}
.bodyRow:last-child {
  @apply border-b-0;
}
</style>
