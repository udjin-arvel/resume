import type { BrandApi, SeriesApi, ModelApi, EngineApi, CarDetails, CarDetailsFull, ModelFullApi } from "@/types/responses/car"

export function useApiCar() {
  const $api = useNuxtApp().$api as typeof $fetch
  const baseUrl = "/api/v1"

  type FetchOpts = Parameters<typeof $fetch>[1]

  const getBrands = async (): Promise<BrandApi[]> => {
    return await $api<BrandApi[]>(`${baseUrl}/brands`)
  }

  const getSeries = async (brandId: number, options?: FetchOpts): Promise<SeriesApi[]> => {
    return await $api<SeriesApi[]>(`${baseUrl}/brands/${brandId}/series`, options)
  }

  const getModels = async (seriesId: number, options?: FetchOpts): Promise<ModelApi[]> => {
    return await $api<ModelApi[]>(`${baseUrl}/series/${seriesId}/models`, options)
  }

  const getEngines = async (seriesId: number, options?: FetchOpts): Promise<EngineApi[]> => {
    return await $api<EngineApi[]>(`${baseUrl}/series/${seriesId}/engines`, options)
  }

  const getCarDetails = async (modelId: number, options?: FetchOpts): Promise<CarDetails> => {
    return await $api<CarDetails>(`${baseUrl}/cars/${modelId}/details`, options)
  }

  const getCarDetailsFull = async (modelId: number, options?: FetchOpts): Promise<CarDetailsFull> => {
    return await $api<CarDetailsFull>(`${baseUrl}/cars/${modelId}/details-full`, options)
  }

  const getYearsBySeries = async (seriesId: number): Promise<number[]> => {
    return await $api<number[]>(`${baseUrl}/series/${seriesId}/years`)
  }

  const getModelsBySeriesAndYear = async (seriesId: number, year: number): Promise<ModelApi[]> => {
    return await $api<ModelApi[]>(`${baseUrl}/series/${seriesId}/models/${year}`)
  }

  const getModelsFullBySeries = async (seriesId: number): Promise<ModelFullApi[]> => {
    return await $api(`${baseUrl}/series/${seriesId}/models-full`)
  }

  return {
    getBrands,
    getSeries,
    getModels,
    getEngines,
    getCarDetails,
    getCarDetailsFull,
    getYearsBySeries,
    getModelsBySeriesAndYear,
    getModelsFullBySeries,
  }
}
