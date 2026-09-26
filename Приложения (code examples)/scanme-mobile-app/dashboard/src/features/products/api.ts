import { apiRequest } from '../../api/client'

export type ProductIngredient = {
  id?: string
  text: string
  percent?: string
  rank?: number
  vegan?: string
  vegetarian?: string
}

export type Product = {
  barcode: string
  name: string
  brands?: string
  imageUrl?: string
  ingredients: ProductIngredient[]
  source: string
  fetchedAt: string
  cachedUntil: string
}

export type ProductPayload = {
  barcode: string
  name: string
  brands: string
  imageUrl: string
  ingredients: ProductIngredient[]
}

export type ProductListResponse = {
  items: Product[]
}

export type ProductFilters = {
  q?: string
}

export function listAdminProducts(filters: ProductFilters) {
  const params = new URLSearchParams({ limit: '100' })
  if (filters.q) {
    params.set('q', filters.q)
  }

  return apiRequest<ProductListResponse>(`/v1/admin/products?${params.toString()}`)
}

export function createProduct(payload: ProductPayload) {
  return apiRequest<Product>('/v1/admin/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateProduct(barcode: string, payload: ProductPayload) {
  return apiRequest<Product>(`/v1/admin/products/${encodeURIComponent(barcode)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteProduct(barcode: string) {
  return apiRequest<void>(`/v1/admin/products/${encodeURIComponent(barcode)}`, {
    method: 'DELETE',
  })
}
