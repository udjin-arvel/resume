import { ref, readonly } from "vue"
import { useApiOrder } from "#imports"
import usePagination from "@/composables/usePagination"
import { useApiAction } from "@/composables/useApiAction"
import type { LogisticOrderListItemData } from "~/types/common/logisticOrder"
import type { OrderApiListStrictResponse, OrderListMeta, OrderListFilters } from "@/types/responses/logisticOrder"
import type { OrderListRequest } from "@/types/requests/logisticOrder"

export function useOrder() {
  const { runWithLoading, errors } = useApiAction()
  const { index } = useApiOrder()

  const items = ref<LogisticOrderListItemData[]>([])
  const meta = ref<OrderListMeta | null>(null)
  const storedFilters = ref<OrderListFilters | null>(null)

  const isLoading = ref(false)

  const {
    __currentPage,
    __limit,
    offset,
    total,
    lastPage,
    next,
    prev,
    first,
    last,
    applyMeta,
  } = usePagination({
    currentPage: 1,
    limit: 20,
    total: 0,
  })

  async function fetchOrders(extraParams: Partial<OrderListRequest> = {}) {
    return runWithLoading(isLoading, async () => {
      const params = {
        offset: offset.value,
        limit: __limit.value,
        ...extraParams,
      }

      const res = await index(
        params,
        { camelize: true, snakeParams: true },
      ) as OrderApiListStrictResponse<LogisticOrderListItemData>

      items.value = res.data || []

      if (res.meta?.filters) {
        storedFilters.value = res.meta.filters
      }

      if (storedFilters.value) {
        meta.value = {
          ...res.meta,
          filters: storedFilters.value,
        }
      }
      else {
        meta.value = res.meta
      }

      applyMeta(res.meta)

      return res
    })
  }

  return {
    items,
    meta,
    errors,
    isLoading: readonly(isLoading),
    page: __currentPage,
    limit: __limit,
    total,
    lastPage,
    next,
    prev,
    first,
    last,
    fetchOrders,
  }
}
