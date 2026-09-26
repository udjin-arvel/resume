import { ref, readonly, watch, toValue, computed } from "vue"
import { useLoadingIndicator } from "#imports"
import { useApiCities } from "@/composables/api/useApiCities"
import type { CityOption, DeliveryRow } from "~/types/responses/city"

type Pagination = {
  page: number
  perPage: number
  total: number
}

export default function useCities(options?: {
  page?: () => number | number
  perPage?: () => number | number
  cityCode?: () => string | undefined
}) {
  const { isLoading, start, finish } = useLoadingIndicator()
  const {
    index: apiIndex,
    update: apiUpdate,
    hide: apiHide,
    show: apiShow,
    updateDeliveryCost: apiUpdateDeliveryCost,
    exportExcel: apiExportExcel,
  } = useApiCities()

  const isExporting = ref(false)

  const allCities = ref<CityOption[]>([])

  const citiesPage = ref<CityOption[]>([])

  const pagination = ref<Pagination>({
    page: 1,
    perPage: 10,
    total: 0,
  })

  const pageRef = ref<number>(toValue(options?.page) ?? 1)
  const perPageRef = ref<number>(toValue(options?.perPage) ?? 10)
  const cityCodeRef = ref<string | undefined>(toValue(options?.cityCode))

  const deliveryRows = computed<DeliveryRow[]>(() =>
    citiesPage.value.map((city) => {
      const costs: Record<string, string> = {}
      const map = city.delivery_costs ?? {}
      for (const code of Object.keys(map)) {
        const value = map[code]
        costs[code] = value ? String(Number(value)) : "–"
      }
      return {
        id: city.id,
        fromCity: city.name_ru + (city.name_zh ? ` (${city.name_zh})` : ""),
        hidden: city.hidden,
        costs,
      }
    }),
  )

  const applyCity = (city: CityOption) => {
    citiesPage.value = citiesPage.value.map(item => (item.id === city.id ? city : item))
    allCities.value = allCities.value.map(item => (item.id === city.id ? city : item))
  }

  const reloadAll = async () => {
    start()
    try {
      const response = await apiIndex({ limit: -1 })
      allCities.value = response?.data || []
    }
    finally {
      finish()
    }
  }

  const fetchCities = async (page = pageRef.value, perPage = perPageRef.value) => {
    start()
    try {
      const offset = (page - 1) * perPage
      const params: Record<string, any> = { offset, limit: perPage }
      if (cityCodeRef.value) {
        params.filter = { code: cityCodeRef.value }
      }
      const response = await apiIndex(params)
      citiesPage.value = response.data || []
      const total = response.meta?.total ?? citiesPage.value.length ?? 0
      pagination.value = { page, perPage, total }
      pageRef.value = page
      perPageRef.value = perPage
    }
    finally {
      finish()
    }
  }

  const onPaginationChange = async ({ currentPage, limit }: { currentPage: number, limit: number }) => {
    await fetchCities(currentPage, limit)
  }

  const saveEdit = async (args: {
    id: number
    column: "fromCity" | "cost"
    name_ru?: string
    name_zh?: string
    portId?: number
    numericValue?: number
  }) => {
    start()
    try {
      let city: CityOption | undefined

      if (args.column === "fromCity") {
        const updateData: Partial<CityOption> = {}
        if (typeof args.name_ru === "string") {
          updateData.name_ru = args.name_ru
        }
        if (typeof args.name_zh === "string") {
          updateData.name_zh = args.name_zh
        }
        const response = await apiUpdate(args.id, updateData)
        city = response.data
      }
      else if (typeof args.portId === "number" && typeof args.numericValue === "number") {
        const response = await apiUpdateDeliveryCost(args.id, args.portId, args.numericValue)
        city = response.data
      }

      if (city) {
        applyCity(city)
      }

      return city
    }
    finally {
      finish()
    }
  }

  const toggleVisibility = async (row: DeliveryRow) => {
    start()
    try {
      const response = row.hidden ? await apiShow(row.id) : await apiHide(row.id)
      if (response.data) {
        applyCity(response.data)
      }
    }
    finally {
      finish()
    }
  }

  const downloadExcel = async () => {
    if (isExporting.value) {
      return
    }

    isExporting.value = true
    try {
      const blobData = await apiExportExcel()
      const blob = blobData instanceof Blob
        ? blobData
        : new Blob([blobData], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url

      const dateStr = new Date().toISOString().slice(0, 10)
      link.setAttribute("download", `delivery_costs_${dateStr}.xlsx`)

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }
    catch {
      alert("Ошибка при экспорте файла")
    }
    finally {
      isExporting.value = false
    }
  }

  watch(
    [() => toValue(options?.page), () => toValue(options?.perPage), () => toValue(options?.cityCode)],
    ([p, l, c]) => {
      if (typeof p === "number") {
        pageRef.value = p
      }
      if (typeof l === "number") {
        perPageRef.value = l
      }
      cityCodeRef.value = c ?? undefined
      fetchCities(pageRef.value, perPageRef.value)
    },
    { immediate: false },
  )

  return {
    cities: readonly(allCities),
    citiesPage: readonly(citiesPage),
    deliveryRows,
    pagination: readonly(pagination),
    isLoading: readonly(isLoading),
    reloadAll,
    reload: reloadAll,
    fetchCities,
    onPaginationChange,
    saveEdit,
    toggleVisibility,
    downloadExcel,
    isExporting: readonly(isExporting),
    setCityCode: (code?: string) => {
      cityCodeRef.value = code
      fetchCities(1, perPageRef.value)
    },
  }
}
