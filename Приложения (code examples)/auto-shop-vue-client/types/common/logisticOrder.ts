import type { LogisticOrderStatuses } from "~/constants/orderStatuses"
import type { SimpleFile } from "~/types/common/file"
import type { InvoiceExcelStatus, InvoicePdfStatus } from "~/types/responses/invoice"

export type LogisticOrderStatus =
    (typeof LogisticOrderStatuses)[keyof typeof LogisticOrderStatuses]

export interface BuyerProfile {
  fullname: string | null
  passportNumber: string | null
  address: string | null
  phone: string | null
  additionalInfo: string | null
  files: SimpleFile[]
}

export interface Invoice {
  invoiceNumber: string
  invoiceDate: string
  vin: string | null
  carPriceCny: number | null
  arrivalPortCode: string | null
  deliveryToPortCny: number | null
  expensesMarkupCny?: number | null
  diagnosticCount: number
  diagnosticPriceCny: number
  diagnosticTotalCny: number
  compensationCount: number
  compensationPriceCny: number
  compensationTotalCny: number
  invoiceSumCny: number
  payerType: string
  broker: string | null
  payerFullname: string | null
  payerAddress: string | null
  payerPhone: string | null
  invoiceVerified: boolean
  file: SimpleFile | null
  pdfStatus?: InvoicePdfStatus | null
  pdfFile?: SimpleFile | null
  excelStatus?: InvoiceExcelStatus | null
  excelFile?: SimpleFile | null
  paymentFiles: SimpleFile[] | []
}

export interface SellerProfile {
  wechat: string | null
  phone: string | null
  address: string | null
  additionalInfo: string | null
  insuranceExpiryDate: string | null
}

export interface Creator {
  id: number
  name: string
}

export interface LogistData {
  id: number
  name: string
}

export interface LogisticOrder {
  id: number
  deliveryId: string | null
  status: LogisticOrderStatus
  buyerProfile: BuyerProfile | null
  invoice: Invoice | null
  sellerProfile: SellerProfile | null
  creator: Creator | null
  listingId: number | null
  listingRequestId: number | null
  logist: LogistData | null
  departureCity: string | null
}

export interface SellerData {
  id: number
  name: string
}

export interface LogisticOrderListItemData {
  id: number
  status: string
  statusChangedAt: string
  creator: Creator | null
  listing: ListingOrderData | null
  logist: LogistData | null
}

export interface ListingOrderData {
  id: number
  vin: string | null
  internal_number: string | null
  name: string | null
  seller: SellerData | null
}
