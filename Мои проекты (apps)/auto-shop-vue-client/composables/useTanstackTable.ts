import { ref, unref } from "vue"
import type { MaybeRef } from "vue"
import {
  useVueTable,
  getExpandedRowModel,
  getCoreRowModel,
} from "@tanstack/vue-table"
import type { ExpandedState } from "@tanstack/vue-table"
import type { ExternalColumn, TanstackTableParams } from "~/types/common/tanstackTable"

export default function useTanstackTable<TData>(
  data: MaybeRef<TData[]>,
  columns: MaybeRef<ExternalColumn<TData>[]>,
  params: Partial<TanstackTableParams<TData>> = {},
) {
  const settings = {
    visabilityKey: "table_columns_visability",
    ordering: [],
    ...params,
  }

  const columnVisibility = ref<Record<string, boolean>>(
    JSON.parse(localStorage.getItem(settings.visabilityKey) as string) ?? settings.visibility ?? {},
  )

  const expanded = ref<ExpandedState>(settings.expanding ?? {})

  const columnOrdering = ref<string[]>(settings.ordering)
  const columnPinning = ref({
    left: [],
    right: [],
    top: [],
    ...settings.pinning,
  })

  const table = useVueTable({
    state: {
      get expanded() {
        return expanded.value
      },
      get columnVisibility() {
        return columnVisibility.value
      },
      get columnPinning() {
        return columnPinning.value
      },
      get columnOrder() {
        return columnOrdering.value
      },
    },
    get columns() {
      return unref(columns)
    },
    get data() {
      return unref(data)
    },
    getCoreRowModel: getCoreRowModel(),
    getSubRows: params.getSubRows || ((row: any) => row.children),
    getExpandedRowModel: getExpandedRowModel(),
    enableExpanding: true,
    onExpandedChange: (updater) => {
      expanded.value = typeof updater === "function" ? updater(expanded.value) : updater
    },
    onColumnVisibilityChange: (value: any) => {
      const cols = (columnVisibility.value = { ...columnVisibility.value, ...value() })
      localStorage.setItem(settings.visabilityKey, JSON.stringify(cols))
      return cols
    },
    defaultColumn: {},
  })

  return { table }
}
