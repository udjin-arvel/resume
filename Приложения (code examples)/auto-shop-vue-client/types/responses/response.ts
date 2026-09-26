import type { KindTypeEnum } from "@/types/common/notification"

interface Meta {
  total?: number
  token?: string
  totals?: any
  currentPage?: number
  lastPage?: number
  limit?: number
  offset?: number
}

interface Redirect {
  to: string
  external: boolean
}

export default interface Response<T> {
  message?: string
  errors?: JsonData<string & Array<string>> // ?? errors no use
  data?: T
  meta?: Meta
  redirect?: Redirect
  notify?: KindTypeEnum
}

export type ApiStatus = "success" | "error"

export type ApiResponse<TData, TMeta = Meta> = {
  status?: ApiStatus
  message?: string
  errors?: JsonData<string & Array<string>>
  data: TData
  meta?: TMeta
  redirect?: Redirect
  notify?: KindTypeEnum
}

export type ApiMetaList = {
  currentPage: number
  lastPage: number
  limit: number
  offset: number
  total: number
}

export type ApiListStrictResponse<TItem> = ApiResponse<TItem[], ApiMetaList> & {
  meta: ApiMetaList
}
export type ApiListResponse<TItem> = ApiResponse<TItem[], ApiMetaList | undefined>
