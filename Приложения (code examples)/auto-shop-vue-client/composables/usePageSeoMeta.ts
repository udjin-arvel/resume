/**
 * SEO meta с высоким приоритетом в <head> — выше inline CSS.
 * Нужно для Telegram и других краулеров, читающих только начало HTML.
 */
export function usePageSeoMeta(
  input: Parameters<typeof useSeoMeta>[0],
  options?: Parameters<typeof useSeoMeta>[1],
) {
  return useSeoMeta(input, {
    ...options,
    tagPriority: options?.tagPriority ?? 15,
  })
}
