export type CalculatorOption = {
  id: number
  status: "new" | "used"
  from: "auto_cost" | null
  engine_type: "petrol" | "electric" | null
  coefficient: string
  surcharge: number
  created_at: string
  updated_at: string
}

export interface Calculate {
  china_expenses: number | null
  delivery_cost: number | null
  cost: number | null
  total: number | null
}
