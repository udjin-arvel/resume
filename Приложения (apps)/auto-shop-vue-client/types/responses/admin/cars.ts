import type { ApiMetaList } from "@/types/responses/response"
import type { CarFilterOption } from "~/types/common/adminCars"

export interface CompletionMeta extends ApiMetaList {
  models: CarFilterOption[]
  brand: CarFilterOption
}
