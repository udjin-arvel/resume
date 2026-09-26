import type { CalculatePowerType, Seaport, Status } from "@/types/common/cars"

export type UpdateNewBody = {
  from: "auto_cost"
  engine_type: "petrol" | "electric"
  coefficient: number | string
  surcharge: number
}

export type CalcRow = {
  id: number
  status: "new" | "used"
  from: "auto_cost" | null
  engine_type: "petrol" | "electric" | null
  coefficient: string
  surcharge: number
  created_at: string
  updated_at: string
}

export interface CalculateBody {
  status: Status
  cost: number
  city?: string
  seaport?: Seaport
  power_type?: CalculatePowerType
}
