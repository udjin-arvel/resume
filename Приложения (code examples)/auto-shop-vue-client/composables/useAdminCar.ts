import { ref, readonly } from "vue"
import { storeToRefs } from "pinia"
import { useApiAdminCar } from "@/composables/api/useApiAdminCar"
import usePagination from "@/composables/usePagination"
import { useApiAction } from "@/composables/useApiAction"
import { useAdminCarStore } from "@/stores/admin/carStore"

import type { CarModel, CarCompletion, CarFilterOption } from "~/types/common/adminCars"
import type { BrandIndexRequest } from "@/types/requests/admin/cars"
import type { CompletionMeta } from "@/types/responses/admin/cars"
import type {
  ApiListStrictResponse,
  ApiMetaList,
  ApiResponse,
} from "@/types/responses/response"

export function useAdminCar() {
  const { run, runWithLoading, errors } = useApiAction()
  const { indexBrands, completions, modelFilter, activate, deactivate, updateName, exportCars } = useApiAdminCar()

  const carStore = useAdminCarStore()
  const { brandOptions } = storeToRefs(carStore)

  const items = ref<CarModel[]>([])
  const completionsItems = ref<CarCompletion[]>([])
  const modelOptions = ref<CarFilterOption[]>([])

  const currentBrand = ref<CarFilterOption | null>(null)

  const meta = ref<ApiMetaList | null>(null)
  const isLoading = ref(false)
  const isExporting = ref(false)

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

  async function fetchBrands(extraParams: Partial<BrandIndexRequest> = {}) {
    return runWithLoading(isLoading, async () => {
      const params: BrandIndexRequest = {
        offset: offset.value,
        limit: __limit.value,
        ...extraParams,
      }
      const res = await indexBrands(
        params,
        { camelize: true, snakeParams: true },
      ) as ApiListStrictResponse<CarModel>
      items.value = res.data
      meta.value = res.meta
      applyMeta(res.meta)
      return res
    })
  }

  async function fetchBrandOptions() {
    return run(async () => {
      return await carStore.loadBrandOptions()
    })
  }

  async function fetchModelOptions(brandId: number | string) {
    return run(async () => {
      const res = await modelFilter(brandId)
      modelOptions.value = res.data || []
      return res
    })
  }

  async function fetchCompletions(id: number | string) {
    return run(async () => {
      const res = await completions(id) as ApiResponse<CarCompletion[], CompletionMeta & { brand?: CarFilterOption }>
      completionsItems.value = res.data || []

      if (res.meta) {
        if (res.meta.models) {
          modelOptions.value = res.meta.models
        }

        if (res.meta.brand) {
          currentBrand.value = res.meta.brand
        }
      }
      return res
    })
  }

  function updateRecursiveStatus(list: CarModel[], targetIds: number[], newStatus: boolean) {
    list.forEach((item) => {
      if (targetIds.includes(item.id)) {
        item.active = newStatus
      }
      if (item.models && item.models.length > 0) {
        updateRecursiveStatus(item.models, targetIds, newStatus)
      }
    })
  }

  async function activateItems(ids: (number | string)[]) {
    return run(async () => {
      const res = await activate(ids)

      if (res.data && Array.isArray(res.data)) {
        const updatedIds = res.data.map((id: number | string) => Number(id))

        completionsItems.value.forEach((item) => {
          if (updatedIds.includes(item.id)) {
            item.active = true
          }
        })

        updateRecursiveStatus(items.value, updatedIds, true)
      }
      return res
    })
  }

  async function deactivateItems(ids: (number | string)[]) {
    return run(async () => {
      const res = await deactivate(ids)

      if (res.data && Array.isArray(res.data)) {
        const updatedIds = res.data.map((id: number | string) => Number(id))

        completionsItems.value.forEach((item) => {
          if (updatedIds.includes(item.id)) {
            item.active = false
          }
        })

        updateRecursiveStatus(items.value, updatedIds, false)
      }
      return res
    })
  }

  async function updateItemName(id: number | string, newName: string) {
    return run(async () => {
      const res = await updateName(id, newName)

      const targetId = String(id)

      const targetCompletion = completionsItems.value.find(item => String(item.id) === targetId)
      if (targetCompletion) {
        targetCompletion.name = newName
      }

      const updateInTree = (list: CarModel[]) => {
        for (const item of list) {
          if (String(item.id) === targetId) {
            item.name = newName
            return true
          }
          if (item.models && updateInTree(item.models)) {
            return true
          }
        }
        return false
      }

      updateInTree(items.value)

      return res
    })
  }

  async function downloadExcel() {
    return runWithLoading(isExporting, async () => {
      try {
        const response: any = await exportCars()

        const blobData = response?.data || response

        const blob = blobData instanceof Blob
          ? blobData
          : new Blob([blobData], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })

        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url

        const dateStr = new Date().toISOString().slice(0, 10)
        link.setAttribute("download", `car_brands_models_${dateStr}.xlsx`)

        document.body.appendChild(link)
        link.click()

        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        return response
      }
      catch {
        alert("Ошибка при экспорте файла")
      }
    })
  }

  return {
    items,
    completionsItems,
    brandOptions,
    modelOptions,
    currentBrand,
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
    fetchBrands,
    fetchBrandOptions,
    fetchModelOptions,
    fetchCompletions,
    activateItems,
    deactivateItems,
    updateItemName,
    isExporting: readonly(isExporting),
    downloadExcel,
  }
}
