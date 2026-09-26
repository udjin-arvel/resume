export type AuthMiddlewareMeta = boolean | {
  unauthenticatedOnly: boolean
  navigateAuthenticatedTo?: string
  navigateUnauthenticatedTo?: string
}

export interface AuthMiddlewareMetaNormalized {
  unauthenticatedOnly: boolean
  navigateAuthenticatedTo: string
  navigateUnauthenticatedTo?: string
}
