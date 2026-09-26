import { defineStore } from "pinia"
import { ref } from "vue"
import { useApiCar } from "@/composables/api/useApiCar"
import type { BrandApi } from "@/types/responses/car"

export const useCarStore = defineStore("carStore", () => {
  const { getBrands } = useApiCar()

  const brands = ref<BrandApi[]>([])

  async function loadBrands(): Promise<BrandApi[]> {
    if (brands.value.length > 0) {
      return brands.value
    }

    try {
      const data = await getBrands()
      brands.value = data
      return data
    }
    catch (error) {
      console.error("Error loading brands in store:", error)
      throw error
    }
  }

  async function reloadBrands() {
    brands.value = []
    return loadBrands()
  }

  return {
    brands,
    loadBrands,
    reloadBrands,
  }
})
