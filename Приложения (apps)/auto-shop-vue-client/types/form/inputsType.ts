import type { FileResponse } from "./file"
import type { OptionListBox, OptionRadioGroup, OptionRadioGroupImage } from "@/types/form/optionType"
import type { InputsTypeEnum } from "@/types/form/inputsTypeEnum"

export interface InputBase {
  name?: string
  label?: string
  description?: string
  disabled?: boolean
  placeholder?: string
  autocomplete?: string
  readonly?: boolean
}

export type TextInput = InputBase & {
  type: InputsTypeEnum.Text
  value: string
}

export type NumberInput = InputBase & {
  type: InputsTypeEnum.Number
  value: number
  min: number
  max: number
  step: number
}

export type ListBoxInput = InputBase & {
  type: InputsTypeEnum.ListBox
  value: OptionListBox | undefined
  options: OptionListBox[]
}

export type RadioGroupInput = InputBase & {
  type: InputsTypeEnum.RadioGroup
  value: OptionRadioGroup | undefined
  options: OptionRadioGroup[]
}

export type RadioGroupImageInput = InputBase & {
  type: InputsTypeEnum.RadioGroupImage
  value: OptionRadioGroupImage | undefined
  options: OptionRadioGroupImage[]
}

export type FileInput = InputBase & {
  type: InputsTypeEnum.File
  clientId?: number
  collection?: "documents" | "public"
  maxFiles?: number
  uploadMaxFilesize?: string
  accept?: string
  multiple?: boolean
  files?: FileResponse[]
}
