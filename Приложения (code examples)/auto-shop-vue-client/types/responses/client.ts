import type { User } from "@/types/common/entities"
import type { Status } from "@/types/common/statuses"
import type { RoleCompany } from "@/constants/roles"
import type { ClientType } from "@/types/common/userEntities"
import type { ClientPortChinaExpenseSetting } from "@/types/responses/chinaExpenses"
import type { ApiMetaList, ApiResponse } from "~/types/responses/response"

export interface Client {
  id: number
  name: string
  fio?: string
  phone?: string
  email?: string
  inn?: string
  address?: string
  contact?: string
  status: Status
  role: typeof RoleCompany
  type: ClientType
  balance?: number | string
  deposit?: number | string
  china_expenses_settings?: ClientPortChinaExpenseSetting[]
  children: User[]
}

export interface ClientBalanceListMeta extends ApiMetaList {
  clientName: string
  clientBalance: number
  clientDeposit: number
  managers: { id: number, name: string }[]
  payers: string[]
}

export type ClientBalanceApiListStrictResponse<TItem> = ApiResponse<TItem[], ClientBalanceListMeta> & {
  meta: ClientBalanceListMeta
}
