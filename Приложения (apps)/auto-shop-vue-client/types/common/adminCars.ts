export type CarModel = {
  id: number
  name: string
  active: boolean
  image?: string | null
  models?: CarModel[]
}

export interface CarCompletion {
  id: number
  active: boolean
  name: string
  modelName: string
  brandName: string
  year: string | null
  displacement: string | null
  powerType: string | null
  horsepower: string | null
  driveType: string | null
  scaleType: string | null
}

export interface CarFilterOption {
  id: number
  name: string
  image?: string
}
