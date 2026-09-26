export interface OptionBase {
  id: number
  name: string | number
  value: string | number
  disabled: boolean
  image?: string
}

export type OptionListBox = OptionBase & {
  price: string | undefined
}

export type OptionRadioGroup = OptionBase & {
  price: string | undefined
}

export type OptionRadioGroupImage = OptionBase & {
  price: string | undefined
}

export interface OptionBaseColor extends OptionBase {
  color: string
}
