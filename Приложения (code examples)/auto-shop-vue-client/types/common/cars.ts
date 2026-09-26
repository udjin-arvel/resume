import type { ALL_COLORS,
  PowerTypeAll,
  PowerTypeDiesel,
  PowerTypeElectric,
  PowerTypeGas,
  PowerTypeHybrid,
  PowerTypePetrol,
  StatusNew,
  StatusUsed } from "~/constants/cars"

export type PowerType =
  | typeof PowerTypeHybrid
  | typeof PowerTypePetrol
  | typeof PowerTypeAll
  | typeof PowerTypeDiesel
  | typeof PowerTypeElectric
  | typeof PowerTypeGas

export type Status = typeof StatusNew | typeof StatusUsed

export type CalculatePowerType = "petrol" | "diesel" | "electric"

export type Seaport = string

export type ColorValue = (typeof ALL_COLORS)[number]
