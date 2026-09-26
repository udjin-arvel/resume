import { apiRequest } from '../../api/client'

export type AdminStatsOverview = {
  dau: number
  wau: number
  mau: number
  totalUsers: number
  premiumUsers: number
  premiumConversionRate: number
  productCacheHitRate: number
  paywallShownLast30d: number
  purchaseSuccessLast30d: number
  purchaseConversionRate: number
  scansLast14Days: { day: string; count: number }[]
}

export function fetchStatsOverview() {
  return apiRequest<AdminStatsOverview>('/v1/admin/stats/overview')
}
