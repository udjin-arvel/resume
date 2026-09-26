import { ref, readonly } from "vue"
import { useApiLogistic } from "~/composables/api/useApiLogistic"
import { useApiListing } from "~/composables/api/useApiListing"
import Errors from "@/classes/errors"
import type Response from "@/types/responses/response"
import type { SaveBuyerFormRequest, ConfirmPayloadUI } from "@/types/requests/logisticOrder"
import type { InvoiceType } from "@/types/responses/invoice"
import type { FileResponse, RawFilePayload } from "@/types/form/file"
import { useBatchDraftUpload } from "@/composables/useBatchDraftUpload"

function pad2(n: number) {
  return String(n).padStart(2, "0")
}

function normalizeUIDateToDMY(value: unknown): string {
  if (typeof value === "string") {
    return value.trim()
  }
  if (value instanceof Date && !isNaN(value.getTime())) {
    const dd = pad2(value.getDate())
    const mm = pad2(value.getMonth() + 1)
    const yyyy = String(value.getFullYear())
    return `${dd}.${mm}.${yyyy}`
  }
  if (value && typeof value === "object") {
    const iso = (value as any).toISOString?.() ?? (value as any).$d?.toISOString?.()
    if (typeof iso === "string") {
      const d = new Date(iso)
      if (!isNaN(d.getTime())) {
        const dd = pad2(d.getDate())
        const mm = pad2(d.getMonth() + 1)
        const yyyy = String(d.getFullYear())
        return `${dd}.${mm}.${yyyy}`
      }
    }
    const s = (value as any).toString?.()
    if (typeof s === "string") {
      return s.trim()
    }
  }
  return ""
}

function toBackendYmd(value: string): string {
  const v = value.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return v
  }
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(v)) {
    const [dd, mm, yyyy] = v.split(".")
    return `${yyyy}-${mm}-${dd}`
  }
  throw new Error("validation.insurance_expiry_date_format")
}

function validateSellerProfileUI(p: ConfirmPayloadUI): string {
  const wechat = p.wechat?.toString().trim()
  const phone = p.phone?.toString().trim()
  const address = p.address?.toString().trim()
  const dmy = normalizeUIDateToDMY(p.insurance_expiry_date)

  if (!wechat) {
    throw new Error("validation.wechat_required")
  }
  if (!phone) {
    throw new Error("validation.phone_required")
  }
  if (!address) {
    throw new Error("validation.address_required")
  }
  if (!dmy) {
    throw new Error("validation.insurance_expiry_date_required")
  }

  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(dmy) && !/^\d{4}-\d{2}-\d{2}$/.test(dmy)) {
    throw new Error("validation.insurance_expiry_date_format")
  }

  return toBackendYmd(dmy)
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

function camelizeErrors(errors: Record<string, string[]>): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  for (const [key, messages] of Object.entries(errors)) {
    result[toCamelCase(key)] = messages
  }
  return result
}

function toFileResponse(payload: RawFilePayload): FileResponse {
  return {
    id: payload.id,
    uuid: String(payload.id),
    name: payload.file_name || payload.name || "",
    size: 0,
    url: payload.url ?? "",
    show_url: payload.url ?? "",
    mime_type: payload.mime_type ?? "",
    collection: "files",
  }
}

export function useLogistic() {
  const { isLoading, start, finish } = useLoadingIndicator()
  const {
    confirmBookingWithData,
    saveInvoice: _saveInvoice,
    assignLogist: _assignLogist,
    getBuyerForm,
    saveBuyerForm,
    getSellerProfile,
    getPaymentDocs,
    savePaymentDocs: _savePaymentDocs,
    getInvoice,
    calculateDelivery,
    downloadInvoicePdf: _downloadInvoicePdf,
    downloadInvoiceExcel: _downloadInvoiceExcel,
  } = useApiLogistic()
  const { show: showListing } = useApiListing()
  const { uploadBatch } = useBatchDraftUpload()

  const errors = ref(new Errors())

  const departureCityCode = ref("")
  const sellerProfile = ref({
    wechat: "",
    phone: "",
    address: "",
    additionalInfo: "",
    insuranceExpiryDate: "",
  })

  const loadListingCityCode = async (listingId: number) => {
    try {
      const resp = await showListing(listingId)
      departureCityCode.value = resp.data?.city || ""
    }
    catch {
      departureCityCode.value = ""
    }
  }

  const loadSellerProfile = async (listingId: number) => {
    try {
      const resp = await getSellerProfile(listingId)
      if (resp.data) {
        sellerProfile.value = {
          wechat: resp.data.wechat ?? "",
          phone: resp.data.phone ?? "",
          address: resp.data.address ?? "",
          additionalInfo: resp.data.additionalInfo ?? "",
          insuranceExpiryDate: resp.data.insuranceExpiryDate ?? "",
        }
      }
    }
    catch { /* silent */ }
  }

  const buyerProfile = ref({
    fullname: "",
    passportNumber: "",
    address: "",
    additionalInfo: "",
  })

  const loadBuyerForm = async (orderId: number) => {
    start()
    try {
      const resp = await getBuyerForm(orderId)
      const p = resp.data?.buyerProfile
      if (p) {
        buyerProfile.value = {
          fullname: p.fullname ?? "",
          passportNumber: p.passportNumber
            ? p.passportNumber.replace(/^(\d{4})(\d{6})$/, "$1 $2")
            : "",
          address: p.address ?? "",
          additionalInfo: p.additionalInfo ?? "",
        }
      }
    }
    catch (e) {
      console.error("Error loading buyer form:", e)
    }
    finally {
      finish()
    }
  }

  const submitBuyerForm = async (orderId: number, payload: SaveBuyerFormRequest): Promise<boolean> => {
    start()
    errors.value.clear()
    try {
      await saveBuyerForm(orderId, payload)
      return true
    }
    catch (error: any) {
      const _error: Response<any> = error.data as Response<any> || {}
      if (_error.errors) {
        errors.value.record(camelizeErrors(_error.errors))
      }
      return false
    }
    finally {
      finish()
    }
  }

  const paymentDocs = ref<FileResponse[]>([])
  const paymentFileIds = ref<number[]>([])
  const isUploadingPayment = ref(false)
  const isSavingPayment = ref(false)

  const loadPaymentDocs = async (orderId: number) => {
    start()
    try {
      const resp = await getPaymentDocs(orderId)
      if (resp.data?.paymentDocs && Array.isArray(resp.data.paymentDocs)) {
        paymentFileIds.value = resp.data.paymentDocs.map((f: any) => f.id)
        paymentDocs.value = resp.data.paymentDocs.map((f: any) => toFileResponse({
          id: f.id,
          name: f.name || `file-${f.id}`,
          mime_type: f.mimeType,
          url: f.url,
        }))
      }
    }
    catch (e) {
      console.error("Failed to load payment docs:", e)
    }
    finally {
      finish()
    }
  }

  const uploadPaymentFiles = async (files: FileList | File[]) => {
    isUploadingPayment.value = true
    try {
      const result = await uploadBatch(files, "logistic_payment")
      result.uploaded.forEach(({ file, draft }) => {
        paymentFileIds.value.push(draft.id)
        paymentDocs.value.push(toFileResponse({ ...draft, mime_type: draft.mimeType || file.type }))
      })
      return result
    }
    finally {
      isUploadingPayment.value = false
    }
  }

  const removePaymentFile = (id: number) => {
    paymentFileIds.value = paymentFileIds.value.filter(x => x !== id)
    paymentDocs.value = paymentDocs.value.filter(x => x.id !== id)
  }

  const submitPaymentDocs = async (orderId: number) => {
    isSavingPayment.value = true
    try {
      await _savePaymentDocs(orderId, { files: paymentFileIds.value })
    }
    finally {
      isSavingPayment.value = false
    }
  }

  const invoiceData = ref<Record<string, any>>({})
  const invoiceGenerated = ref(false)
  const nameplates = ref<any[]>([])

  const loadInvoice = async (orderId: number) => {
    const resp = await getInvoice(orderId)
    if (resp.data) {
      invoiceData.value = resp.data
      invoiceGenerated.value = !!(resp.data.pdfStatus || resp.data.file?.url)
      nameplates.value = resp.data.nameplates || []
    }
  }

  const calculateDeliveryForPort = async (orderId: number, portCode: string): Promise<string> => {
    try {
      const resp = await calculateDelivery(orderId, portCode)
      return resp?.data?.deliveryToPortCny !== undefined
        ? String(resp.data.deliveryToPortCny)
        : "0"
    }
    catch {
      return "0"
    }
  }

  const invoice = ref<InvoiceType | null>(null)

  const loadInvoiceView = async (orderId: number) => {
    const resp = await getInvoice(orderId, true)
    if (resp.data) {
      invoice.value = resp.data as InvoiceType
    }
  }

  const triggerDownload = (url: string) => {
    const link = document.createElement("a")
    link.href = url
    link.rel = "noopener"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadPdf = async (orderId: number) => {
    try {
      const resp = await _downloadInvoicePdf(orderId)
      const url = resp.data?.url
      if (!url) {
        throw new Error("Invoice PDF download URL is missing")
      }

      triggerDownload(url)
    }
    catch (e) {
      console.error("Failed to download PDF:", e)
      throw e
    }
  }

  const downloadExcel = async (orderId: number) => {
    try {
      const resp = await _downloadInvoiceExcel(orderId)
      const url = resp.data?.url
      if (!url) {
        throw new Error("Invoice Excel download URL is missing")
      }

      triggerDownload(url)
    }
    catch (e) {
      console.error("Failed to download Excel:", e)
      throw e
    }
  }

  const confirmBookingAndSaveSellerData = async (
    listingId: number,
    requestId: number,
    ui: ConfirmPayloadUI,
  ) => {
    start()
    errors.value.clear()
    try {
      const ymd = validateSellerProfileUI(ui)
      const payload = {
        wechat: ui.wechat?.toString().trim(),
        phone: ui.phone?.toString().trim(),
        address: ui.address?.toString().trim(),
        additionalInfo: ui.additional_info?.toString().trim() || "",
        insuranceExpiryDate: ymd,
      }
      return await confirmBookingWithData(listingId, requestId, payload)
    }
    catch (error: any) {
      const _error: Response<any> = error.data as Response<any> || {}
      if (_error.errors) {
        errors.value.record(camelizeErrors(_error.errors))
      }
      throw error
    }
    finally {
      finish()
    }
  }

  const saveInvoice = async (orderId: number, payload: any) => {
    start()
    errors.value.clear()
    try {
      return await _saveInvoice(orderId, payload)
    }
    catch (error: any) {
      const _error: Response<any> = error.data as Response<any> || {}
      if (_error.errors) {
        errors.value.record(camelizeErrors(_error.errors))
      }
      throw error
    }
    finally {
      finish()
    }
  }

  const assignLogist = async (orderId: number, logistId: number | null) => {
    start()
    errors.value.clear()
    try {
      return await _assignLogist(orderId, logistId)
    }
    catch (error: any) {
      const _error: Response<any> = error.data as Response<any> || {}
      if (_error.errors) {
        errors.value.record(camelizeErrors(_error.errors))
      }
      throw error
    }
    finally {
      finish()
    }
  }

  return {
    isLoading: readonly(isLoading),
    errors,
    confirmBookingAndSaveSellerData,
    departureCityCode,
    sellerProfile,
    loadListingCityCode,
    loadSellerProfile,
    buyerProfile,
    loadBuyerForm,
    submitBuyerForm,
    paymentDocs,
    paymentFileIds,
    isUploadingPayment,
    isSavingPayment,
    loadPaymentDocs,
    uploadPaymentFiles,
    removePaymentFile,
    submitPaymentDocs,
    invoiceData,
    invoiceGenerated,
    nameplates,
    loadInvoice,
    calculateDeliveryForPort,
    saveInvoice,
    invoice,
    loadInvoiceView,
    downloadPdf,
    downloadExcel,
    assignLogist,
  }
}
