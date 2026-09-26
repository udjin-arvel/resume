export enum KindTypeEnum {
  Error = "error",
  Warning = "warning",
  Success = "success",
  Info = "info",
}

export interface Notification {
  id?: string
  kind: KindTypeEnum
  subtitle: string
}
