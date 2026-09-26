import { ref, readonly } from "vue"
import Errors from "@/classes/errors"
import type { SearchRequestUpdate, RejectProposalRequest, SearchRequestCar, NeedVariantFormState } from "@/types/requests/searchRequest"
import { SearchRequestStore } from "@/types/requests/searchRequest"
import type { NamedEntity } from "@/types/common/entities"
import type { SearchRequest, SearchRequestDetail, OpenRequestRaw, RequestOption } from "@/types/responses/searchRequest"
import type Response from "@/types/responses/response"
import type { ApiMetaList } from "@/types/responses/response"
import type { ListingPreview } from "@/types/responses/listing"
import { useApiSearchRequests } from "@/composables/api/useApiSearchRequests"
import { useApiListing } from "@/composables/api/useApiListing"
import useCar from "@/composables/useCar"
import type { OptionBase } from "@/types/form/optionType"
import { RequestStatusDraft } from "@/constants/statuses"
import { useDate } from "@/composables/useDate"
import { variantToPayload } from "@/composables/needs/useNeedVariantsForm"

export default function useSearchRequest(_request?: SearchRequestUpdate) {
  const { isLoading, start, finish } = useLoadingIndicator()
  const { t } = useI18n()
  const {
    store: apiStore,
    update: apiUpdate,
    show: apiShow,
    updateStatus: apiUpdateStatus,
    acknowledgeChanges: apiAcknowledgeChanges,
    getOpenRequests: apiGetOpenRequests,
    bindListingsToRequest: apiBindListingsToRequest,
    rejectProposal: apiRejectProposal,
    assignExecutor: apiAssignExecutor,
    getSellers: apiGetSellers,
    requestMoreVariants: apiRequestMoreVariants,
    duplicate: apiDuplicate,
  } = useApiSearchRequests()

  const { getAvailableListings } = useApiListing()

  const {
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
  } = useCar()

  const requestData = ref<SearchRequestStore | SearchRequestUpdate>(new SearchRequestStore())
  const errors = ref(new Errors())

  const brands = ref<OptionBase[]>([])
  const series = ref<OptionBase[]>([])
  const models = ref<OptionBase[]>([])
  const yearOptions = ref<OptionBase[]>([])
  const modelOptions = ref<OptionBase[]>([])
  const { formatDate } = useDate()

  const isModelSelected = ref(false)
  const carImage = ref<string | null>(null)

  if (_request) {
    Object.assign(requestData.value as any, {
      condition: "used" as "new" | "used",
      clientName: _request.clientName ?? "",
      brand: _request.brand ?? undefined,
      series: _request.series ?? undefined,
      models: Array.isArray((_request as any)?.models) ? (_request as any).models : [],
      yearFrom: _request.yearFrom ?? null,
      yearTo: _request.yearTo ?? null,
      priceTo: _request.priceTo ?? null,
      mileageTo: _request.mileageTo ?? null,
      bodyColor: (_request as any).bodyColor ?? "",
      originalPaint: (_request as any).originalPaint ?? false,
      description: _request.description ?? "",
      status: _request.status ?? "",
    })
  }
  else {
    Object.assign(requestData.value as any, {
      condition: "used",
      clientName: "",
      brand: undefined,
      series: undefined,
      models: [],
      yearFrom: null,
      yearTo: null,
      priceTo: null,
      mileageTo: null,
      bodyColor: "",
      originalPaint: false,
      description: "",
      status: "",
    })
  }

  const hasUnacknowledgedChanges = (request: SearchRequest): boolean => {
    if (request.status === RequestStatusDraft) {
      return false
    }
    if (!request.changed_at) {
      return false
    }
    if (!request.acknowledged_at) {
      return true
    }
    return new Date(request.changed_at) > new Date(request.acknowledged_at)
  }

  const transformToBackendFormat = (
    data: SearchRequestStore,
    _isEdit = false,
    status?: string,
    variantsState?: NeedVariantFormState[],
  ): any => {
    const variants = (variantsState?.length
      ? variantsState
      : (data.variants?.length ? data.variants : null))

    if (variants?.length) {
      const result: Record<string, unknown> = {
        client_name: data.clientName,
        variants: variants.map(variantToPayload),
      }
      if (status) {
        result.status = status
      }
      return result
    }

    const brandId = data.brand?.value != null ? Number(data.brand.value) : undefined
    const seriesId = data.series?.value != null ? Number(data.series.value) : undefined

    const ids: number[] = Array.isArray((data as any).models)
      ? (data as any).models
          .map((o: any) => Number(o?.value ?? o))
          .filter((n: number) => Number.isFinite(n))
      : []

    let cars: SearchRequestCar[] = ids.map((id: number) => ({
      car_id: id,
      brand_id: brandId ?? null,
      series_id: seriesId ?? null,
      model_id: id,
    }))

    if (cars.length === 0 && (seriesId || brandId)) {
      const fallbackCarId = seriesId ?? brandId ?? 0

      if (fallbackCarId !== 0) {
        cars = [{
          car_id: fallbackCarId,
          brand_id: brandId ?? null,
          series_id: seriesId ?? null,
          model_id: null,
        }]
      }
    }

    const raw = (data as any).bodyColors as Array<{ value: unknown }> | undefined
    const hasAny = !!raw?.some(v => String(v?.value) === "__any__")
    const body_colors = hasAny
      ? null
      : (raw ?? [])
          .map(v => String(v?.value))
          .filter(s => s.length > 0)

    const result = {
      condition: data.condition,
      client_name: data.clientName,
      year_from: data.yearFrom,
      year_to: data.yearTo,
      price_to: data.priceTo,
      mileage_to: data.mileageTo,
      body_colors,
      original_paint: (data as any).originalPaint === true,
      description: data.description,
      cars,
      variants: [{
        priority: 1,
        condition: data.condition,
        year_from: data.yearFrom,
        year_to: data.yearTo,
        price_to: data.priceTo,
        mileage_to: data.mileageTo,
        body_colors,
        original_paint: (data as any).originalPaint === true,
        description: data.description,
        cars,
      }],
    }

    if (status) {
      (result as any).status = status
    }

    return result
  }

  const store = async (
    data: SearchRequestStore,
    status?: string,
    variantsState?: NeedVariantFormState[],
  ): Promise<number | undefined> => {
    start()
    errors.value.clear()
    try {
      const backendData = transformToBackendFormat(data, false, status, variantsState)
      const response = await apiStore(backendData)
      return (response as any)?.data?.id
    }
    catch (error: any) {
      const _error: Response<any> = error.data as Response<any> || {}
      if (_error.errors) {
        errors.value.record(_error.errors)
      }
    }
    finally {
      finish()
    }
  }

  const update = async (
    id: number,
    data: SearchRequestUpdate,
    status?: string,
    variantsState?: NeedVariantFormState[],
  ): Promise<boolean> => {
    start()
    errors.value.clear()
    try {
      const backendData = transformToBackendFormat(data as SearchRequestStore, true, status, variantsState)
      await apiUpdate(id, backendData)
      return true
    }
    catch (error: any) {
      const _error: Response<any> = error.data as Response<any> || {}
      if (_error.errors) {
        errors.value.record(_error.errors)
      }
      return false
    }
    finally {
      finish()
    }
  }

  const duplicateRequest = async (id: number): Promise<number | undefined> => {
    start()
    errors.value.clear()
    try {
      const response = await apiDuplicate(id)
      return (response as any)?.data?.id
    }
    catch (error: any) {
      const _error: Response<any> = error.data as Response<any> || {}
      if (_error?.errors) {
        errors.value.record(_error.errors)
      }
    }
    finally {
      finish()
    }
  }

  const show = async (id: number): Promise<SearchRequestDetail | undefined> => {
    start()
    errors.value.clear()
    try {
      const response = await apiShow(id)
      return response.data
    }
    catch (error: any) {
      const _error: Response<any> = error.data as Response<any> || {}
      if (_error?.errors) {
        errors.value.record(_error.errors)
      }
    }
    finally {
      finish()
    }
  }

  const updateStatus = async (
    id: number,
    status: "completed" | "cancelled" | "in_work" | "new",
    opts: { cancellation_reason?: string } = {},
  ): Promise<boolean> => {
    start()
    errors.value.clear()
    try {
      if (status === "cancelled" && !opts.cancellation_reason?.trim()) {
        errors.value.record({ cancellation_reason: t("validation.required") })
        return false
      }
      await apiUpdateStatus(id, status, opts)
      return true
    }
    catch (error: any) {
      const _error: Response<any> = error.data as Response<any> || {}
      if (_error.errors) {
        errors.value.record(_error.errors)
      }
      return false
    }
    finally {
      finish()
    }
  }

  const acknowledgeChanges = async (id: number): Promise<boolean> => {
    start()
    errors.value.clear()
    try {
      await apiAcknowledgeChanges(id)
      return true
    }
    catch (error: any) {
      const _error: Response<any> = error.data as Response<any> || {}
      if (_error.errors) {
        errors.value.record(_error.errors)
      }
      return false
    }
    finally {
      finish()
    }
  }

  const getOpenRequests = async (): Promise<RequestOption[]> => {
    start()
    errors.value.clear()
    try {
      const response = await apiGetOpenRequests()
      return response.data.map(item => ({
        id: item.id,
        value: item.value,
        name: item.disabled_reason === "booking_pending"
          ? `${formatRequestName(item)} — ${t("needs.booking_action_blocked")}`
          : formatRequestName(item),
        searchText: formatRequestSearchText(item),
        disabled: item.disabled || item.status !== "in_work",
        disabled_reason: item.disabled_reason,
        status: item.status,
      }))
    }
    catch (error: any) {
      const _error: Response<any> = error.data as Response<any> || {}
      if (_error.errors) {
        errors.value.record(_error.errors)
      }
      throw error
    }
    finally {
      finish()
    }
  }

  const bindListingsToRequest = async (requestId: number, listingIds: number[]): Promise<boolean> => {
    start()
    errors.value.clear()
    try {
      await apiBindListingsToRequest(requestId, listingIds)
      return true
    }
    catch (error: any) {
      const _error: Response<any> = error.data as Response<any> || {}
      if (_error.errors) {
        errors.value.record(_error.errors)
      }
      return false
    }
    finally {
      finish()
    }
  }

  const formatRequestName = (request: OpenRequestRaw): string => {
    const parts = [
      `${t("needs.request_label")} №${String(request.request_id).padStart(4, "0")}`,
      formatDate(request.created_at, "DD.MM.YYYY") ?? "—",
    ]

    if (Array.isArray(request.cars_info) && request.cars_info.length > 0) {
      parts.push(request.cars_info.join(", "))
    }

    if (request.client_name) {
      parts.push(request.client_name)
    }

    return parts.filter(Boolean).join(", ")
  }

  const formatRequestSearchText = (request: OpenRequestRaw): string => {
    const requestId = String(request.request_id)
    return [
      requestId,
      requestId.padStart(4, "0"),
      ...(Array.isArray(request.cars_info) ? request.cars_info : []),
      request.client_name || "",
    ].filter(Boolean).join(" ")
  }

  const rejectProposal = async (
    searchRequestId: number,
    params: RejectProposalRequest,
  ): Promise<boolean> => {
    start()
    errors.value.clear()
    try {
      await apiRejectProposal(searchRequestId, {
        listing_id: params.listing_id,
        rejection_reason: params.rejection_reason,
        draft_media_ids: params.draft_media_ids?.length ? params.draft_media_ids : undefined,
      })
      return true
    }
    catch (error: any) {
      const _error: Response<any> = error.data as Response<any> || {}
      if (_error.errors) {
        errors.value.record(_error.errors)
      }
      return false
    }
    finally {
      finish()
    }
  }

  const availableListings = ref<ListingPreview[]>([])
  const availableListingsMeta = ref<ApiMetaList | null>(null)
  const isLoadingListings = ref(false)

  const loadAvailableListings = async (
    requestId: number,
    params: { query?: string, offset?: number, limit?: number } = {},
  ) => {
    isLoadingListings.value = true
    try {
      const res = await getAvailableListings(requestId, params)
      availableListings.value = res.data || []
      availableListingsMeta.value = res.meta ?? null
    }
    catch (e) {
      console.error(e)
      availableListings.value = []
      availableListingsMeta.value = null
    }
    finally {
      isLoadingListings.value = false
    }
  }

  const sellers = ref<NamedEntity[]>([])

  const loadSellers = async () => {
    try {
      const resp = await apiGetSellers() as any
      sellers.value = resp?.data || []
    }
    catch (e) {
      console.error(e)
    }
  }

  const assignExecutorToRequest = async (requestId: number, executorId: number): Promise<boolean> => {
    try {
      await apiAssignExecutor(requestId, { executor_id: executorId })
      return true
    }
    catch (e) {
      console.error(e)
      return false
    }
  }

  const isRequesting = ref(false)

  const requestMoreListings = async (requestId: number): Promise<boolean> => {
    isRequesting.value = true
    try {
      await apiRequestMoreVariants(requestId)
      return true
    }
    catch (e) {
      console.error(e)
      return false
    }
    finally {
      isRequesting.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    errors,
    requestData,
    store,
    update,
    show,
    updateStatus,
    acknowledgeChanges,
    getOpenRequests,
    bindListingsToRequest,
    rejectProposal,
    duplicateRequest,
    brands,
    series,
    models,
    yearOptions,
    modelOptions,
    carImage,
    isModelSelected,
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
    hasUnacknowledgedChanges,
    availableListings,
    availableListingsMeta,
    isLoadingListings,
    loadAvailableListings,
    sellers,
    loadSellers,
    assignExecutorToRequest,
    isRequesting,
    requestMoreListings,
  }
}
