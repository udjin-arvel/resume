import type { AuthMiddlewareMeta } from "@/types/auth/authMiddlewareMeta"

declare module "vue-router" {
  interface RouteMeta {
    auth?: AuthMiddlewareMeta
    fillHeight?: boolean
  }
}
