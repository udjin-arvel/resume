import { ref } from "vue"
import { ALL_COLORS } from "@/constants/cars"
import type { ColorValue } from "@/types/common/cars"
import type { OptionBaseColor } from "@/types/form/optionType"

export default function useCarColors() {
  const { t } = useI18n()

  const colorHexMap: Record<ColorValue, string> = {
    white: "#FFFFFF",
    black: "#000000",
    gray: "#808080",
    silver: "#C0C0C0",
    blue: "#1E3A8A",
    red: "#DC2626",
    green: "#16A34A",
    brown: "#8B5C2A",
    yellow: "#FACC15",
    beige: "#F5F5DC",
  }

  const colors = ref<OptionBaseColor[]>(
    ALL_COLORS.map((value, index) => ({
      id: index + 1,
      value,
      name: t(`cars.colors.${value}`),
      color: colorHexMap[value],
      disabled: false,
    })),
  )

  return {
    colors,
  }
}
