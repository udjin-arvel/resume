declare module "nuxt/schema" {
  interface PublicRuntimeConfig {
    apiBase: string
    maxMultipartUploadBatchSizeBytes: number
    reverb: {
      key: string
      host: string
      port: number
      scheme: string
    }
    auth: {
      jwt_ttl_second: number
      jwt_cookie_name: string
      jwt_refresh_second: number
      refresh_enabled: boolean
    }
  }
}

export {}
