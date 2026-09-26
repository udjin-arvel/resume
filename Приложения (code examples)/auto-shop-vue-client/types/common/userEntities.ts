import type { ClientTypeCompany, ClientTypeEntrepreneur } from "~/constants/types"

export type ClientType = typeof ClientTypeCompany | typeof ClientTypeEntrepreneur
