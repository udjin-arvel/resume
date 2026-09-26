<template>
  <div>
    <div
      v-if="isLoading"
      :class="$style.loading"
    >
      {{ t('common.loading') }}
    </div>

    <div
      v-else-if="!displayedParams.length"
      :class="$style.noData"
    >
      {{ t('needs.no_params_available') }}
    </div>

    <div
      v-else
      :class="$style.paramsGrid"
    >
      <div
        v-for="(param, idx) in displayedParams"
        :key="idx"
        :class="[
          $style.paramRow,
          param.name === 'group_header' ? $style.groupHeader : '',
        ]"
      >
        <template v-if="param.name === 'group_header'">
          <span :class="$style.groupTitle">{{ param.value }}</span>
        </template>
        <template v-else>
          <span :class="$style.paramName">{{ param.name }}</span>
          <span :class="$style.paramValue">
            <template v-if="canEditEquipment && param.nameKey === 'catalog.detail.equipment'">
              <Popover
                v-slot="{ close }"
                :class="$style.popoverWrapper"
              >
                <PopoverButton
                  :class="$style.editableTrigger"
                  @click="initEdit(param.value)"
                >
                  <span :class="$style.editableText">{{ formatValue(param.value) }}</span>
                  <PencilIcon :class="$style.editIcon" />
                </PopoverButton>

                <transition
                  enter-active-class="transition ease-out duration-200"
                  enter-from-class="opacity-0 translate-y-1"
                  enter-to-class="opacity-100 translate-y-0"
                  leave-active-class="transition ease-in duration-150"
                  leave-from-class="opacity-100 translate-y-0"
                  leave-to-class="opacity-0 translate-y-1"
                >
                  <PopoverPanel :class="$style.popoverPanel">
                    <div :class="$style.editPopoverBody">
                      <div :class="$style.editPopoverInputWrapper">
                        <Input
                          v-model="editEquipmentName"
                          @keyup.enter="saveEquipmentName(close)"
                          @keyup.esc="close()"
                        />
                      </div>
                      <div :class="$style.editPopoverActions">
                        <CommonButton
                          kind="black"
                          size="xs"
                          @click="saveEquipmentName(close)"
                        >
                          {{ t('actions.save') }}
                        </CommonButton>
                        <CommonButton
                          kind="white"
                          size="xs"
                          @click="close()"
                        >
                          {{ t('actions.cancel') }}
                        </CommonButton>
                      </div>
                    </div>
                  </PopoverPanel>
                </transition>
              </Popover>
            </template>
            <template v-else-if="hasBullets(param.value)">
              <span
                v-for="(part, i) in bulletParts(param.value)"
                :key="i"
                class="inline-flex items-center mr-3"
              >
                <CheckIcon :class="$style.checkIcon" />
                <span>{{ part }}</span>
              </span>
            </template>
            <template v-else>
              {{ formatValue(param.value) }}
            </template>
          </span>
        </template>
      </div>
    </div>

    <button
      v-if="!showAll && filteredParams.length > 10"
      type="button"
      :class="$style.expandBtn"
      @click="toggleExpand"
    >
      <span>
        {{ expanded ? t('needs.collapse_params') : t('needs.expand_params') }}
      </span>
      <ChevronDownIcon :class="[$style.expandIcon, { [$style.rotated]: expanded }]" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useI18n } from "vue-i18n"
import { ChevronDownIcon, CheckIcon, PencilIcon } from "@heroicons/vue/24/solid"
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/vue" // Новые импорты
import Input from "@/components/form/Input.vue"
import CommonButton from "@/components/common/Button.vue"

const props = defineProps<{
  carId: number
  showAll?: boolean
  canEditEquipment?: boolean
}>()

const emit = defineEmits<{
  (e: "update:equipmentName", id: number, newName: string): void
}>()

const { t } = useI18n()
const expanded = ref(false)
const isLoading = ref(true)
const carDetails = ref<any>(null)

const editEquipmentName = ref("")

const initEdit = (currentName: string) => {
  editEquipmentName.value = currentName
}

const saveEquipmentName = async (closeFn: () => void) => {
  if (!editEquipmentName.value.trim()) {
    return
  }

  if (carDetails.value) {
    carDetails.value.name = editEquipmentName.value
  }

  emit("update:equipmentName", props.carId, editEquipmentName.value)
  closeFn()
}

onMounted(async () => {
  try {
    const { getCarDetailsFull } = useSearchRequest()
    const data = await getCarDetailsFull(props.carId)
    carDetails.value = data
  }
  catch (error) {
    console.error("Failed to load car details:", error)
  }
  finally {
    isLoading.value = false
  }
})

const buildParams = (car: any, t: any) => {
  const formatUnit = (v: any, unit: string) => (v != null && v !== "" ? `${v} ${unit}` : "")
  const translateIfExists = (key: string, value?: string | null): string => {
    if (!value || !t(`${key}.${value}`)) {
      return value ?? ""
    }
    return t(`${key}.${value}`)
  }

  interface ParamCfg {
    nameKey: string
    field?: string
    getter?: (l: any, t: any) => any
    dictKey?: string
    unitKey?: string
  }

  interface GroupCfg {
    headerKey?: string
    params: ParamCfg[]
  }

  const groups: GroupCfg[] = [
    // Базовые параметры (без группы)
    {
      params: [
        { nameKey: "catalog.detail.brand", field: "brand_name" },
        { nameKey: "catalog.detail.model", field: "model_name" },
        { nameKey: "catalog.detail.equipment", field: "name" },
        { nameKey: "catalog.detail.condition", field: "condition", dictKey: "cars.condition" },
        { nameKey: "catalog.detail.engine_type", field: "power_type", dictKey: "cars.power_type" },
        { nameKey: "catalog.detail.displacement", field: "displacement" },
        { nameKey: "catalog.detail.common_gearbox", field: "common_short_gearbox", dictKey: "cars.gearbox" },
        { nameKey: "catalog.detail.chassis_driven_type", field: "chassis_driven_type" },
        { nameKey: "catalog.detail.engine_zdml", field: "engine_zdml", unitKey: "catalog.detail.hp" },
        { nameKey: "catalog.detail.gearbox", field: "gearbox", dictKey: "cars.gearbox" },
        { nameKey: "catalog.detail.drive_type", field: "drive_type", dictKey: "cars.drive_type" },
        { nameKey: "catalog.detail.year", field: "year" },
        { nameKey: "VIN", field: "vin" },
        { nameKey: "catalog.detail.color", field: "body_color", dictKey: "cars.colors" },
        { nameKey: "catalog.detail.stop_date", field: "stop_date" },
        { nameKey: "catalog.detail.effluent_standard", field: "effluent_standard" },
        { nameKey: "catalog.detail.displacement_ml", field: "displacement_ml", unitKey: "catalog.detail.ml" },
        { nameKey: "catalog.detail.gearbox_number", field: "gearbox_number" },
        { nameKey: "catalog.detail.engine_type", field: "engine" }, // повтор, но как в оригинале
      ],
    },

    // Общие параметры
    {
      headerKey: "catalog.detail.common_group_title",
      params: [
        { nameKey: "catalog.detail.common_kcsj", field: "common_kcsj", unitKey: "catalog.detail.sec" },
        { nameKey: "catalog.detail.common_mcsj", field: "common_mcsj", unitKey: "catalog.detail.sec" },
        { nameKey: "catalog.detail.common_kcdlbfb", field: "common_kcdlbfb", unitKey: "%" }, // в оригинале просто %
        { nameKey: "catalog.detail.common_zdgl", field: "common_zdgl", unitKey: "catalog.detail.kw" },
        { nameKey: "catalog.detail.common_zdnj", field: "common_zdnj", unitKey: "catalog.detail.nm" },
        { nameKey: "catalog.detail.common_ddj", field: "common_ddj" },
        { nameKey: "catalog.detail.common_size", field: "common_size" },
        { nameKey: "catalog.detail.common_csjg", field: "common_csjg" },
        { nameKey: "catalog.detail.scale", field: "scale", dictKey: "cars.scale_type" },
        { nameKey: "catalog.detail.common_zgcs", field: "common_zgcs", unitKey: "catalog.detail.km_h" },
        { nameKey: "catalog.detail.common_gfjs", field: "common_gfjs" },
        { nameKey: "catalog.detail.common_scjs", field: "common_scjs" },
        { nameKey: "catalog.detail.common_sczd", field: "common_sczd" },
        { nameKey: "catalog.detail.common_scxhlc", field: "common_scxhlc", unitKey: "catalog.detail.km" },
        { nameKey: "catalog.detail.common_sckcsj", field: "common_sckcsj", unitKey: "catalog.detail.hr" },
        { nameKey: "catalog.detail.common_scmcsj", field: "common_scmcsj", unitKey: "catalog.detail.hr" },
        { nameKey: "catalog.detail.common_nedczhyh", field: "common_nedczhyh", unitKey: "catalog.detail.l_100km" },
        { nameKey: "catalog.detail.common_wltczhyh", field: "common_wltczhyh", unitKey: "catalog.detail.l_100km" },
        { nameKey: "catalog.detail.common_zdhdztyh", field: "common_zdhdztyh", unitKey: "catalog.detail.l_100km" },
        { nameKey: "catalog.detail.common_scyh", field: "common_scyh", unitKey: "catalog.detail.l_100km" },
      ],
    },

    // Коробка передач
    {
      headerKey: "catalog.detail.gearbox_group_title",
      params: [
        { nameKey: "catalog.detail.gearbox_body_gearbox", field: "gearbox_body_gearbox" },
        { nameKey: "catalog.detail.gearbox_body_gearnum", field: "gearbox_body_gearnum" },
        { nameKey: "catalog.detail.gearbox_body_geartype", field: "gearbox_body_geartype" },
        { nameKey: "catalog.detail.gearbox_body_geartypejc", field: "gearbox_body_geartypejc" },
      ],
    },

    // Кузов (gearbox_body)
    {
      headerKey: "catalog.detail.gearbox_body_group_title",
      params: [
        { nameKey: "catalog.detail.gearbox_body_length", field: "gearbox_body_length", unitKey: "catalog.detail.mm" },
        { nameKey: "catalog.detail.gearbox_body_width", field: "gearbox_body_width", unitKey: "catalog.detail.mm" },
        { nameKey: "catalog.detail.gearbox_body_high", field: "gearbox_body_high", unitKey: "catalog.detail.mm" },
        { nameKey: "catalog.detail.gearbox_body_wheelbase", field: "gearbox_body_wheelbase", unitKey: "catalog.detail.mm" },
        { nameKey: "catalog.detail.gearbox_body_trackfront", field: "gearbox_body_trackfront", unitKey: "catalog.detail.mm" },
        { nameKey: "catalog.detail.gearbox_body_trackrear", field: "gearbox_body_trackrear", unitKey: "catalog.detail.mm" },
        { nameKey: "catalog.detail.gearbox_body_jjj", field: "gearbox_body_jjj", unitKey: "catalog.detail.mm" },
        { nameKey: "catalog.detail.gearbox_body_lqj", field: "gearbox_body_lqj", unitKey: "catalog.detail.mm" },
        { nameKey: "catalog.detail.gearbox_body_zxldjx", field: "gearbox_body_zxldjx" },
        { nameKey: "catalog.detail.gearbox_body_cms", field: "gearbox_body_cms" },
        { nameKey: "catalog.detail.gearbox_body_zws", field: "gearbox_body_zws" },
        { nameKey: "catalog.detail.gearbox_body_yxrj", field: "gearbox_body_yxrj", unitKey: "catalog.detail.l" },
        { nameKey: "catalog.detail.gearbox_body_xlxrj", field: "gearbox_body_xlxrj", unitKey: "catalog.detail.l" },
        { nameKey: "catalog.detail.gearbox_body_full_weight", field: "gearbox_body_full_weight", unitKey: "catalog.detail.kg" },
        { nameKey: "catalog.detail.gearbox_body_full_weight_max", field: "gearbox_body_full_weight_max", unitKey: "catalog.detail.kg" },
      ],
    },

    // Двигатель
    {
      headerKey: "catalog.detail.engine_group_title",
      params: [
        { nameKey: "catalog.detail.engine_engine_model", field: "engine_engine_model" },
        { nameKey: "catalog.detail.engine_displacement_ml", field: "engine_displacement_ml", unitKey: "catalog.detail.ml" },
        { nameKey: "catalog.detail.engine_displacement", field: "engine_displacement" },
        { nameKey: "catalog.detail.engine_jqxs", field: "engine_jqxs" },
        { nameKey: "catalog.detail.engine_fdjbj", field: "engine_fdjbj" },
        { nameKey: "catalog.detail.engine_qgplxs", field: "engine_qgplxs" },
        { nameKey: "catalog.detail.engine_qfs", field: "engine_qfs" },
        { nameKey: "catalog.detail.engine_mgqms", field: "engine_mgqms" },
        { nameKey: "catalog.detail.engine_ysb", field: "engine_ysb" },
        { nameKey: "catalog.detail.engine_pqjg", field: "engine_pqjg" },
        { nameKey: "catalog.detail.engine_gj", field: "engine_gj" },
        { nameKey: "catalog.detail.engine_xc", field: "engine_xc" },
        { nameKey: "catalog.detail.engine_zdgl", field: "engine_zdgl" }, // без unit, как в оригинале
        { nameKey: "catalog.detail.engine_zdglzs", field: "engine_zdglzs" },
        { nameKey: "catalog.detail.engine_zdnj", field: "engine_zdnj" },
        { nameKey: "catalog.detail.engine_zdnjzs", field: "engine_zdnjzs" },
        { nameKey: "catalog.detail.engine_zdjgl", field: "engine_zdjgl", unitKey: "catalog.detail.kw" },
        { nameKey: "catalog.detail.engine_ryxh", field: "engine_ryxh", unitKey: "catalog.detail.g_kwth" },
        { nameKey: "catalog.detail.engine_gyfs", field: "engine_gyfs" },
        { nameKey: "catalog.detail.engine_ggcl", field: "engine_ggcl" },
        { nameKey: "catalog.detail.engine_gtcl", field: "engine_gtcl" },
      ],
    },

    // Электрика
    {
      headerKey: "catalog.detail.electric_group_title",
      params: [
        { nameKey: "catalog.detail.electric_djlx", field: "electric_djlx" },
        { nameKey: "catalog.detail.electric_ddjzgl", field: "electric_ddjzgl", unitKey: "catalog.detail.kw" },
        { nameKey: "catalog.detail.electric_ddjznj", field: "electric_ddjznj", unitKey: "catalog.detail.nm" },
        { nameKey: "catalog.detail.electric_qddjzdgl", field: "electric_qddjzdgl", unitKey: "catalog.detail.kw" },
        { nameKey: "catalog.detail.electric_qddjzdnj", field: "electric_qddjzdnj", unitKey: "catalog.detail.nm" },
        { nameKey: "catalog.detail.electric_hddzdgl", field: "electric_hddzdgl", unitKey: "catalog.detail.kw" },
        { nameKey: "catalog.detail.electric_hdjzdnj", field: "electric_hdjzdnj", unitKey: "catalog.detail.nm" },
        { nameKey: "catalog.detail.electric_ztzhgl", field: "electric_ztzhgl", unitKey: "catalog.detail.kw" },
        { nameKey: "catalog.detail.electric_xtzhnj", field: "electric_xtzhnj", unitKey: "catalog.detail.nm" },
        { nameKey: "catalog.detail.electric_qddjs", field: "electric_qddjs" },
        { nameKey: "catalog.detail.electric_djbj", field: "electric_djbj" },
        { nameKey: "catalog.detail.electric_dclx", field: "electric_dclx" },
        { nameKey: "catalog.detail.electric_dxpp", field: "electric_dxpp" },
        { nameKey: "catalog.detail.electric_gxbcdxhlc", field: "electric_gxbcdxhlc", unitKey: "catalog.detail.km" },
        { nameKey: "catalog.detail.electric_dcnl", field: "electric_dcnl", unitKey: "catalog.detail.kwh" },
        { nameKey: "catalog.detail.electric_bglhdl", field: "electric_bglhdl", unitKey: "catalog.detail.ah" },
        { nameKey: "catalog.detail.electric_kcgl", field: "electric_kcgl", unitKey: "catalog.detail.kw" },
        { nameKey: "catalog.detail.electric_dczzb", field: "electric_dczzb" },
        { nameKey: "catalog.detail.electric_kcsj", field: "electric_kcsj", unitKey: "catalog.detail.hr" },
        { nameKey: "catalog.detail.electric_mcsj", field: "electric_mcsj", unitKey: "catalog.detail.hr" },
        { nameKey: "catalog.detail.electric_kcdl", field: "electric_kcdl", unitKey: "catalog.detail.kwh" },
        { nameKey: "catalog.detail.electric_cltc_xhlc", field: "electric_cltc_xhlc", unitKey: "catalog.detail.km" },
        { nameKey: "catalog.detail.electric_nedc_xhlc", field: "electric_nedc_xhlc", unitKey: "catalog.detail.km" },
      ],
    },

    // Шасси
    {
      headerKey: "catalog.detail.chassis_group_title",
      params: [
        { nameKey: "catalog.detail.chassis_number", field: "chassis_number" },
        { nameKey: "catalog.detail.chassis_four_drive_form", field: "chassis_four_drive_form" },
        { nameKey: "catalog.detail.chassis_csqjg", field: "chassis_csqjg" },
        { nameKey: "catalog.detail.chassis_front_suspension_type", field: "chassis_front_suspension_type" },
        { nameKey: "catalog.detail.chassis_rear_suspension_type", field: "chassis_rear_suspension_type" },
        { nameKey: "catalog.detail.chassis_steering_type", field: "chassis_steering_type" },
        { nameKey: "catalog.detail.chassis_body_type", field: "chassis_body_type" },
        { nameKey: "catalog.detail.chassis_short_drive_type", field: "chassis_short_drive_type" },
      ],
    },

    // Колёса
    {
      headerKey: "catalog.detail.wheel_group_title",
      params: [
        { nameKey: "catalog.detail.wheel_front_brake_type", field: "wheel_front_brake_type" },
        { nameKey: "catalog.detail.wheel_rear_brake_type", field: "wheel_rear_brake_type" },
        { nameKey: "catalog.detail.wheel_parking_brake_type", field: "wheel_parking_brake_type" },
        { nameKey: "catalog.detail.wheel_front_tyre_size", field: "wheel_front_tyre_size" },
        { nameKey: "catalog.detail.wheel_rear_tyre_size", field: "wheel_rear_tyre_size" },
        { nameKey: "catalog.detail.wheel_spare_tyre_size", field: "wheel_spare_tyre_size" },
      ],
    },

    // Полный привод
    {
      headerKey: "catalog.detail.four_wheel_group_title",
      params: [
        { nameKey: "catalog.detail.four_wheel_drive_kbxj", field: "four_wheel_drive_kbxj" },
        { nameKey: "catalog.detail.four_wheel_drive_kqxj", field: "four_wheel_drive_kqxj" },
        { nameKey: "catalog.detail.four_wheel_drive_dcgyxj", field: "four_wheel_drive_dcgyxj" },
        { nameKey: "catalog.detail.four_wheel_drive_zycsqsz", field: "four_wheel_drive_zycsqsz" },
        { nameKey: "catalog.detail.four_wheel_drive_zdzx", field: "four_wheel_drive_zdzx" },
        { nameKey: "catalog.detail.four_wheel_drive_xhcsq", field: "four_wheel_drive_xhcsq" },
        { nameKey: "catalog.detail.four_wheel_drive_ssgy", field: "four_wheel_drive_ssgy" },
        { nameKey: "catalog.detail.four_wheel_drive_dssq", field: "four_wheel_drive_dssq" },
      ],
    },

    // Безопасность
    {
      headerKey: "catalog.detail.safetys_group_title",
      params: [
        { nameKey: "catalog.detail.safety_zfjsaqqn", field: "safety_zfjsaqqn" },
        { nameKey: "catalog.detail.safety_qhcqn", field: "safety_qhcqn" },
        { nameKey: "catalog.detail.safety_qhtbqn", field: "safety_qhtbqn" },
        { nameKey: "catalog.detail.safety_xbqn", field: "safety_xbqn" },
        { nameKey: "catalog.detail.safety_fjszdqn", field: "safety_fjszdqn" },
        { nameKey: "catalog.detail.safety_qpzjqn", field: "safety_qpzjqn" },
        { nameKey: "catalog.detail.safety_hpaqdsqn", field: "safety_hpaqdsqn" },
        { nameKey: "catalog.detail.safety_hpzyfxhqn", field: "safety_hpzyfxhqn" },
        { nameKey: "catalog.detail.safety_hpzyaqqn", field: "safety_hpzyaqqn" },
        { nameKey: "catalog.detail.safety_bdxrbh", field: "safety_bdxrbh" },
        { nameKey: "catalog.detail.safety_tyjc", field: "safety_tyjc" },
        { nameKey: "catalog.detail.safety_qqbqlt", field: "safety_qqbqlt" },
        { nameKey: "catalog.detail.safety_aqdwjts", field: "safety_aqdwjts" },
        { nameKey: "catalog.detail.safety_etzyjk", field: "safety_etzyjk" },
        { nameKey: "catalog.detail.safety_abs", field: "safety_abs" },
        { nameKey: "catalog.detail.safety_zdlfp", field: "safety_zdlfp" },
        { nameKey: "catalog.detail.safety_scfz", field: "safety_scfz" },
        { nameKey: "catalog.detail.safety_qylkz", field: "safety_qylkz" },
        { nameKey: "catalog.detail.safety_cswdkz", field: "safety_cswdkz" },
        { nameKey: "catalog.detail.safety_cdplyj", field: "safety_cdplyj" },
        { nameKey: "catalog.detail.safety_zdsc", field: "safety_zdsc" },
        { nameKey: "catalog.detail.safety_pljstx", field: "safety_pljstx" },
        { nameKey: "catalog.detail.safety_qfpzyj", field: "safety_qfpzyj" },
        { nameKey: "catalog.detail.safety_dljyhj", field: "safety_dljyhj" },
        { nameKey: "catalog.detail.safety_hfpzyj", field: "safety_hfpzyj" },
        { nameKey: "catalog.detail.safety_kmyj", field: "safety_kmyj" },
        { nameKey: "catalog.detail.safety_xzjly", field: "safety_xzjly" },
      ],
    },

    // Управление
    {
      headerKey: "catalog.detail.control_group_title",
      params: [
        { nameKey: "catalog.detail.control_jsmsqh", field: "control_jsmsqh" },
        { nameKey: "catalog.detail.control_nlhsxt", field: "control_nlhsxt" },
        { nameKey: "catalog.detail.control_zdzc", field: "control_zdzc" },
        { nameKey: "catalog.detail.control_spfz", field: "control_spfz" },
        { nameKey: "catalog.detail.control_dphj", field: "control_dphj" },
        { nameKey: "catalog.detail.control_kbzxb", field: "control_kbzxb" },
        { nameKey: "catalog.detail.control_dtbms", field: "control_dtbms" },
        { nameKey: "catalog.detail.control_fdjtq", field: "control_fdjtq" },
      ],
    },

    // Ассистирующее оборудование
    {
      headerKey: "catalog.detail.assisted_hardware_group_title",
      params: [
        { nameKey: "catalog.detail.assisted_driving_hardware_zcld", field: "assisted_driving_hardware_zcld" },
        { nameKey: "catalog.detail.assisted_driving_hardware_jsfzyx", field: "assisted_driving_hardware_jsfzyx" },
        { nameKey: "catalog.detail.assisted_driving_hardware_sxtsl", field: "assisted_driving_hardware_sxtsl" },
        { nameKey: "catalog.detail.assisted_driving_hardware_tmdp", field: "assisted_driving_hardware_tmdp" },
      ],
    },

    // Функции ассистента
    {
      headerKey: "catalog.detail.assisted_feature_group_title",
      params: [
        { nameKey: "catalog.detail.assisted_driving_feature_yhxt", field: "assisted_driving_feature_yhxt" },
        { nameKey: "catalog.detail.assisted_driving_feature_fzjsdj", field: "assisted_driving_feature_fzjsdj" },
        { nameKey: "catalog.detail.assisted_driving_feature_dcccyj", field: "assisted_driving_feature_dcccyj" },
        { nameKey: "catalog.detail.assisted_driving_feature_wxdh", field: "assisted_driving_feature_wxdh" },
        { nameKey: "catalog.detail.assisted_driving_feature_dhlkxx", field: "assisted_driving_feature_dhlkxx" },
        { nameKey: "catalog.detail.assisted_driving_feature_bxfz", field: "assisted_driving_feature_bxfz" },
        { nameKey: "catalog.detail.assisted_driving_feature_cdbcfz", field: "assisted_driving_feature_cdbcfz" },
        { nameKey: "catalog.detail.assisted_driving_feature_cdjzbc", field: "assisted_driving_feature_cdjzbc" },
        { nameKey: "catalog.detail.assisted_driving_feature_ysxt", field: "assisted_driving_feature_ysxt" },
        { nameKey: "catalog.detail.assisted_driving_feature_fzjsxt", field: "assisted_driving_feature_fzjsxt" },
        { nameKey: "catalog.detail.assisted_driving_feature_dljtsb", field: "assisted_driving_feature_dljtsb" },
        { nameKey: "catalog.detail.assisted_driving_feature_ykbc", field: "assisted_driving_feature_ykbc" },
        { nameKey: "catalog.detail.assisted_driving_feature_zdbc", field: "assisted_driving_feature_zdbc" },
        { nameKey: "catalog.detail.assisted_driving_feature_yczh", field: "assisted_driving_feature_yczh" },
        { nameKey: "catalog.detail.assisted_driving_feature_zdjsfzld", field: "assisted_driving_feature_zdjsfzld" },
      ],
    },

    // Внешние
    {
      headerKey: "catalog.detail.external_group_title",
      params: [
        { nameKey: "catalog.detail.external_lqcz", field: "external_lqcz" },
        { nameKey: "catalog.detail.external_ddhbx", field: "external_ddhbx" },
        { nameKey: "catalog.detail.external_gyhbx", field: "external_gyhbx" },
        { nameKey: "catalog.detail.external_ddhbxwzjy", field: "external_ddhbxwzjy" },
        { nameKey: "catalog.detail.external_fdjdzfs", field: "external_fdjdzfs" },
        { nameKey: "catalog.detail.external_cnzks", field: "external_cnzks" },
        { nameKey: "catalog.detail.external_yslx", field: "external_yslx" },
        { nameKey: "catalog.detail.external_wysqd", field: "external_wysqd" },
        { nameKey: "catalog.detail.external_wysjr", field: "external_wysjr" },
        { nameKey: "catalog.detail.external_wksjcm", field: "external_wksjcm" },
        { nameKey: "catalog.detail.external_ycqd", field: "external_ycqd" },
        { nameKey: "catalog.detail.external_dcyjr", field: "external_dcyjr" },
        { nameKey: "catalog.detail.external_ydwgtj", field: "external_ydwgtj" },
        { nameKey: "catalog.detail.external_jqgs", field: "external_jqgs" },
        { nameKey: "catalog.detail.external_cdxlj", field: "external_cdxlj" },
        { nameKey: "catalog.detail.external_ddrlb", field: "external_ddrlb" },
        { nameKey: "catalog.detail.external_ddxhcm", field: "external_ddxhcm" },
        { nameKey: "catalog.detail.external_chmxs", field: "external_chmxs" },
        { nameKey: "catalog.detail.external_wmbldlkq", field: "external_wmbldlkq" },
        { nameKey: "catalog.detail.external_ddbs", field: "external_ddbs" },
        { nameKey: "catalog.detail.external_ccjtp", field: "external_ccjtp" },
        { nameKey: "catalog.detail.external_ddkttb", field: "external_ddkttb" },
      ],
    },

    // Освещение
    {
      headerKey: "catalog.detail.light_group_title",
      params: [
        { nameKey: "catalog.detail.light_jgdg", field: "light_jgdg" },
        { nameKey: "catalog.detail.light_ygdg", field: "light_ygdg" },
        { nameKey: "catalog.detail.light_dgts", field: "light_dgts" },
        { nameKey: "catalog.detail.light_ledrjxcd", field: "light_ledrjxcd" },
        { nameKey: "catalog.detail.light_zsyyjg", field: "light_zsyyjg" },
        { nameKey: "catalog.detail.light_zdtd", field: "light_zdtd" },
        { nameKey: "catalog.detail.light_cqwd", field: "light_cqwd" },
        { nameKey: "catalog.detail.light_qddyw", field: "light_qddyw" },
        { nameKey: "catalog.detail.light_ddgdkt", field: "light_ddgdkt" },
        { nameKey: "catalog.detail.light_ddqxzz", field: "light_ddqxzz" },
        { nameKey: "catalog.detail.light_ddycgb", field: "light_ddycgb" },
        { nameKey: "catalog.detail.light_zxfzd", field: "light_zxfzd" },
        { nameKey: "catalog.detail.light_zxtd", field: "light_zxtd" },
        { nameKey: "catalog.detail.light_cmsydd", field: "light_cmsydd" },
        { nameKey: "catalog.detail.light_cnhjfwd", field: "light_cnhjfwd" },
      ],
    },

    // Стёкла/зеркала
    {
      headerKey: "catalog.detail.glass_group_title",
      params: [
        { nameKey: "catalog.detail.glass_tclx", field: "glass_tclx" },
        { nameKey: "catalog.detail.glass_ddcc", field: "glass_ddcc" },
        { nameKey: "catalog.detail.glass_ccyjsj", field: "glass_ccyjsj" },
        { nameKey: "catalog.detail.glass_ccfjs", field: "glass_ccfjs" },
        { nameKey: "catalog.detail.glass_dcgybl", field: "glass_dcgybl" },
        { nameKey: "catalog.detail.glass_hfdzyl", field: "glass_hfdzyl" },
        { nameKey: "catalog.detail.glass_hpcczyl", field: "glass_hpcczyl" },
        { nameKey: "catalog.detail.glass_hpcysbl", field: "glass_hpcysbl" },
        { nameKey: "catalog.detail.glass_cnhzj", field: "glass_cnhzj" },
        { nameKey: "catalog.detail.glass_hys", field: "glass_hys" },
        { nameKey: "catalog.detail.glass_gyys", field: "glass_gyys" },
        { nameKey: "catalog.detail.glass_jrpzh", field: "glass_jrpzh" },
        { nameKey: "catalog.detail.glass_xktc", field: "glass_xktc" },
        { nameKey: "catalog.detail.glass_whsj", field: "glass_whsj" },
        { nameKey: "catalog.detail.glass_nhsj", field: "glass_nhsj" },
      ],
    },

    // Интерьер
    {
      headerKey: "catalog.detail.internal_group_title",
      params: [
        { nameKey: "catalog.detail.internal_fxpcz", field: "internal_fxpcz" },
        { nameKey: "catalog.detail.internal_fxpwztj", field: "internal_fxpwztj" },
        { nameKey: "catalog.detail.internal_hdxs", field: "internal_hdxs" },
        { nameKey: "catalog.detail.internal_dgnfxp", field: "internal_dgnfxp" },
        { nameKey: "catalog.detail.internal_fxphd", field: "internal_fxphd" },
        { nameKey: "catalog.detail.internal_fxpjr", field: "internal_fxpjr" },
        { nameKey: "catalog.detail.internal_fxpjy", field: "internal_fxpjy" },
        { nameKey: "catalog.detail.internal_xcdnpm", field: "internal_xcdnpm" },
        { nameKey: "catalog.detail.internal_qyjybp", field: "internal_qyjybp" },
        { nameKey: "catalog.detail.internal_yjybcc", field: "internal_yjybcc" },
        { nameKey: "catalog.detail.internal_hudttszxs", field: "internal_hudttszxs" },
      ],
    },

    // Система связи
    {
      headerKey: "catalog.detail.interconnect_group_title",
      params: [
        { nameKey: "catalog.detail.interconnect_system_zkcspm", field: "interconnect_system_zkcspm" },
        { nameKey: "catalog.detail.interconnect_system_zkpmcc", field: "interconnect_system_zkpmcc" },
        { nameKey: "catalog.detail.interconnect_system_zkxpmcc", field: "interconnect_system_zkxpmcc" },
        { nameKey: "catalog.detail.interconnect_system_lydh", field: "interconnect_system_lydh" },
        { nameKey: "catalog.detail.interconnect_system_dljyhj", field: "interconnect_system_dljyhj" },
        { nameKey: "catalog.detail.interconnect_system_zkyjp", field: "interconnect_system_zkyjp" },
        { nameKey: "catalog.detail.interconnect_system_sjhl", field: "interconnect_system_sjhl" },
        { nameKey: "catalog.detail.interconnect_system_yysb", field: "interconnect_system_yysb" },
        { nameKey: "catalog.detail.interconnect_system_zcznxt", field: "interconnect_system_zcznxt" },
        { nameKey: "catalog.detail.interconnect_system_sskz", field: "interconnect_system_sskz" },
        { nameKey: "catalog.detail.interconnect_system_mmsb", field: "interconnect_system_mmsb" },
        { nameKey: "catalog.detail.interconnect_system_fjylp", field: "interconnect_system_fjylp" },
        { nameKey: "catalog.detail.interconnect_system_czds", field: "interconnect_system_czds" },
        { nameKey: "catalog.detail.interconnect_system_hpyjpm", field: "interconnect_system_hpyjpm" },
        { nameKey: "catalog.detail.interconnect_system_hpkzdmt", field: "interconnect_system_hpkzdmt" },
        { nameKey: "catalog.detail.interconnect_system_czcd", field: "interconnect_system_czcd" },
        { nameKey: "catalog.detail.interconnect_system_clw", field: "interconnect_system_clw" },
        { nameKey: "catalog.detail.interconnect_system_otasj", field: "interconnect_system_otasj" },
        { nameKey: "catalog.detail.interconnect_system_appyckz", field: "interconnect_system_appyckz" },
        { nameKey: "catalog.detail.interconnect_system_wifi", field: "interconnect_system_wifi" },
        { nameKey: "catalog.detail.interconnect_system_zdjz", field: "interconnect_system_zdjz" },
      ],
    },

    // Мультимедиа
    {
      headerKey: "catalog.detail.multimedia_group_title",
      params: [
        { nameKey: "catalog.detail.multimedia_ysqpp", field: "multimedia_ysqpp" },
        { nameKey: "catalog.detail.multimedia_ysqsl", field: "multimedia_ysqsl" },
        { nameKey: "catalog.detail.multimedia_cdjk", field: "multimedia_cdjk" },
        { nameKey: "catalog.detail.multimedia_usbsl", field: "multimedia_usbsl" },
        { nameKey: "catalog.detail.multimedia_sjwxcd", field: "multimedia_sjwxcd" },
        { nameKey: "catalog.detail.multimedia_power_220dy", field: "multimedia_power_220dy" },
        { nameKey: "catalog.detail.multimedia_xlxdy", field: "multimedia_xlxdy" },
      ],
    },

    // Сиденья
    {
      headerKey: "catalog.detail.seat_group_title",
      params: [
        { nameKey: "catalog.detail.seat_zycz", field: "seat_zycz" },
        { nameKey: "catalog.detail.seat_ydfgzy", field: "seat_ydfgzy" },
        { nameKey: "catalog.detail.seat_zzytjfs", field: "seat_zzytjfs" },
        { nameKey: "catalog.detail.seat_fzytjfs", field: "seat_fzytjfs" },
        { nameKey: "catalog.detail.seat_ddzytj", field: "seat_ddzytj" },
        { nameKey: "catalog.detail.seat_qpzygn", field: "seat_qpzygn" },
        { nameKey: "catalog.detail.seat_ddzyjy", field: "seat_ddzyjy" },
        { nameKey: "catalog.detail.seat_fjshptj", field: "seat_fjshptj" },
        { nameKey: "catalog.detail.seat_depzytj", field: "seat_depzytj" },
        { nameKey: "catalog.detail.seat_hpzyddtj", field: "seat_hpzyddtj" },
        { nameKey: "catalog.detail.seat_hpzygn", field: "seat_hpzygn" },
        { nameKey: "catalog.detail.seat_hpxzb", field: "seat_hpxzb" },
        { nameKey: "catalog.detail.seat_depdlzy", field: "seat_depdlzy" },
        { nameKey: "catalog.detail.seat_zybj", field: "seat_zybj" },
        { nameKey: "catalog.detail.seat_hpzydfxs", field: "seat_hpzydfxs" },
        { nameKey: "catalog.detail.seat_hpzyddfd", field: "seat_hpzyddfd" },
        { nameKey: "catalog.detail.seat_qhzyfs", field: "seat_qhzyfs" },
        { nameKey: "catalog.detail.seat_hpbj", field: "seat_hpbj" },
        { nameKey: "catalog.detail.seat_jrbj", field: "seat_jrbj" },
      ],
    },

    // Климат / холодильник
    {
      headerKey: "catalog.detail.fridge_group_title",
      params: [
        { nameKey: "catalog.detail.fridge_ktwdkz", field: "fridge_ktwdkz" },
        { nameKey: "catalog.detail.fridge_hpdlkt", field: "fridge_hpdlkt" },
        { nameKey: "catalog.detail.fridge_hzcfk", field: "fridge_hzcfk" },
        { nameKey: "catalog.detail.fridge_wdfqkz", field: "fridge_wdfqkz" },
        { nameKey: "catalog.detail.fridge_czkqjhq", field: "fridge_czkqjhq" },
        { nameKey: "catalog.detail.fridge_pm25zz", field: "fridge_pm25zz" },
        { nameKey: "catalog.detail.fridge_flzfsq", field: "fridge_flzfsq" },
        { nameKey: "catalog.detail.fridge_cnxfzz", field: "fridge_cnxfzz" },
        { nameKey: "catalog.detail.fridge_czbx", field: "fridge_czbx" },
      ],
    },
  ]

  const res: any[] = []
  groups.forEach((g) => {
    if (g.headerKey) {
      res.push({ name: "group_header", value: t(g.headerKey) })
    }
    g.params.forEach((p) => {
      let value
      if (p.getter) {
        value = p.getter(car, t)
      }
      else if (p.field) {
        value = car[p.field]
      }
      if (p.dictKey && value) {
        value = translateIfExists(p.dictKey, value)
      }
      if (p.unitKey && value) {
        value = formatUnit(value, t(p.unitKey))
      }
      if (value) {
        res.push({ name: t(p.nameKey), value, nameKey: p.nameKey })
      }
    })
  })
  return res
}

const filteredParams = computed(() => {
  if (!carDetails.value) {
    return []
  }
  return buildParams(carDetails.value, t)
})

const displayedParams = computed(() => {
  if (props.showAll || expanded.value) {
    return filteredParams.value
  }
  return filteredParams.value.slice(0, 10)
})

const toggleExpand = () => {
  expanded.value = !expanded.value
}

const formatValue = (value: unknown): string => {
  if (value == null) {
    return "—"
  }
  const str = String(value).trim()
  if (/^○$/.test(str)) {
    return t("catalog.detail.option_word")
  }
  return str || "—"
}

const hasBullets = (value: unknown): boolean => {
  return value != null && String(value).includes("●")
}

const bulletParts = (value: unknown): string[] => {
  if (value == null) {
    return []
  }
  const str = String(value)
  return str
    .split("●")
    .map((s) => {
      const trimmed = s.trim()
      if (!trimmed) {
        return ""
      }
      if (/^○$/.test(trimmed)) {
        return t("catalog.detail.option_word")
      }
      return trimmed
    })
    .filter(Boolean)
}
</script>

<style module>
.loading {
  @apply text-gray-500 text-sm py-4 text-center;
}

.noData {
  @apply text-gray-400 text-sm py-4 text-center;
}

.paramsGrid {
  @apply flex flex-col gap-3;
}

.paramRow {
  @apply flex flex-row;
}

@media (max-width: 640px) {
  .paramRow {
    @apply flex-col gap-1;
  }

  .paramName,
  .paramValue {
    @apply w-full;
  }
}

.groupHeader {
  @apply mt-4 mb-2;
}

.groupTitle {
  @apply font-bold text-base text-gray-800 border-b border-gray-300 pb-1 w-full;
  word-break: break-word;
}

.paramName {
  @apply text-gray-600 text-sm w-1/2 text-left;
  word-break: break-word;
}

.paramValue {
  @apply text-gray-900 text-sm font-medium w-1/2 text-left;
  word-break: break-word;
}

.expandBtn {
  @apply flex items-center mt-4 text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors;
}

.expandIcon {
  @apply w-4 h-4 ml-2 transition-transform;
}

.rotated {
  @apply rotate-180;
}

.checkIcon {
  @apply w-5 h-5 text-green-500 inline-block mr-1 flex-none shrink-0 align-middle;
}

.editableTrigger {
  @apply flex items-start gap-2 text-left bg-transparent border-none p-0 cursor-pointer outline-none;
}

.editableText {
  @apply underline decoration-dashed decoration-gray-400 underline-offset-4 transition-colors duration-200 group-hover:decoration-blue group-hover:text-blue;
}

.editIcon {
  @apply w-4 h-4 mt-0.5 text-gray-400 transition-colors duration-200 group-hover:text-blue flex-shrink-0;
}

.popoverWrapper {
  @apply relative inline-flex items-center;
}

.editIcon {
  @apply w-4 h-4;
}

.popoverPanel {
  @apply absolute left-0 top-full mt-2 z-50 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 p-2;
  min-width: 380px;
}

.editPopoverBody {
  @apply flex items-center gap-2 w-full;
}

.editPopoverInputWrapper {
  @apply flex-1;
}

.editPopoverInputWrapper :global(input) {
  @apply py-1.5 text-sm;
}

.editPopoverActions {
  @apply flex items-center gap-2 flex-shrink-0;
}
</style>
