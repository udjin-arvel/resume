import type { ListQueryRequest } from "@/types/requests/request"
import type { LogisticOrderStatus } from "~/types/common/logisticOrder"

export interface OrderListRequest extends ListQueryRequest {
  carNumber?: string
  vin?: string
  status?: LogisticOrderStatus | LogisticOrderStatus[] | ""
  statusDateFrom?: string
  statusDateTo?: string
  brandId?: number
  modelId?: number
  clientId?: number
  archive?: 1
}

export interface ConfirmPayloadUI {
  wechat: string
  phone: string
  address: string
  additional_info?: string
  insurance_expiry_date: string | Date | { toString?: () => string, toISOString?: () => string, $d?: Date }
}

export interface ConfirmBookingRequest {
  wechat: string
  phone: string
  address: string
  additionalInfo: string
  insuranceExpiryDate: string
}

export interface SaveBuyerFormRequest {
  fullname: string
  passportNumber: string | null
  address: string
  additionalInfo: string
}

export interface SaveInvoiceRequest {
  invoiceNumber: string
  invoiceDate: string | null
  vin: string | null
  carPriceCny: number | null
  arrivalPortCode: string | null
  deliveryToPortCny: number | null
  diagnosticCount: number
  diagnosticPriceCny: number
  diagnosticTotalCny: number
  compensationCount: number
  compensationPriceCny: number
  compensationTotalCny: number
  invoiceSumCny: number
  payerType: "phys" | "juridical"
  broker: string | null
  payerFullname: string | null
  payerAddress: string | null
  payerPhone: string | null
  invoiceVerified: boolean
}
