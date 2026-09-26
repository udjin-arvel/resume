import type InputsTypeEnum from "@/types/form/inputsTypeEnum"

export interface InputCAttributeValue {
  code: string
  type: InputsTypeEnum
  value_id: string
  value_name: string
  value_value: string
  value_price: number
}

export interface InputCValue {
  id: string
  name: string
  value: string | number
  price: number
}
