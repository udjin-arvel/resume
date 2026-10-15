import { computed, type Ref } from "vue"
import { POPULAR_BRANDS } from "@/constants/popularBrands"
import type { OptionBase } from "~/types/form/optionType"

function renameBrand(name: string): string {
  const lower = name.toLowerCase()
  if (lower === "ideal car") {
    return "Li"
  }
  if (lower === "modern") {
    return "Hyundai"
  }
  if (lower === "extremely krypton") {
    return "Zeekr"
  }
  return name
}

export const useSortedBrands = (brands: Ref<OptionBase[]>) => {
  const sortedBrands = computed(() => {
    if (!brands.value?.length) {
      return []
    }

    const popularSet = new Set(POPULAR_BRANDS.map(b => b.toLowerCase()))
    const pinned: OptionBase[] = []
    const others: OptionBase[] = []
    const seenNames = new Set<string>()

    brands.value.forEach((brandItem) => {
      const originalName = String(brandItem.name)

      if (originalName === "AUDI") {
        return
      }

      const newName = renameBrand(originalName)
      const lowerName = newName.toLowerCase()

      seenNames.add(lowerName)

      const brand = { ...brandItem, name: newName }

      if (popularSet.has(lowerName)) {
        pinned.push(brand)
      }
      else {
        others.push(brand)
      }
    })

    pinned.sort((a, b) => String(a.name).localeCompare(String(b.name)))
    others.sort((a, b) => String(a.name).localeCompare(String(b.name)))

    return [...pinned, ...others]
  })

  return {
    sortedBrands,
  }
}
