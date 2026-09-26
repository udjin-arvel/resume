import type { ApiResponse } from "@/types/responses/response"
import type {
  ChinaExpensesPortSetting,
  ChinaExpensesSettingUpdate,
} from "@/types/responses/chinaExpenses"
import { useApiParamTransform } from "@/composables/api/useApiParamTransform"

export function useApiChinaExpenses() {
  const { call } = useApiParamTransform()
  const baseUrl = "api/v1/company/china-expenses"

  const index = () => call<ApiResponse<ChinaExpensesPortSetting[]>>(
    baseUrl,
    { method: "GET" },
  )

  const update = (portCode: string, payload: ChinaExpensesSettingUpdate) => call<ApiResponse<ChinaExpensesSettingUpdate & { portCode: string }>>(
    `${baseUrl}/${portCode}`,
    { method: "PUT", body: payload },
  )

  const showForClient = (clientId: number | string) => call<ApiResponse<ChinaExpensesPortSetting[]>>(
    `api/v1/clients/${clientId}/china-expenses`,
    { method: "GET" },
  )

  return { index, update, showForClient }
}
