export type ApiCallOpts = {
  camelize?: boolean
  snakeParams?: boolean
}

export function useApiParamTransform() {
  const $api = useNuxtApp().$api as (url: string, opts?: any) => Promise<any>

  const defaults: Required<ApiCallOpts> = {
    camelize: true,
    snakeParams: false,
  }

  const call = <T>(endpoint: string, fetchOpts: any = {}, opts: ApiCallOpts = {}) =>
    $api(endpoint, {
      ...fetchOpts,
      ...defaults,
      camelize: opts.camelize ?? defaults.camelize,
      snakeParams: opts.snakeParams ?? defaults.snakeParams,
    }) as Promise<T>

  return { call }
}
