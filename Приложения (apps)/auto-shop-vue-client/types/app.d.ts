import type { AuthMiddlewareMeta } from "@/types/common/authMiddlewareMeta"

declare module "#app" {
  interface PageMeta {
    auth?: AuthMiddlewareMeta
    layout?: string
    compact?: boolean
    roles?: string[] | string
    breadcrumb?: string
  }

  interface NuxtError {
    data?: {
      code?: string
      message?: string
    }
  }
}
