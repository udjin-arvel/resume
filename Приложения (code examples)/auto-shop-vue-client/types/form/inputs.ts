import type {
  InputBase,
  TextInput,
  NumberInput,
  ListBoxInput,
  RadioGroupInput,
  RadioGroupImageInput,
  FileInput,
} from "@/types/form/inputsType"
import InputsTypeEnum from "@/types/form/inputsTypeEnum"

export const FieldBase = ({
  label = undefined,
  description = undefined,
  disabled = false,
  placeholder = undefined,
  autocomplete = undefined,
  readonly = false,
}: InputBase): InputBase =>
  ({
    label,
    description,
    disabled,
    placeholder,
    autocomplete,
    readonly,
  }) as InputBase

export const TextField = ({ value = "", ...rest }: Partial<TextInput>): TextInput => ({
  ...FieldBase(rest),
  value,
  type: InputsTypeEnum.Text,
})

export const NumberField = ({
  value = NaN,
  min = 0,
  max = 100,
  step = 1,
  ...rest
}: Partial<NumberInput>): NumberInput => ({
  ...FieldBase(rest),
  value,
  min,
  max,
  step,
  type: InputsTypeEnum.Number,
})

export const ListBoxField = ({ value = undefined, options = [], ...rest }: Partial<ListBoxInput>): ListBoxInput => ({
  ...FieldBase(rest),
  value,
  options,
  type: InputsTypeEnum.ListBox,
})

export const RadioGroupField = ({
  value = undefined,
  options = [],
  ...rest
}: Partial<RadioGroupInput>): RadioGroupInput => ({
  ...FieldBase(rest),
  value,
  options,
  type: InputsTypeEnum.RadioGroup,
})

export const RadioGroupImageField = ({
  value = undefined,
  options = [],
  ...rest
}: Partial<RadioGroupImageInput>): RadioGroupImageInput => ({
  ...FieldBase(rest),
  value,
  options,
  type: InputsTypeEnum.RadioGroupImage,
})

export const FileField = ({
  clientId,
  collection = "documents",
  maxFiles = 10,
  uploadMaxFilesize = "20MB",
  accept,
  multiple,
  files = [],
  ...rest
}: Partial<FileInput>): FileInput => ({
  ...FieldBase(rest),
  clientId,
  collection,
  maxFiles,
  uploadMaxFilesize,
  accept,
  multiple,
  files,
  type: InputsTypeEnum.File,
})
