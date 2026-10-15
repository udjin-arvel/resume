<template>
  <Menu
    as="div"
    :class="$style.language"
  >
    <div class="relative inline-block text-left">
      <MenuButton
        :class="$style.dropdownButton"
        class="group"
      >
        {{ langLabels[selectedLanguage] }}
      </MenuButton>

      <transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <MenuItems :class="$style.dropdownMenu">
          <MenuItem
            v-for="lang in supportedLanguages"
            :key="lang"
            v-slot="{ active }"
            :class="$style.dropdownItem"
          >
            <button
              type="button"
              :class="[$style.dropdownItemBtn, { [$style.dropdownItemBtnActive]: active }]"
              @click="setLang(lang)"
            >
              {{ langLabels[lang] }}
            </button>
          </MenuItem>
        </MenuItems>
      </transition>
    </div>

    <MenuButton :class="[$style.arrowIcon, 'group']">
      <svg
        :class="$style.arrowSvg"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </MenuButton>
  </Menu>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue"
import { useLanguageStore } from "~/stores/language"
import { russian, chinese } from "~/constants/lang"
import type { Language } from "@/types/common/lang"
import useUser from "~/composables/useUser"

const { t } = useI18n()
const languageStore = useLanguageStore()
const { setLanguage: syncUserLanguage } = useUser()

const selectedLanguage = computed(() => languageStore.selectedLanguage)

const langLabels = computed(() => ({
  [russian]: t("common.lang_ru"),
  [chinese]: t("common.lang_zh"),
}))

const supportedLanguages = [russian, chinese] as const

async function setLang(lang: Language) {
  languageStore.setLanguage(lang)

  await syncUserLanguage(lang)

  window.location.reload()
}
</script>

<style module>
.language {
  @apply flex items-center space-x-2;
}

.dropdownButton {
  @apply appearance-none text-sm font-medium px-2 py-1 rounded-lg focus:outline-none cursor-pointer flex items-center transition-colors duration-200 border border-transparent bg-gray-800 text-white;
}

.dropdownButton:hover {
  @apply bg-white text-gray-900 border-black;
}

.dropdownMenu {
  @apply absolute left-0 lg:right-0 lg:left-auto z-50 mt-1 w-32 px-3 py-2 origin-top-left lg:origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5;
}

.dropdownItem {
  @apply cursor-pointer block rounded-lg;
}

.dropdownItemBtn {
  @apply w-full text-left px-3 py-2 text-sm/6 font-semibold text-gray-900 hover:bg-gray-50;
}

.dropdownItemBtnActive {
  @apply bg-gray-50;
}

.arrowIcon {
  @apply w-4 h-4 ml-1 text-gray-800 cursor-pointer flex items-center justify-center;
}

.arrowSvg {
  @apply w-4 h-4 transition-transform duration-200 group-hover:rotate-180;
}

.arrowSvg[data-headlessui-state~='open'] {
  @apply rotate-180;
}
</style>
