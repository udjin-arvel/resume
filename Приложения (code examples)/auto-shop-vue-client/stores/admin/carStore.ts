import { defineStore } from "pinia"
import { ref } from "vue"
import { useApiAdminCar } from "@/composables/api/useApiAdminCar"
import type { CarFilterOption } from "~/types/common/adminCars"

export const useAdminCarStore = defineStore("adminCarStore", () => {
  const { brandFilter } = useApiAdminCar()

  const brandOptions = ref<CarFilterOption[]>([])

  async function loadBrandOptions() {
    if (brandOptions.value.length > 0) {
      return { data: brandOptions.value }
    }

    const res = await brandFilter()

    if (res.data) {
      brandOptions.value = res.data
    }

    return res
  }

  return {
    brandOptions,
    loadBrandOptions,
  }
})
