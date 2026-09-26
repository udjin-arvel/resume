import type { ApiResponse } from "@/types/responses/response"
import type { SellerProfile, LogisticOrder } from "@/types/common/logisticOrder"
import type { InvoiceType, InvoicePdfDownload, InvoiceExcelDownload } from "@/types/responses/invoice"
import type { BuyerFormResponse, PaymentDocsResponse } from "@/types/responses/logisticOrder"
import type { ConfirmBookingRequest, SaveBuyerFormRequest, SaveInvoiceRequest } from "@/types/requests/logisticOrder"
import { useApiParamTransform } from "@/composables/api/useApiParamTransform"

export const useApiLogistic = () => {
  const { call } = useApiParamTransform()
  const baseUrl = "api/v1"

  const confirmBookingWithData = (listingId: number, requestId: number, payload: ConfirmBookingRequest) =>
    call<ApiResponse<LogisticOrder>>(
      `${baseUrl}/listings/${listingId}/requests/${requestId}/logistic/confirm`,
      { method: "POST", body: payload },
      { snakeParams: true, camelize: true },
    )

  const getSellerProfile = (listingId: number) =>
    call<ApiResponse<SellerProfile | null>>(
      `${baseUrl}/listings/${listingId}/logistic/seller-profile`,
      { method: "GET" },
    )

  const getBuyerForm = (logisticOrderId: number) =>
    call<ApiResponse<BuyerFormResponse | null>>(
      `${baseUrl}/logistic/${logisticOrderId}/buyer-form`,
      { method: "GET" },
      { camelize: true },
    )

  const saveBuyerForm = (logisticOrderId: number, payload: SaveBuyerFormRequest) =>
    call<ApiResponse<LogisticOrder>>(
      `${baseUrl}/logistic/${logisticOrderId}/buyer-form`,
      { method: "POST", body: payload },
      { snakeParams: true, camelize: true },
    )

  const getInvoice = (logisticOrderId: number, onlyExisting: boolean = false) =>
    call<ApiResponse<InvoiceType | null>>(
      `${baseUrl}/logistic/${logisticOrderId}/invoice`,
      { method: "GET", query: { existing: onlyExisting } },
      { camelize: true },
    )

  const saveInvoice = (logisticOrderId: number, payload: SaveInvoiceRequest) =>
    call<ApiResponse<InvoiceType>>(
      `${baseUrl}/logistic/${logisticOrderId}/invoice`,
      { method: "POST", body: payload },
      { snakeParams: true, camelize: true },
    )

  const getPaymentDocs = (logisticOrderId: number) =>
    call<ApiResponse<PaymentDocsResponse>>(
      `${baseUrl}/logistic/${logisticOrderId}/payment-docs`,
      { method: "GET" },
      { camelize: true },
    )

  const savePaymentDocs = (logisticOrderId: number, payload: { files: number[] }) =>
    call<ApiResponse<PaymentDocsResponse>>(
      `${baseUrl}/logistic/${logisticOrderId}/payment-docs`,
      { method: "POST", body: payload },
      { snakeParams: true, camelize: true },
    )

  const downloadInvoicePdf = (logisticOrderId: number) =>
    call<ApiResponse<InvoicePdfDownload>>(
      `${baseUrl}/logistic/${logisticOrderId}/invoice/download-pdf`,
      { method: "GET" },
      { camelize: true },
    )

  const downloadInvoiceExcel = (logisticOrderId: number) =>
    call<ApiResponse<InvoiceExcelDownload>>(
      `${baseUrl}/logistic/${logisticOrderId}/invoice/download-excel`,
      { method: "GET" },
      { camelize: true },
    )

  const calculateDelivery = (logisticOrderId: number, portCode: string) =>
    call<ApiResponse<{ deliveryToPortCny: number }>>(
      `${baseUrl}/logistic/${logisticOrderId}/invoice/calculate-delivery`,
      { method: "POST", body: { arrival_port_code: portCode } },
      { camelize: true },
    )

  const assignLogist = (logisticOrderId: number, logistId: number | null) =>
    call<ApiResponse<LogisticOrder>>(
      `${baseUrl}/logistic/${logisticOrderId}/assign-logist`,
      { method: "PATCH", body: { logist_id: logistId } },
      { snakeParams: true, camelize: true },
    )

  return {
    confirmBookingWithData,
    getSellerProfile,
    getBuyerForm,
    saveBuyerForm,
    getInvoice,
    saveInvoice,
    getPaymentDocs,
    savePaymentDocs,
    downloadInvoicePdf,
    downloadInvoiceExcel,
    calculateDelivery,
    assignLogist,
  }
}
