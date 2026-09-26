<template>
  <div :class="$style.accordionItem">
    <Disclosure v-slot="{ open }">
      <DisclosureButton :class="[$style.accordionHeader, open ? $style.accordionHeaderOpen : '']">
        <div :class="$style.headerLeft">
          <div @click.stop>
            <CheckBox v-model="selected" />
          </div>
          <div :class="$style.headerText">
            <h3 :class="$style.carTitle">
              {{ item.brandName }} {{ item.modelName }} {{ item.name }}
            </h3>

            <p :class="$style.carSubtitle">
              {{ item.year || '-' }}
              <template v-if="item.displacement">
                &middot; {{ item.displacement }} {{ t('units.l') }}
              </template>
            </p>
          </div>
        </div>

        <div :class="$style.headerRight">
          <EyeSlashIcon
            v-if="!visible"
            :class="$style.hiddenIcon"
            aria-hidden="true"
          />
          <ChevronDownIcon
            :class="[$style.chevronIcon, open && 'rotate-180 transform']"
            aria-hidden="true"
          />
        </div>
      </DisclosureButton>

      <transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-75 ease-out"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <DisclosurePanel :class="$style.accordionContent">
          <div :class="$style.switchRow">
            <span :class="$style.switchLabel">{{ t('admin_brands.completion.show_on_site') }}</span>
            <Switch
              v-model="visible"
              :class="[$style.switchBase, visible ? $style.switchActive : '']"
            >
              <span
                aria-hidden="true"
                :class="[$style.switchThumb, visible ? $style.switchThumbActive : '']"
              />
            </Switch>
          </div>
          <CarParams
            v-if="open"
            :car-id="item.id"
            :show-all="false"
            can-edit-equipment
            @update:equipment-name="handleEquipmentNameUpdate"
          />
        </DisclosurePanel>
      </transition>
    </Disclosure>
  </div>
</template>

<script setup lang="ts">
import { ChevronDownIcon, EyeSlashIcon } from "@heroicons/vue/24/outline"
import { Disclosure, DisclosureButton, DisclosurePanel, Switch } from "@headlessui/vue"
import CheckBox from "@/components/form/CheckBox.vue"
import type { CarCompletion } from "~/types/common/adminCars"
import CarParams from "@/components/needs/CarParams.vue"

interface Props {
  item: CarCompletion
}

defineProps<Props>()

const selected = defineModel<boolean>("selected", { default: false })
const visible = defineModel<boolean>("visible", { required: true })

const emit = defineEmits<{
  (e: "update:name", id: number, newName: string): void
}>()

const { t } = useI18n()

async function handleEquipmentNameUpdate(id: number, newName: string) {
  emit("update:name", id, newName)
}
</script>

<style module>
.accordionItem {
  @apply border border-gray-200 rounded-lg overflow-hidden;
}

.accordionHeader {
  @apply flex w-full justify-between items-center bg-white px-4 py-3 text-left transition-colors duration-200;
}

.accordionHeader:hover {
  @apply bg-gray-50;
}

.accordionHeaderOpen {
  @apply border-b border-gray-200;
}

.headerLeft {
  @apply flex items-center gap-4;
}

.headerText {
  @apply flex flex-col;
}

.carTitle {
  @apply text-base font-medium text-gray-900;
}

.carSubtitle {
  @apply text-sm text-gray-500;
}

.headerRight {
  @apply flex items-center gap-4;
}

.hiddenIcon {
  @apply w-5 h-5 text-gray-400;
}

.chevronIcon {
  @apply w-5 h-5 text-gray-500 transition-transform duration-200;
}

.accordionContent {
  @apply px-4 py-4 bg-gray-50 text-sm text-gray-500;
}

.switchRow {
  @apply flex items-center gap-3 mb-6;
}

.switchLabel {
  @apply text-sm text-gray-700 font-medium;
}

.switchBase {
  @apply relative inline-flex h-6 w-11 items-center rounded-full bg-white border border-gray-300 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2;
}

.switchActive {
  @apply bg-blue border-blue;
}

.switchThumb {
  @apply inline-block h-4 w-4 transform rounded-full bg-gray-400 transition;
  transform: translateX(2px);
}

.switchThumbActive {
  @apply bg-white translate-x-6;
}
</style>
