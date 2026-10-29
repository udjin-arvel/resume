import type { FetchOptions } from "ofetch"

export interface ApiFetchOptions extends FetchOptions {
  skipValidationNotify?: boolean
}
