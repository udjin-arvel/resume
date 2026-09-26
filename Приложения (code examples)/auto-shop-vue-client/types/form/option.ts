import type { OptionListBox, OptionRadioGroup, OptionRadioGroupImage, OptionBase } from "@/types/form/optionType"

export const defaultOptionBase: OptionBase = {
  id: 0,
  name: "Выбрать",
  value: 0,
  disabled: true,
}

export const defaultOptionListBox: OptionListBox = {
  id: 0,
  name: "Выбрать",
  value: 0,
  disabled: true,
  price: undefined,
}

export const defaultOptionRadioGroup: OptionRadioGroup = {
  id: 0,
  name: "Выбрать",
  value: 0,
  disabled: true,
  price: undefined,
}

export const defaultOptionRadioGroupImage: OptionRadioGroupImage = {
  id: 0,
  name: "Выбрать",
  value: 0,
  disabled: true,
  price: undefined,
  image: "/img/no-image.png",
}
