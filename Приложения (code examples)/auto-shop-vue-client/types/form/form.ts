import type {
  TextInput,
  NumberInput,
  ListBoxInput,
  RadioGroupInput,
  RadioGroupImageInput,
  FileInput,
} from "@/types/form/inputsType"

export type InputType = TextInput | NumberInput | ListBoxInput | RadioGroupInput | RadioGroupImageInput | FileInput

export type InputOptionType = ListBoxInput | RadioGroupInput | RadioGroupImageInput

export type FormControl<T extends InputType> = T

export const FieldControl = ({ name, ...rest }: Partial<FormControl<any>>): FormControl<any> => ({
  ...rest,
  name,
})
