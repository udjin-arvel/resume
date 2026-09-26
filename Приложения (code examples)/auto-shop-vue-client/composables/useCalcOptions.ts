import { ref, readonly } from "vue"
import { useLoadingIndicator } from "#imports"
import Errors from "@/classes/errors"
import { useApiCalculatorOption } from "@/composables/api/useApiCalculatorOption"
import type { CalcRow } from "@/types/requests/calculatorOption"
import {
  PowerTypePetrol,
  PowerTypeElectric,
  StatusNew,
} from "@/constants/cars"
import type { PowerType } from "@/types/common/cars"

export default function useCalcOptions() {
  const { start, finish, isLoading } = useLoadingIndicator()
  const { index, updateNew } = useApiCalculatorOption()

  const coefficientUsed = ref<number | undefined>(undefined)
  const fixedAmountUsed = ref<number | undefined>(undefined)

  const fuelTypeUsed = ref<PowerType>(PowerTypePetrol)

  const errorsNew = ref(new Errors())

  const load = async () => {
    start()
    try {
      const res = await index()
      const list = (res.data || []) as CalcRow[]

      const row = list.find(
        o => o.status === StatusNew && o.from === "auto_cost" && o.engine_type === fuelTypeUsed.value,
      )
      if (row) {
        coefficientUsed.value = Number(row.coefficient)
        fixedAmountUsed.value = row.surcharge
      }
    }
    finally {
      finish()
    }
  }

  const saveNew = async (): Promise<boolean> => {
    start()
    errorsNew.value.clear()
    try {
      await updateNew({
        from: "auto_cost",
        engine_type: fuelTypeUsed.value === PowerTypeElectric
          ? PowerTypeElectric
          : PowerTypePetrol,
        coefficient: coefficientUsed.value ?? 0,
        surcharge: fixedAmountUsed.value ?? 0,
      })
      return true
    }
    catch (error: any) {
      const resp = error.data || {}
      if (resp.errors) {
        errorsNew.value.record(resp.errors)
      }
      return false
    }
    finally {
      finish()
    }
  }

  return {
    isLoading: readonly(isLoading),
    coefficientUsed,
    fixedAmountUsed,
    fuelTypeUsed,
    errorsNew,
    load,
    saveNew,
  }
}
