import type Response from "@/types/responses/response"
import type {
  UpdateNewBody,
  CalculateBody,
} from "@/types/requests/calculatorOption"
import type { CalculatorOption, Calculate } from "@/types/responses/calculatorOption"

export function useApiCalculatorOption() {
  const $api = useNuxtApp().$api as typeof $fetch
  const baseUrl = "/api/v1/calc"

  const index = (): Promise<Response<CalculatorOption[]>> => {
    return $api(`${baseUrl}`, {
      method: "GET",
    })
  }

  const updateNew = (body: UpdateNewBody): Promise<Response<CalculatorOption>> => {
    return $api(`${baseUrl}/new`, {
      method: "PATCH",
      body,
    })
  }

  const calculate = (body: CalculateBody): Promise<Response<Calculate>> => {
    return $api(`${baseUrl}`, {
      method: "PUT",
      body,
    })
  }

  return {
    index,
    updateNew,
    calculate,
  }
}
