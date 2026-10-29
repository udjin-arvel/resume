import type { PaginationData } from "~/types/common/pagination"
import type { Calculate } from "@/types/responses/calculatorOption"
import type { SaleStatusBooked, SaleStatusSold, SaleStatusWithdrawn } from "~/constants/catalog"
import type { TranslatableConfig } from "@/composables/useTranslatable"
import type { DiagnosticFormat } from "@/types/responses/diagnosticReport"
import type { CompensationReport } from "@/types/responses/compensationReport"
import type { SearchRequestBinding } from "@/types/responses/searchRequestBinding"

import type { DescriptionPart } from "@/components/catalog/ListingDescription.vue"

export interface Car {
  id: number
  name: string
  brand_name: string
  model_name?: string
  year: string
  displacement: string
  short_power_type?: string | null
  power_type: string
  gearbox: string
  scale: string
  img: string
  drive_type: string
  engine: string | null
  horse_power?: number | null
  number_of_fast_charging_ports?: string | null
  letter?: string | null
  market_date?: string | null
  stop_date?: string | null
  sale_state?: string | null
  effluent_standard?: string | null
  displacement_ml?: number | null
  gearbox_number?: string | null
  chassis_number?: string | null
  common_kcsj?: string | null
  common_mcsj?: string | null
  common_kcdlbfb?: string | null
  common_zdgl?: string | null
  common_zdnj?: string | null
  common_fdj?: string | null
  common_ddj?: string | null
  common_gearbox?: string | null
  common_short_gearbox?: string | null
  common_size?: string | null
  common_csjg?: string | null
  common_zgcs?: string | null
  common_gfjs?: string | null
  common_scjs?: string | null
  common_sczd?: string | null
  common_scxhlc?: string | null
  common_sckcsj?: string | null
  common_scmcsj?: string | null
  common_nedczhyh?: string | null
  common_wltczhyh?: string | null
  common_zdhdztyh?: string | null
  common_scyh?: string | null
  common_car_warranty?: string | null
  common_car_warranty_first?: string | null
  gearbox_body_gearbox?: string | null
  gearbox_body_gearnum?: string | null
  gearbox_body_geartype?: string | null
  gearbox_body_geartypejc?: string | null
  gearbox_body_length?: number | null
  gearbox_body_width?: number | null
  gearbox_body_high?: number | null
  gearbox_body_wheelbase?: number | null
  gearbox_body_trackfront?: number | null
  gearbox_body_trackrear?: number | null
  gearbox_body_jjj?: number | null
  gearbox_body_lqj?: number | null
  gearbox_body_zxldjx?: string | null
  gearbox_body_cms?: string | null
  gearbox_body_zws?: string | null
  gearbox_body_yxrj?: string | null
  gearbox_body_xlxrj?: string | null
  gearbox_body_full_weight?: number | null
  gearbox_body_full_weight_max?: number | null
  engine_engine_model?: string | null
  engine_displacement_ml?: number | null
  engine_displacement?: string | null
  engine_jqxs?: string | null
  engine_fdjbj?: string | null
  engine_qgplxs?: string | null
  engine_qfs?: string | null
  engine_mgqms?: string | null
  engine_ysb?: string | null
  engine_pqjg?: string | null
  engine_gj?: string | null
  engine_xc?: string | null
  engine_zdml?: string | null
  engine_zdgl?: string | null
  engine_zdglzs?: string | null
  engine_zdnj?: string | null
  engine_zdnjzs?: string | null
  engine_fdjtyjs?: string | null
  engine_zdjgl?: string | null
  engine_rlxs?: string | null
  engine_ryxh?: string | null
  engine_gyfs?: string | null
  engine_ggcl?: string | null
  engine_gtcl?: string | null
  electric_djlx?: string | null
  electric_ddjzgl?: string | null
  electric_ddjznj?: string | null
  electric_qddjzdgl?: string | null
  electric_qddjzdnj?: string | null
  electric_hddzdgl?: string | null
  electric_hdjzdnj?: string | null
  electric_ztzhgl?: string | null
  electric_xtzhnj?: string | null
  electric_qddjs?: string | null
  electric_djbj?: string | null
  electric_dclx?: string | null
  electric_dxpp?: string | null
  electric_gxbcdxhlc?: string | null
  electric_dcnl?: string | null
  electric_bglhdl?: string | null
  electric_kcgl?: string | null
  electric_dczzb?: string | null
  electric_kcsj?: string | null
  electric_mcsj?: string | null
  electric_kcdl?: string | null
  electric_dclqfs?: string | null
  electric_hd?: string | null
  electric_cltc_xhlc?: string | null
  electric_nedc_xhlc?: string | null
  chassis_driven_type?: string | null
  chassis_four_drive_form?: string | null
  chassis_csqjg?: string | null
  chassis_front_suspension_type?: string | null
  chassis_rear_suspension_type?: string | null
  chassis_steering_type?: string | null
  chassis_body_type?: string | null
  chassis_short_drive_type?: string | null
  wheel_front_brake_type?: string | null
  wheel_rear_brake_type?: string | null
  wheel_parking_brake_type?: string | null
  wheel_front_tyre_size?: string | null
  wheel_rear_tyre_size?: string | null
  wheel_spare_tyre_size?: string | null
  safety_zfjsaqqn?: string | null
  safety_qhcqn?: string | null
  safety_qhtbqn?: string | null
  safety_xbqn?: string | null
  safety_fjszdqn?: string | null
  safety_qpzjqn?: string | null
  safety_hpaqdsqn?: string | null
  safety_hpzyfxhqn?: string | null
  safety_hpzyaqqn?: string | null
  safety_bdxrbh?: string | null
  safety_tyjc?: string | null
  safety_qqbqlt?: string | null
  safety_aqdwjts?: string | null
  safety_etzyjk?: string | null
  safety_abs?: string | null
  safety_zdlfp?: string | null
  safety_scfz?: string | null
  safety_qylkz?: string | null
  safety_cswdkz?: string | null
  safety_cdplyj?: string | null
  safety_zdsc?: string | null
  safety_pljstx?: string | null
  safety_qfpzyj?: string | null
  safety_dljyhj?: string | null
  safety_hfpzyj?: string | null
  safety_kmyj?: string | null
  safety_xzjly?: string | null
  control_jsmsqh?: string | null
  control_nlhsxt?: string | null
  control_zdzc?: string | null
  control_spfz?: string | null
  control_dphj?: string | null
  control_kbzxb?: string | null
  control_dtbms?: string | null
  control_fdjtq?: string | null
  assisted_driving_hardware_zcld?: string | null
  assisted_driving_hardware_jsfzyx?: string | null
  assisted_driving_hardware_sxtsl?: string | null
  assisted_driving_hardware_tmdp?: string | null
  assisted_driving_feature_yhxt?: string | null
  assisted_driving_feature_fzjsdj?: string | null
  assisted_driving_feature_dcccyj?: string | null
  assisted_driving_feature_wxdh?: string | null
  assisted_driving_feature_dhlkxx?: string | null
  assisted_driving_feature_bxfz?: string | null
  assisted_driving_feature_cdbcfz?: string | null
  assisted_driving_feature_cdjzbc?: string | null
  assisted_driving_feature_ysxt?: string | null
  assisted_driving_feature_fzjsxt?: string | null
  assisted_driving_feature_dljtsb?: string | null
  assisted_driving_feature_ykbc?: string | null
  assisted_driving_feature_zdbc?: string | null
  assisted_driving_feature_yczh?: string | null
  assisted_driving_feature_zdjsfzld?: string | null
  four_wheel_drive_kbxj?: string | null
  four_wheel_drive_kqxj?: string | null
  four_wheel_drive_dcgyxj?: string | null
  four_wheel_drive_zycsqsz?: string | null
  four_wheel_drive_zdzx?: string | null
  four_wheel_drive_xhcsq?: string | null
  four_wheel_drive_ssgy?: string | null
  four_wheel_drive_dssq?: string | null
  external_lqcz?: string | null
  external_ddhbx?: string | null
  external_gyhbx?: string | null
  external_ddhbxwzjy?: string | null
  external_fdjdzfs?: string | null
  external_cnzks?: string | null
  external_yslx?: string | null
  external_wysqd?: string | null
  external_wysjr?: string | null
  external_wksjcm?: string | null
  external_ycqd?: string | null
  external_dcyjr?: string | null
  external_ydwgtj?: string | null
  external_jqgs?: string | null
  external_cdxlj?: string | null
  external_ddrlb?: string | null
  external_ddxhcm?: string | null
  external_chmxs?: string | null
  external_wmbldlkq?: string | null
  external_ddbs?: string | null
  external_ccjtp?: string | null
  external_ddkttb?: string | null
  light_jgdg?: string | null
  light_ygdg?: string | null
  light_dgts?: string | null
  light_ledrjxcd?: string | null
  light_zsyyjg?: string | null
  light_zdtd?: string | null
  light_cqwd?: string | null
  light_qddyw?: string | null
  light_ddgdkt?: string | null
  light_ddqxzz?: string | null
  light_ddycgb?: string | null
  light_zxfzd?: string | null
  light_zxtd?: string | null
  light_cmsydd?: string | null
  light_cnhjfwd?: string | null
  glass_tclx?: string | null
  glass_ddcc?: string | null
  glass_ccyjsj?: string | null
  glass_ccfjs?: string | null
  glass_dcgybl?: string | null
  glass_hfdzyl?: string | null
  glass_hpcczyl?: string | null
  glass_hpcysbl?: string | null
  glass_cnhzj?: string | null
  glass_hys?: string | null
  glass_gyys?: string | null
  glass_jrpzh?: string | null
  glass_xktc?: string | null
  glass_whsj?: string | null
  glass_nhsj?: string | null
  internal_fxpcz?: string | null
  internal_fxpwztj?: string | null
  internal_hdxs?: string | null
  internal_dgnfxp?: string | null
  internal_fxphd?: string | null
  internal_fxpjr?: string | null
  internal_fxpjy?: string | null
  internal_xcdnpm?: string | null
  internal_qyjybp?: string | null
  internal_yjybcc?: string | null
  internal_hudttszxs?: string | null
  interconnect_system_zkcspm?: string | null
  interconnect_system_zkpmcc?: string | null
  interconnect_system_zkxpmcc?: string | null
  interconnect_system_lydh?: string | null
  interconnect_system_dljyhj?: string | null
  interconnect_system_zkyjp?: string | null
  interconnect_system_sjhl?: string | null
  interconnect_system_yysb?: string | null
  interconnect_system_zcznxt?: string | null
  interconnect_system_sskz?: string | null
  interconnect_system_mmsb?: string | null
  interconnect_system_fjylp?: string | null
  interconnect_system_czds?: string | null
  interconnect_system_hpyjpm?: string | null
  interconnect_system_hpkzdmt?: string | null
  interconnect_system_czcd?: string | null
  interconnect_system_clw?: string | null
  interconnect_system_otasj?: string | null
  interconnect_system_appyckz?: string | null
  interconnect_system_wifi?: string | null
  interconnect_system_zdjz?: string | null
  multimedia_ysqpp?: string | null
  multimedia_ysqsl?: string | null
  multimedia_cdjk?: string | null
  multimedia_usbsl?: string | null
  multimedia_sjwxcd?: string | null
  multimedia_power_220dy?: string | null
  multimedia_xlxdy?: string | null
  seat_zycz?: string | null
  seat_ydfgzy?: string | null
  seat_zzytjfs?: string | null
  seat_fzytjfs?: string | null
  seat_ddzytj?: string | null
  seat_qpzygn?: string | null
  seat_ddzyjy?: string | null
  seat_fjshptj?: string | null
  seat_depzytj?: string | null
  seat_hpzyddtj?: string | null
  seat_hpzygn?: string | null
  seat_hpxzb?: string | null
  seat_depdlzy?: string | null
  seat_zybj?: string | null
  seat_hpzydfxs?: string | null
  seat_hpzyddfd?: string | null
  seat_qhzyfs?: string | null
  seat_hpbj?: string | null
  seat_jrbj?: string | null
  fridge_ktwdkz?: string | null
  fridge_hpdlkt?: string | null
  fridge_hzcfk?: string | null
  fridge_wdfqkz?: string | null
  fridge_czkqjhq?: string | null
  fridge_pm25zz?: string | null
  fridge_flzfsq?: string | null
  fridge_cnxfzz?: string | null
  fridge_czbx?: string | null
}

export interface Media {
  id: number
  url: string
  thumb?: string | null
  small?: string | null
  medium?: string | null
  poster?: string | null
  name: string
  descriptions?: Record<string, string>
}

export interface Listing {
  id: number
  car_id: number
  user_id: number
  name: string
  vin: string | null
  internal_number: string | null
  external_url: string | null
  seller_contact_name: string | null
  seller_phone: string | null
  comment: string | null
  city: string | null
  mileage: number | null
  price: number
  condition: string | null
  body_color: string | null
  is_new: boolean
  status: string
  sale_status: SaleStatus
  withdrawn_at?: string | null
  visibility: string
  diagnostic_created_at: string | null
  diagnostic_changed_at?: string | null
  is_active: boolean
  diagnostic_url: string | null
  diagnostic_comment: string | null
  diagnostic_shown?: boolean
  created_at: string | null
  year: string | null
  release_year: number | null
  month: number | null
  updated_at: string | null
  car: Car | null
  series: { id: number, name: string }
  brand: { id: number, name: string }
  photos: Media[]
  videos: Media[]
  nameplates?: Media[]
  defects?: Media[]
  vin_locked?: boolean
  price_locked?: boolean
  condition_locked?: boolean
  condition_comment_locked?: boolean
  month_locked?: boolean
  chassis_number_locked?: boolean
  nameplates_locked?: boolean
  photos_total?: number
  photos_hidden_count?: number
  photos_blurred?: (string | null)[]
  photos_locked?: boolean
  videos_locked?: boolean
  total_video?: number
  total_diagnostic?: number
  total_compensation?: number
  total_booking?: number
  seller_name?: string
  logistic_status?: string
  logistic_status_date?: string
  purchase_date?: string
  logistic_order_id?: number
  buyer_id?: number
  buyer_name?: string
  search_requests?: SearchRequestBinding[]
  diagnostic_requested?: boolean
  compensation_requested?: boolean
  video_requested?: boolean
  booking_requested?: boolean
  diagnostic_subscribed?: boolean
  video_loaded?: boolean
  diagnostic_loaded?: boolean
  compensation_loaded?: boolean
  review_id?: number | null
  description_ru: string | null
  description_zh: string | null
  options?: string | null
  options_ru?: string | null
  options_zh?: string | null
  original_locale: string | null
  ol_description?: string | null
  ol_options?: string | null
  original_paint?: boolean
  has_compensation?: boolean
  number_of_keys?: number
  is_archive?: boolean
  can_view_archive_details?: boolean
  is_favorited?: boolean
}

export interface ListingFull extends Listing {
  car: Car | null
  total_video_requests?: number
  total_diagnostic_requests?: number
  calculations?: Calculations | null
  deposit?: number | null
  has_deposit?: boolean
  diagnostics_locked?: boolean
  compensation_locked?: boolean
  has_video?: boolean
  has_diagnostics?: boolean
  diagnostic_format?: DiagnosticFormat
  diagnostic_report_code?: string | null
  diagnostic_report_visible?: boolean
  diagnostic_report_inspected_at?: string | null
  compensation_report_code?: string | null
  compensation_report_inspected_at?: string | null
  compensation_report?: CompensationReport | null
  has_compensation?: boolean
  compensation_subscribed?: boolean
}

export interface ApiResponse {
  status?: string
  data: Listing[]
  meta?: PaginationData
}

export interface TranslatableParamValue {
  type: "translatable"
  data: {
    description_ru?: string | null
    description_zh?: string | null
    options_ru?: string | null
    options_zh?: string | null
    original_locale?: string | null
    [key: string]: any
  }
  config: TranslatableConfig
}

export type ParamPair = {
  name: string
  value: string | number | TranslatableParamValue
  showHybridTooltip?: boolean
  locked?: boolean
}

export type SaleStatus = typeof SaleStatusBooked | typeof SaleStatusSold | typeof SaleStatusWithdrawn | null

export type Calculations = Record<string, Calculate>

export interface ShortListing {
  id: number
  title: string
  description: string
  descriptionParts?: DescriptionPart[]
  user_id: number
  price: number
  params: ParamPair[]
  images: string[]
  imageThumbs?: string[]
  imageOriginals?: string[]
  videos: string[]
  videoPosters?: (string | null)[]
  nameplates?: string[]
  nameplateThumbs?: string[]
  nameplateOriginals?: string[]
  defects?: string[]
  defectThumbs?: string[]
  defectOriginals?: string[]
  defectDescriptions?: Record<string, string>[]
  diagnostics: string
  diagnostic_is_own: boolean
  diagnostic_format?: DiagnosticFormat
  diagnostic_comment?: string | null
  diagnostic_report_code?: string | null
  diagnostic_report_inspected_at?: string | null
  compensation_report_code?: string | null
  compensation_report_inspected_at?: string | null
  compensation_report?: CompensationReport | null
  diagnostic_requested: boolean
  diagnostic_subscribed: boolean
  diagnostic_created_at: string | null
  diagnostic_changed_at?: string | null
  diagnostic_shown?: boolean
  video_requested: boolean
  booking_requested?: boolean
  booking_status?: string
  sale_status: SaleStatus
  total_video_requests: number
  total_diagnostic_requests: number
  location_name: string
  published_at: string
  calculations: Calculations | null
  price_locked: boolean
  photos_locked: boolean
  videos_locked: boolean
  diagnostics_locked: boolean
  compensation_locked?: boolean
  vin_locked?: boolean
  condition_locked?: boolean
  condition_comment_locked?: boolean
  month_locked?: boolean
  chassis_number_locked?: boolean
  nameplates_locked?: boolean
  photos_total?: number
  photos_hidden_count?: number
  imageBlurs?: (string | null)[]
  has_video?: boolean
  has_diagnostics?: boolean
  has_compensation?: boolean
  compensation_requested?: boolean
  compensation_subscribed?: boolean
  condition?: string | null
  description_ru?: string | null
  description_zh?: string | null
  original_locale?: string | null
  original_paint?: boolean
  number_of_keys?: number
  is_archive?: boolean
  can_view_archive_details?: boolean
}

export type ShortListingNullable = ShortListing | null

export interface BaseInfoOption {
  id: number
  name: string
}

export interface ListingPreviewCar {
  brand_name: string | null
  model_name: string | null
  name: string | null
  displacement?: string | null
  common_short_gearbox?: string | null
  chassis_driven_type?: string | null
  power_type?: string | null
  engine_zdml?: string | null
}

export interface ListingPreview {
  id: number
  name: string | null
  vin: string | null
  internal_number: string | null
  price: number
  year: string | number | null
  mileage: number | null
  original_paint: boolean
  condition: string | null
  description: string | null
  images: string[]
  car: ListingPreviewCar | null
}

export interface ListingBaseInfo {
  managers: BaseInfoOption[]
  brands: BaseInfoOption[]
}

export interface ShareListingResponse {
  code: string
  expires_at: string | null
  url?: string
}

export interface ImportFromUrlResponse {
  job_id: string
  message: string
}

export interface ImportedListingData {
  car_id?: number
  brand_id?: number
  series_id?: number
  model_id?: number
  year?: number
  release_year?: number | null
  month?: number
  mileage?: number
  color?: string
  city?: string
  price?: number | null
  external_url?: string | null
  photo_ids?: number[]
  video_ids?: number[]
  nameplate_ids?: number[]
  parsed_brand?: string
  parsed_model?: string
  media_loading?: boolean
}

export interface ImportProgressEvent {
  jobId: string
  percent: number
  message: string
  data?: ImportedListingData | null
  error: boolean
  partial?: boolean
}
