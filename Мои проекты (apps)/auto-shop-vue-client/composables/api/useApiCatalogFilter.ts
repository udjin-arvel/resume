import type Response from "@/types/responses/response"
import type { CatalogFilterResponse, PartsFilterResponse, BuyerResponse, SavedFilter, FilterOptionsResponse, FilterOptionParams } from "@/types/catalog/filter"

export function useApiCatalogFilter() {
  const $api = useNuxtApp().$api as typeof $fetch

  const getBrands = (params: FilterOptionParams = {}): Promise<Response<CatalogFilterResponse[]>> => {
    return $api<Response<CatalogFilterResponse[]>>("api/v1/catalog/filter/brands", {
      method: "get",
      query: {
        isSeller: params.isSeller,
        condition: params.condition,
        sale_status: params.sale_status,
        deleted: params.deleted,
        archive: params.archive,
        favorites: params.favorites,
      },
    })
  }

  const getModels = (brandId: number, params: FilterOptionParams = {}): Promise<Response<CatalogFilterResponse[]>> => {
    return $api<Response<CatalogFilterResponse[]>>("api/v1/catalog/filter/brands/" + String(brandId) + "/models", {
      method: "get",
      query: {
        isSeller: params.isSeller,
        condition: params.condition,
        sale_status: params.sale_status,
        deleted: params.deleted,
        archive: params.archive,
        favorites: params.favorites,
      },
    })
  }

  const getCompletions = (modelId: number, params: FilterOptionParams = {}): Promise<Response<CatalogFilterResponse[]>> => {
    return $api<Response<CatalogFilterResponse[]>>("api/v1/catalog/filter/models/" + String(modelId) + "/completions", {
      method: "get",
      query: {
        isSeller: params.isSeller,
        condition: params.condition,
        sale_status: params.sale_status,
        deleted: params.deleted,
        archive: params.archive,
        favorites: params.favorites,
      },
    })
  }

  const getParts = (params: FilterOptionParams = {}): Promise<Response<PartsFilterResponse>> => {
    return $api<Response<PartsFilterResponse>>("api/v1/catalog/filter/parts", {
      method: "get",
      query: {
        brand_id: params.brand_id,
        model_id: params.model_id,
        isSeller: params.isSeller,
        condition: params.condition,
        sale_status: params.sale_status,
        deleted: params.deleted,
        archive: params.archive,
        favorites: params.favorites,
        init: params.init,
      },
    })
  }

  const getFilterOptions = (params: FilterOptionParams = {}): Promise<Response<FilterOptionsResponse>> => {
    return $api<Response<FilterOptionsResponse>>("api/v1/catalog/filter/options", {
      method: "get",
      query: {
        brand_id: params.brand_id,
        model_id: params.model_id,
        isSeller: params.isSeller,
        condition: params.condition,
        sale_status: params.sale_status,
        deleted: params.deleted,
        archive: params.archive,
        favorites: params.favorites,
        init: params.init,
      },
    })
  }

  const getBuyers = (): Promise<Response<BuyerResponse[]>> => {
    return $api<Response<BuyerResponse[]>>("api/v1/catalog/filter/buyers", {
      method: "get",
    })
  }

  const getManagers = (): Promise<Response<BuyerResponse[]>> => {
    return $api<Response<BuyerResponse[]>>("api/v1/catalog/filter/managers", {
      method: "get",
    })
  }

  const saveFilter = (data: { name: string, body: string }): Promise<Response<SavedFilter>> => {
    return $api<Response<SavedFilter>>("api/v1/catalog/filters", {
      method: "post",
      body: data,
    })
  }

  const getSavedFilters = (): Promise<Response<SavedFilter[]>> => {
    return $api<Response<SavedFilter[]>>("api/v1/catalog/filters", { method: "get" })
  }

  return {
    getBrands,
    getModels,
    getCompletions,
    getParts,
    getFilterOptions,
    getBuyers,
    getManagers,
    saveFilter,
    getSavedFilters,
  }
}
