import type { PortType } from "@/types/responses/port"
import type { SimpleFile } from "@/types/common/file"

export type InvoicePdfStatus = "pending" | "processing" | "ready" | "failed"
export type InvoiceExcelStatus = "pending" | "processing" | "ready" | "failed"

export interface InvoiceType {
  invoiceNumber: string
  invoiceDate: string | null
  vin: string | null
  car: string | null
  carRu: string | null
  carPriceCny: string | number | null
  arrivalPortCode: string | null
  arrivalPortName: string | null
  port?: PortType | null
  deliveryToPortCny: string | number | null
  expensesMarkupCny?: string | number | null
  diagnosticCount: number
  diagnosticPriceCny: string | number
  diagnosticTotalCny: string | number
  compensationCount: number
  compensationPriceCny: string | number
  compensationTotalCny: string | number
  invoiceSumCny: string | number
  payerType: "phys" | "juridical"
  broker: string | null
  payerFullname: string | null
  payerAddress: string | null
  payerPhone: string | null
  passportNumber: string | null
  invoiceVerified: boolean
  file: {
    url: string
    name?: string
  } | null
  pdfStatus?: InvoicePdfStatus | null
  pdfFile?: SimpleFile | null
  excelStatus?: InvoiceExcelStatus | null
  excelFile?: SimpleFile | null

  paymentFiles?: {
    url: string
    name?: string
  }[]

  tradeTerms?: string | null
  transportMode?: string | null
  nameplates?: SimpleFile[]
  productionDate?: string | null
  engineDisplacementMl?: string | null
  hsCode?: string | null
  templateVersion: "legacy" | "new"
}

export interface InvoicePdfDownload {
  url: string
  fileName: string
  expiresAt: string | null
}

export interface InvoiceExcelDownload {
  url: string
  fileName: string
  expiresAt: string | null
}
