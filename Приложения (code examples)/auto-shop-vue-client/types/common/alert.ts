export enum AlertTypeEnum {
  Error = "error",
  Warning = "warning",
  Success = "success",
  Info = "info",
}

export interface Alert {
  id?: number
  subtitle: string
  text?: string
  type: AlertTypeEnum
}
