export interface LandingCar {
  lot: number
  name: string
  price: number
  mileage: number
}

export interface LandingPurchase extends LandingCar {
  date: string
}

export const landingCarPhoto = (lot: number): string => `/landing/cars/${lot}.webp`

export const landingHeroCar: LandingCar = {
  lot: 10404,
  name: "Volkswagen Lamando L 2023 280TSI DSG",
  price: 105800,
  mileage: 15000,
}

export const landingFeedCars: LandingCar[] = [
  { lot: 10477, name: "Volkswagen T-Roc 2022 280TSI DSG", price: 99800, mileage: 28900 },
  { lot: 10391, name: "Audi A3 2023 Sportback 35 TFSI", price: 139800, mileage: 35000 },
  { lot: 10315, name: "Volkswagen Tayron 2023 280TSI", price: 178800, mileage: 13000 },
]

export const landingPurchases: LandingPurchase[] = [
  { lot: 10476, name: "Audi Q2L 2022 35 TFSI", price: 115800, mileage: 34000, date: "26.06.2026" },
  { lot: 10520, name: "Volkswagen Golf 2021 280TSI R-Line", price: 115000, mileage: 34000, date: "26.06.2026" },
  { lot: 10347, name: "Audi A3L 2023 35 TFSI", price: 131800, mileage: 19000, date: "26.06.2026" },
  { lot: 10391, name: "Audi A3 2023 Sportback 35 TFSI", price: 139800, mileage: 35000, date: "26.06.2026" },
]

export const landingBookingCar: LandingCar = {
  lot: 10347,
  name: "Audi A3 · 2023",
  price: 131800,
  mileage: 19000,
}

export const landingDiagnosticExample = {
  base: "/landing/diagnostic-report",
  inspectedAt: "2026-06-17",
  photos: 74,
  defects: 30,
  videos: 7,
}

export const landingDiagnosticExampleMedia = (folder: string, count: number, ext: string): string[] =>
  Array.from({ length: count }, (_, index) => `${landingDiagnosticExample.base}/${folder}/${String(index + 1).padStart(2, "0")}.${ext}`)

export const landingHistoryReportExample = "/landing/history-report-example.pdf"
