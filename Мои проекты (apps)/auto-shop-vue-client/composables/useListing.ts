import { ref, computed, readonly } from "vue"
import Errors from "@/classes/errors"
import type { ListingUpdate, ShareListingRequest } from "@/types/requests/listing"
import { ListingStore } from "@/types/requests/listing"
import type { ListingFull, ShortListing, ShareListingResponse } from "@/types/responses/listing"
import type Response from "@/types/responses/response"
import { useApiListing } from "@/composables/api/useApiListing"
import useSearchRequest from "@/composables/useSearchRequest"
import useCar from "@/composables/useCar"
import type { OptionBase } from "@/types/form/optionType"
import type { RequestOption } from "@/types/responses/searchRequest"
import { useApiMedia } from "@/composables/api/useApiMedia"
import type { FileResponse, RawFilePayload } from "@/types/form/file"
import type { DescriptionPart } from "@/components/catalog/ListingDescription.vue"
import { toCamelCase } from "@/utils/caseTransform"
import { listingImageSrc } from "@/utils/catalogImages"
import { useBatchDraftUpload } from "@/composables/useBatchDraftUpload"

export default function useListing(_listing?: ListingUpdate) {
  const { buildDiagnosticReportUrl } = useDiagnosticReportUrl()
  const { isLoading, start, finish } = useLoadingIndicator()
  const {
    store: apiStore,
    update: apiUpdate,
    show: apiShow,
    showPublic: _showPublic,
    baseInfo: apiBaseInfo,
    share: apiShare,
    showShared: apiShowShared,
    bindRequests: apiBindRequests,
    republish: apiRepublish,
  } = useApiListing()

  const isSavingRequests = ref(false)

  const bindListingToRequests = async (listingId: number, requestIds: number[]): Promise<boolean> => {
    isSavingRequests.value = true
    try {
      await apiBindRequests(listingId, requestIds)
      return true
    }
    catch (e) {
      console.error(e)
      return false
    }
    finally {
      isSavingRequests.value = false
    }
  }

  const { uploadBatch, isBatchUploading } = useBatchDraftUpload()
  const { getMediaItem } = useApiMedia()

  const {
    getBrands,
    getSeries,
    getModels,
    getEngines,
    getCarDetails,
    getYearsBySeries,
    getModelsBySeriesAndYear,
  } = useCar()

  const listingData = ref<ListingStore | ListingUpdate>(new ListingStore())
  const errors = ref(new Errors())

  const brands = ref<OptionBase[]>([])
  const series = ref<OptionBase[]>([])
  const models = ref<OptionBase[]>([])
  const engines = ref<OptionBase[]>([])
  const managers = ref<OptionBase[]>([])
  const autoAssignEnabled = ref(true)

  const pendingDeletePhotoIds = ref<number[]>([])
  const pendingDeleteVideoIds = ref<number[]>([])
  const pendingDeleteNameplateIds = ref<number[]>([])
  const pendingDeleteDefectIds = ref<number[]>([])

  const photoUploadsInFlight = ref(0)
  const videoUploadsInFlight = ref(0)
  const nameplateUploadsInFlight = ref(0)
  const defectUploadsInFlight = ref(0)
  const isPhotoUploading = computed(() => photoUploadsInFlight.value > 0)
  const isVideoUploading = computed(() => videoUploadsInFlight.value > 0)
  const isNameplateUploading = computed(() => nameplateUploadsInFlight.value > 0)
  const isDefectUploading = computed(() => defectUploadsInFlight.value > 0)

  const photoUploadStatus = ref("")
  const videoUploadStatus = ref("")
  const nameplateUploadStatus = ref("")
  const defectUploadStatus = ref("")

  const isMediaUploading = isBatchUploading

  const { t } = useI18n()

  const isModelSelected = ref(false)

  const { getOpenRequests } = useSearchRequest()
  const requestOptions = ref<RequestOption[]>([])
  const requestOptionsLoaded = ref(false)

  if (_listing) {
    Object.assign(listingData.value, {
      ..._listing,
      accessOption: _listing.accessOption ?? "all",
      photoFiles: _listing.photoFiles ?? [],
      videoFiles: _listing.videoFiles ?? [],
      nameplateFiles: _listing.nameplateFiles ?? [],
      defectFiles: _listing.defectFiles ?? [],
      original_paint: _listing.original_paint ?? false,
      photo_ids: [],
      video_ids: [],
      nameplate_ids: [],
      defect_ids: [],
    })
  }
  else {
    Object.assign(listingData.value, {
      accessOption: "all",
      selectedInfoRequest: [],
      selectedOption: "used",
      shownOnSite: true,
      vin: "",
      brand: undefined,
      series: undefined,
      model: undefined,
      year: "",
      month: "",
      complectation: undefined,
      engineType: "",
      engine: "",
      power: undefined,
      transmission: "",
      drive: "",
      mileage: undefined,
      bodyType: "",
      bodyColor: "",
      price: undefined,
      chinaCity: undefined,
      internalNumber: "",
      manualInternalNumber: false,
      externalUrl: "",
      sellerContactName: "",
      sellerPhone: "",
      comment: "",
      condition: "",
      options: "",
      original_paint: false,
      diagnosticLink: "",
      photoFiles: [],
      videoFiles: [],
      nameplateFiles: [],
      defectFiles: [],
      photo_ids: [],
      video_ids: [],
      defect_ids: [],
      userId: 0,
      releaseYear: undefined,
    })
  }

  const toFileResponse = (payload: RawFilePayload): FileResponse => ({
    id: payload.id,
    uuid: String(payload.id),
    name: payload.file_name || payload.name || "",
    size: 0,
    url: payload.url ?? "",
    show_url: payload.url ?? "",
    mime_type: payload.mime_type ?? "",
    collection: "files",
  })

  const uploadMediaBatch = async (
    files: FileList | null | undefined,
    context: string,
    target: FileResponse[],
    ids: number[] | undefined,
    inFlight: Ref<number>,
    status: Ref<string>,
  ) => {
    if (!files?.length) {
      return
    }

    inFlight.value++
    status.value = ""

    try {
      const result = await uploadBatch(files, context)
      result.uploaded.forEach(({ file, draft }) => {
        ids?.push(draft.id)
        target.push(toFileResponse({ ...draft, mime_type: draft.mimeType || file.type }))
      })
      status.value = result.failed.length ? "" : t("files.upload_success")
    }
    catch (e) {
      console.error(`Error uploading ${context} batch`, e)
    }
    finally {
      inFlight.value--
    }
  }

  const uploadPhotos = (files: FileList | null | undefined) => uploadMediaBatch(
    files, "listing_photo", listingData.value.photoFiles, listingData.value.photo_ids, photoUploadsInFlight, photoUploadStatus,
  )

  const uploadVideos = (files: FileList | null | undefined) => uploadMediaBatch(
    files, "listing_video", listingData.value.videoFiles, listingData.value.video_ids, videoUploadsInFlight, videoUploadStatus,
  )

  const uploadNameplates = (files: FileList | null | undefined) => uploadMediaBatch(
    files, "listing_nameplate", listingData.value.nameplateFiles, listingData.value.nameplate_ids, nameplateUploadsInFlight, nameplateUploadStatus,
  )

  const uploadDefects = (files: FileList | null | undefined) => uploadMediaBatch(
    files, "listing_defect", listingData.value.defectFiles, listingData.value.defect_ids, defectUploadsInFlight, defectUploadStatus,
  )

  const removePhoto = (file: FileResponse) => {
    if (listingData.value.photo_ids?.includes(file.id)) {
      listingData.value.photo_ids = listingData.value.photo_ids.filter(
        id => id !== file.id,
      )
      listingData.value.photoFiles = listingData.value.photoFiles.filter(
        f => f.id !== file.id,
      )
    }
    else {
      if (!pendingDeletePhotoIds.value.includes(file.id)) {
        pendingDeletePhotoIds.value.push(file.id)
      }
      listingData.value.photoFiles = listingData.value.photoFiles.filter(
        f => f.id !== file.id,
      )
    }
  }

  const removeVideo = (file: FileResponse) => {
    if (listingData.value.video_ids?.includes(file.id)) {
      listingData.value.video_ids = listingData.value.video_ids.filter(
        id => id !== file.id,
      )
      listingData.value.videoFiles = listingData.value.videoFiles.filter(
        f => f.id !== file.id,
      )
    }
    else {
      if (!pendingDeleteVideoIds.value.includes(file.id)) {
        pendingDeleteVideoIds.value.push(file.id)
      }
      listingData.value.videoFiles = listingData.value.videoFiles.filter(
        f => f.id !== file.id,
      )
    }
  }

  const removeNameplate = (file: FileResponse) => {
    if (listingData.value.nameplate_ids?.includes(file.id)) {
      listingData.value.nameplate_ids = listingData.value.nameplate_ids.filter(
        id => id !== file.id,
      )
      listingData.value.nameplateFiles
        = listingData.value.nameplateFiles.filter(f => f.id !== file.id)
    }
    else {
      if (!pendingDeleteNameplateIds.value.includes(file.id)) {
        pendingDeleteNameplateIds.value.push(file.id)
      }
      listingData.value.nameplateFiles
        = listingData.value.nameplateFiles.filter(f => f.id !== file.id)
    }
  }

  const removeDefect = (file: FileResponse) => {
    if (listingData.value.defect_ids?.includes(file.id)) {
      listingData.value.defect_ids = listingData.value.defect_ids.filter(
        id => id !== file.id,
      )
      listingData.value.defectFiles
        = listingData.value.defectFiles.filter(f => f.id !== file.id)
    }
    else {
      if (!pendingDeleteDefectIds.value.includes(file.id)) {
        pendingDeleteDefectIds.value.push(file.id)
      }
      listingData.value.defectFiles
        = listingData.value.defectFiles.filter(f => f.id !== file.id)
    }
  }

  const transformToBackendFormat = (data: ListingStore): any => {
    let yearToSend: number | null = null
    let monthToSend: number | null = null

    if (data.year !== undefined && data.year !== null) {
      if (
        typeof data.year === "object"
        && data.year !== null
        && "value" in data.year
      ) {
        const yearValue = (data.year as OptionBase).value
        if (yearValue !== undefined && yearValue !== null && yearValue !== "") {
          const yearNum
            = typeof yearValue === "number"
              ? yearValue
              : parseInt(String(yearValue), 10)
          if (!isNaN(yearNum)) {
            yearToSend = yearNum
          }
        }
      }
      else if (
        typeof data.year === "string"
        || typeof data.year === "number"
      ) {
        const yearNum = parseInt(String(data.year), 10)
        if (!isNaN(yearNum)) {
          yearToSend = yearNum
        }
      }
    }

    if (data.month) {
      const monthNum = parseInt(String(data.month), 10)
      if (!isNaN(monthNum)) {
        monthToSend = monthNum
      }
    }

    const modelId = data.model?.value as number | undefined
    const backendData: any = {
      car_id: modelId,
      brand_id: data.brand?.value as number,
      series_id: data.series?.value as number,
      model_id: modelId,
      vin: data.vin,
      internal_number: data.manualInternalNumber ? data.internalNumber : null,
      external_url: data.externalUrl || null,
      seller_contact_name: data.sellerContactName || null,
      seller_phone: data.sellerPhone || null,
      comment: data.comment || null,
      city: data.city?.value,
      year: yearToSend,
      month: monthToSend,
      mileage: data.mileage,
      price: data.price,
      condition: data.selectedOption,
      description: data.condition,
      options: data.options,
      body_color:
        typeof data.bodyColor === "object"
          ? (data.bodyColor as any)?.value
          : data.bodyColor,
      original_paint: data.original_paint,
      visibility: data.accessOption,
      diagnostic_created_at: data.diagnostic_created_at,
      diagnostic_changed_at: data.diagnostic_changed_at,
      is_active: data.isActive,
      diagnostic_url: data.diagnosticLink,
      diagnostic_comment: data.diagnosticComment || null,
      diagnostic_format: data.diagnostic_format ?? "own",
      number_of_keys: data.numberOfKeys ?? null,
      access_option: data.accessOption,
      shown_on_site: data.shownOnSite,
      engine_type:
        typeof data.engineType === "object"
          ? (data.engineType as any)?.value
          : data.engineType,
      engine:
        typeof data.engine === "object"
          ? (data.engine as any)?.value
          : data.engine,
      power: data.power,
      transmission:
        typeof data.transmission === "object"
          ? (data.transmission as any)?.value
          : data.transmission,
      drive:
        typeof data.drive === "object"
          ? (data.drive as any)?.value
          : data.drive,
      body_type:
        typeof data.bodyType === "object"
          ? (data.bodyType as any)?.value
          : data.bodyType,
      release_year: data.releaseYear ?? null,
      search_request_ids: data.selectedInfoRequest?.map(r => r.value) || [],
      photo_ids: (data.photoFiles || []).map(f => f.id),
      video_ids: data.video_ids || [],
      nameplate_ids: (data.nameplateFiles || []).map(f => f.id),
      defect_ids: (data.defectFiles || []).map(f => f.id),
      deleted_photo_ids: pendingDeletePhotoIds.value,
      deleted_video_ids: pendingDeleteVideoIds.value,
      deleted_nameplate_ids: pendingDeleteNameplateIds.value,
      deleted_defect_ids: pendingDeleteDefectIds.value,
      user_id: data.userId,
      car_link_id: data.carLinkId ?? null,
    }

    return backendData
  }

  const store = async (
    data: ListingStore,
  ): Promise<ListingFull | undefined> => {
    start()
    errors.value.clear()
    try {
      const backendData = transformToBackendFormat(data)
      const response = await apiStore(backendData)
      return response?.data
    }
    catch (error: any) {
      if (error.status === 422 && error.data?.errors) {
        const validationErrors: Record<string, string[]> = error.data.errors
        const recorded: Record<string, string> = {}
        Object.entries(validationErrors).forEach(([field, messages]) => {
          recorded[field] = (Array.isArray(messages) ? messages : (messages ? [String(messages)] : [])).join(", ")
        })
        errors.value.record(toCamelCase(recorded))
      }
      else {
        const _error = (error?.data as Response<any>) ?? {}
        errors.value.record(toCamelCase(_error.errors || {}))
      }
      return undefined
    }
    finally {
      finish()
    }
  }

  const update = async (
    id: number,
    data: ListingUpdate,
  ): Promise<ListingFull | undefined> => {
    start()
    errors.value.clear()
    try {
      const backendData = transformToBackendFormat(data as ListingStore)
      const response = await apiUpdate(id, backendData)
      return response?.data
    }
    catch (error: any) {
      const _error: Response<any> = (error.data as Response<any>) || {}
      if (_error.errors) {
        errors.value.record(toCamelCase(_error.errors))
      }
      return undefined
    }
    finally {
      finish()
    }
  }

  const republish = async (
    id: number,
    data: ListingUpdate,
  ): Promise<ListingFull | undefined> => {
    start()
    errors.value.clear()
    try {
      const backendData = transformToBackendFormat(data as ListingStore)
      const response = await apiRepublish(id, backendData)
      return response?.data
    }
    catch (error: any) {
      const _error: Response<any> = (error.data as Response<any>) || {}
      if (_error.errors) {
        errors.value.record(toCamelCase(_error.errors))
      }
      return undefined
    }
    finally {
      finish()
    }
  }

  const showPublic = async (id: number): Promise<ListingFull | undefined> => {
    start()
    errors.value.clear()
    try {
      const response = await _showPublic(id)
      const data = response.data as ListingFull
      if (!data || !data.car) {
        throw new Error("Listing data or car is undefined")
      }

      return {
        ...data,
        car: {
          ...data.car,
          gearbox: data.car.gearbox ?? null,
          engine: data.car.engine ?? null,
          horse_power: data.car.horse_power ?? null,
          number_of_fast_charging_ports:
            data.car.number_of_fast_charging_ports ?? null,
        },
      }
    }
    catch (error: any) {
      const _error: Response<any> = error.data || {}
      if (_error.errors) {
        errors.value.record(_error.errors)
      }
      return undefined
    }
    finally {
      finish()
    }
  }

  const show = async (id: number): Promise<ListingFull | undefined> => {
    start()
    errors.value.clear()
    try {
      const response = await apiShow(id)
      const meta = response.meta as any
      if (meta?.managers) {
        managers.value = meta.managers.map((m: any) => ({
          id: m.id,
          name: m.name,
          value: m.id,
          disabled: false,
        }))
      }
      if (meta?.auto_assign_enabled !== undefined) {
        autoAssignEnabled.value = meta.auto_assign_enabled
      }

      const data = response.data as ListingFull
      if (!data || !data.car) {
        throw new Error("Listing data or car is undefined")
      }

      return {
        ...data,
        car: {
          ...data.car,
          gearbox: data.car.gearbox ?? null,
          engine: data.car.engine ?? null,
          horse_power: data.car.horse_power ?? null,
          number_of_fast_charging_ports:
            data.car.number_of_fast_charging_ports ?? null,
        },
      }
    }
    catch (error: any) {
      const _error: Response<any> = error.data || {}
      if (_error.errors) {
        errors.value.record(_error.errors)
      }
      return undefined
    }
    finally {
      finish()
    }
  }

  const loadOpenRequests = async (): Promise<boolean> => {
    requestOptionsLoaded.value = false
    try {
      requestOptions.value = await getOpenRequests()
      requestOptionsLoaded.value = true
      return true
    }
    catch (error) {
      console.error("Error loading open requests:", error)
      requestOptions.value = []
      return false
    }
  }

  const loadBaseInfo = async () => {
    try {
      const response = await apiBaseInfo()

      if (response?.data) {
        if (response.data.managers) {
          managers.value = response.data.managers.map((m: any) => ({
            id: m.id,
            name: m.name,
            value: m.id,
            disabled: false,
          }))
        }
        if ((response.data as any).auto_assign_enabled !== undefined) {
          autoAssignEnabled.value = (response.data as any).auto_assign_enabled
        }
      }
      return response
    }
    catch (e) {
      console.error("Error loading base info", e)
      return undefined
    }
  }

  const shareListing = async (
    id: number,
    payload: ShareListingRequest,
  ): Promise<ShareListingResponse | undefined> => {
    try {
      const response = await apiShare(id, payload)
      return response
    }
    catch (error: any) {
      console.error("Error sharing listing:", error)
      return undefined
    }
  }

  const buildShort = (
    listing: ListingFull,
    t: (key: string) => string,
  ): ShortListing => {
    const translateIfExists = (key: string, value?: string | null): string => {
      if (!value) {
        return ""
      }
      const translationKey = `${key}.${value}`
      const translated = t(translationKey)
      return translated !== translationKey ? translated : value ?? ""
    }

    const parts: DescriptionPart[] = []

    if (listing.car?.displacement) {
      parts.push({ text: listing.car.displacement })
    }

    if (listing.car?.short_power_type || listing.car?.power_type) {
      const engineType = (listing.car.short_power_type || listing.car.power_type) as string
      parts.push({
        text: translateIfExists("cars.power_type", engineType),
        type: "powerType",
        value: engineType,
      })
    }

    if (listing.car?.horse_power) {
      parts.push({ text: `${listing.car.horse_power} л.с.` })
    }

    if (listing.car?.gearbox) {
      parts.push({ text: translateIfExists("cars.gearbox", listing.car.gearbox) })
    }

    if (listing.mileage) {
      parts.push({ text: `${listing.mileage} км` })
    }

    const descriptionParts = parts.map(part => ({
      ...part,
      text: part.text.toLowerCase(),
    }))

    const descr = parts.map(p => p.text).join(", ").toLowerCase()

    // Единственное место, где решается, какая из двух диагностик показывается:
    // собственный отчёт имеет приоритет над внешней ссылкой.
    const isOwnReport = !!(listing.diagnostic_report_visible && listing.diagnostic_report_code)

    return {
      id: listing.id,
      title: listing.name ?? "",
      description: descr,
      descriptionParts: descriptionParts,
      user_id: listing.user_id,
      price: listing.price,
      params: [],
      images: listing.photos?.map(p => listingImageSrc(p, "medium")) ?? [],
      imageThumbs: listing.photos?.map(p => listingImageSrc(p, "thumb")) ?? [],
      imageOriginals: listing.photos?.map(p => p.url) ?? [],
      videos: listing.videos?.map(v => v.url) ?? [],
      videoPosters: listing.videos?.map(v => v.poster ?? null) ?? [],
      nameplates: listing.nameplates?.map(n => listingImageSrc(n, "medium")) ?? [],
      nameplateThumbs: listing.nameplates?.map(n => listingImageSrc(n, "thumb")) ?? [],
      nameplateOriginals: listing.nameplates?.map(n => n.url) ?? [],
      defects: listing.defects?.map(d => listingImageSrc(d, "medium")) ?? [],
      defectThumbs: listing.defects?.map(d => listingImageSrc(d, "thumb")) ?? [],
      defectOriginals: listing.defects?.map(d => d.url) ?? [],
      defectDescriptions: listing.defects?.map(d => d.descriptions ?? {}) ?? [],
      diagnostics: isOwnReport
        ? buildDiagnosticReportUrl(listing.diagnostic_report_code)
        : listing.diagnostic_url ?? "",
      diagnostic_is_own: isOwnReport,
      diagnostic_format: listing.diagnostic_format,
      diagnostic_comment: listing.diagnostic_comment,
      diagnostic_report_code: listing.diagnostic_report_code,
      diagnostic_report_inspected_at: listing.diagnostic_report_inspected_at ?? null,
      compensation_report_code: listing.compensation_report_code ?? null,
      compensation_report_inspected_at: listing.compensation_report_inspected_at ?? null,
      compensation_report: listing.compensation_report ?? null,
      diagnostic_shown: listing.diagnostic_shown,
      diagnostic_created_at: listing.diagnostic_created_at ?? "",
      diagnostic_changed_at: listing.diagnostic_changed_at ?? "",
      diagnostic_requested: listing.diagnostic_requested ?? false,
      diagnostic_subscribed: listing.diagnostic_subscribed ?? false,
      video_requested: listing.video_requested ?? false,
      booking_requested: listing.booking_requested ?? false,
      sale_status: listing.sale_status ?? null,
      total_video_requests: listing.total_video_requests ?? 0,
      total_diagnostic_requests: listing.total_diagnostic_requests ?? 0,
      location_name: listing.city ?? "",
      published_at: listing.created_at ?? "",
      calculations: listing.calculations ?? null,
      price_locked: listing.price_locked || false,
      photos_locked: listing.photos_locked || false,
      videos_locked: listing.videos_locked || false,
      diagnostics_locked: listing.diagnostics_locked || false,
      compensation_locked: listing.compensation_locked || false,
      vin_locked: listing.vin_locked || false,
      condition_locked: listing.condition_locked || false,
      condition_comment_locked: listing.condition_comment_locked || false,
      month_locked: listing.month_locked || false,
      chassis_number_locked: listing.chassis_number_locked || false,
      nameplates_locked: listing.nameplates_locked || false,
      photos_total: listing.photos_total ?? (listing.photos?.length ?? 0),
      photos_hidden_count: listing.photos_hidden_count ?? 0,
      imageBlurs: listing.photos_blurred ?? [],
      has_video: listing.has_video || (listing.videos && listing.videos.length > 0),
      has_diagnostics: listing.has_diagnostics || !!listing.diagnostic_url,
      has_compensation: listing.has_compensation,
      compensation_requested: listing.compensation_requested ?? false,
      compensation_subscribed: listing.compensation_subscribed ?? false,
      condition: listing.condition ?? null,
      description_ru: listing.description_ru ?? null,
      description_zh: listing.description_zh ?? null,
      original_locale: listing.original_locale ?? null,
      original_paint: listing.original_paint,
      number_of_keys: listing.number_of_keys,
      is_archive: listing.is_archive,
      can_view_archive_details: listing.can_view_archive_details ?? false,
    }
  }

  const getSharedListing = async (
    code: string,
  ): Promise<ListingFull | null> => {
    try {
      const response = await apiShowShared(code)
      if (response.data) {
        return response.data as ListingFull
      }
      return null
    }
    catch (e) {
      const status = (e as { response?: { status?: number } })?.response?.status

      if (status === 410) {
        throw createError({ statusCode: 410, fatal: true })
      }

      console.error("Error fetching shared listing", e)
      return null
    }
  }

  const fetchMediaPreviews = async (
    ids: number[],
    type: "photo" | "video" | "nameplate" | "defect",
  ): Promise<void> => {
    if (!ids.length) {
      return
    }

    try {
      const mediaPromises = ids.map(id =>
        getMediaItem(id)
          .then(res => res.data)
          .catch((err: any) => {
            console.error(`Failed to load media ${id}:`, err)
            return null
          }),
      )

      const mediaResults = await Promise.allSettled(mediaPromises)

      mediaResults.forEach((result) => {
        if (result.status !== "fulfilled" || !result.value) {
          return
        }

        const media = result.value

        const fileResponse: FileResponse = {
          id: media.id,
          uuid: String(media.id),
          name: media.name,
          size: media.size || 0,
          url: media.url || "",
          show_url: media.url || "",
          mime_type: media.mime_type || "",
          collection: "files",
          ...((type === "photo" || type === "nameplate" || type === "defect") && media.thumb ? { thumb: media.thumb } : {}),
        }

        if (type === "photo") {
          listingData.value.photoFiles.push(fileResponse)
        }
        else if (type === "video") {
          listingData.value.videoFiles.push(fileResponse)
        }
        else if (type === "nameplate") {
          listingData.value.nameplateFiles.push(fileResponse)
        }
        else if (type === "defect") {
          listingData.value.defectFiles.push(fileResponse)
        }
      })
    }
    catch (e: any) {
      console.error(`Error fetching ${type} previews:`, e)
    }
  }

  return {
    isLoading: readonly(isLoading),
    isPhotoUploading: readonly(isPhotoUploading),
    isVideoUploading: readonly(isVideoUploading),
    isNameplateUploading: readonly(isNameplateUploading),
    isDefectUploading: readonly(isDefectUploading),
    photoUploadStatus: readonly(photoUploadStatus),
    videoUploadStatus: readonly(videoUploadStatus),
    nameplateUploadStatus: readonly(nameplateUploadStatus),
    defectUploadStatus: readonly(defectUploadStatus),
    isMediaUploading: readonly(isMediaUploading),
    errors,
    listingData,
    store,
    update,
    republish,
    show,
    showPublic,
    brands,
    series,
    models,
    engines,
    managers,
    autoAssignEnabled,
    pendingDeletePhotoIds,
    pendingDeleteVideoIds,
    isModelSelected,
    getBrands,
    getSeries,
    getModels,
    getEngines,
    getCarDetails,
    getYearsBySeries,
    getModelsBySeriesAndYear,
    requestOptions,
    loadOpenRequests,
    requestOptionsLoaded: readonly(requestOptionsLoaded),
    uploadPhotos,
    uploadVideos,
    pendingDeleteNameplateIds,
    uploadNameplates,
    removeNameplate,
    pendingDeleteDefectIds,
    uploadDefects,
    removeDefect,
    removePhoto,
    removeVideo,
    loadBaseInfo,
    shareListing,
    getSharedListing,
    buildShort,
    fetchMediaPreviews,
    isSavingRequests,
    bindListingToRequests,
  }
}
