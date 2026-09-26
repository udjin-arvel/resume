import { ref, readonly } from "vue"
import Errors from "@/classes/errors"
import type { OptionBase } from "@/types/form/optionType"
import { useApiCar } from "@/composables/api/useApiCar"
import { useCarStore } from "@/stores/carStore"
import type { BrandApi, SeriesApi, ModelApi, EngineApi, CarDetails, CarDetailsFull } from "@/types/responses/car"

export default function useCar() {
  const { isLoading } = useLoadingIndicator()
  const carStore = useCarStore()

  const {
    getSeries: _getSeries,
    getModels: _getModels,
    getEngines: _getEngines,
    getCarDetails: _getCarDetails,
    getYearsBySeries: _getYearsBySeries,
    getModelsBySeriesAndYear: _getModelsBySeriesAndYear,
    getModelsFullBySeries: _getModelsFullBySeries,
    getCarDetailsFull: _getCarDetailsFull,
  } = useApiCar()

  const errors = ref(new Errors())

  const brands = ref<OptionBase[]>([])
  const series = ref<OptionBase[]>([])
  const models = ref<OptionBase[]>([])
  const modelOptions = ref<OptionBase[]>([])
  const yearOptions = ref<OptionBase[]>([])
  const engines = ref<OptionBase[]>([])
  const carDetails = ref<CarDetails | null>(null)
  const carDetailsFull = ref<CarDetailsFull | null>(null)
  const allModelsFull = ref<any[]>([])

  const formatOptions = <
    T extends { id: number, name: string, value?: string | number, image?: string | null },
  >(
    data: T[],
    valueKey: keyof T = "id",
  ): OptionBase[] => {
    return data.map(item => ({
      id: item.id,
      value: (item[valueKey] as string | number) ?? item.id,
      name: item.name,
      disabled: false,
      ...(item.image != null && item.image !== "" ? { image: item.image } : {}),
    }))
  }

  const formatBrands = (data: BrandApi[]) => formatOptions(data)
  const formatSeries = (data: SeriesApi[]) => formatOptions(data)
  const formatModels = (data: ModelApi[]) => formatOptions(data)
  const formatEngines = (data: EngineApi[]) => formatOptions(data, "value")
  const formatModelsBySeriesAndYear = (data: ModelApi[]) => formatOptions(data)

  const formatYearsBySeries = (data: number[]): OptionBase[] => {
    return data.map(year => ({
      id: Number(year),
      value: Number(year),
      name: String(year),
      disabled: false,
    }))
  }

  const getBrands = async (): Promise<OptionBase[]> => {
    const rawBrands = await carStore.loadBrands()
    const formatted = formatBrands(rawBrands)
    brands.value = formatted
    return formatted
  }

  const getSeries = async (brandId: number, options?: any): Promise<OptionBase[]> => {
    const res = await _getSeries(brandId, options)
    series.value = formatSeries(res)
    return series.value
  }

  const getModels = async (seriesId: number, options?: any): Promise<OptionBase[]> => {
    const res = await _getModels(seriesId, options)
    models.value = formatModels(res)
    return models.value
  }

  const getEngines = async (seriesId: number, options?: any): Promise<OptionBase[]> => {
    const res = await _getEngines(seriesId, options)
    engines.value = formatEngines(res)
    return engines.value
  }

  const getCarDetails = async (modelId: number, options?: any): Promise<CarDetails> => {
    carDetails.value = await _getCarDetails(modelId, options)
    return carDetails.value
  }

  const getCarDetailsFull = async (modelId: number, options?: any): Promise<CarDetailsFull> => {
    carDetailsFull.value = await _getCarDetailsFull(modelId, options)
    return carDetailsFull.value
  }

  const getYearsBySeries = async (seriesId: number): Promise<OptionBase[]> => {
    const res = await _getYearsBySeries(seriesId)
    yearOptions.value = formatYearsBySeries(res)
    return yearOptions.value
  }

  const getModelsBySeriesAndYear = async (seriesId: number, year: number): Promise<OptionBase[]> => {
    const res = await _getModelsBySeriesAndYear(seriesId, year)
    modelOptions.value = formatModelsBySeriesAndYear(res)
    return modelOptions.value
  }

  const getModelsFullBySeries = async (seriesId: number): Promise<any[]> => {
    const res = await _getModelsFullBySeries(seriesId)
    allModelsFull.value = res
    modelOptions.value = res.map((m: any) => ({
      id: m.id, value: m.id, name: m.name, disabled: false,
    }))
    return res
  }

  return {
    isLoading: readonly(isLoading),
    errors,
    brands: readonly(brands),
    series: readonly(series),
    models: readonly(models),
    engines: readonly(engines),
    carDetails: readonly(carDetails),
    getBrands,
    getSeries,
    getModels,
    getEngines,
    getCarDetails,
    getCarDetailsFull,
    getYearsBySeries,
    getModelsBySeriesAndYear,
    getModelsFullBySeries,
    allModelsFull,
  }
}
