<template>
  <Dialog
    :class="$style.sidebar"
    :open="sidebarStore.show"
    @close="sidebarStore.show = false"
  >
    <div :class="$style.sidebarInset" />
    <DialogPanel :class="$style.sidebarNavigation">
      <div :class="$style.sidebarLogo">
        <NuxtLink
          :to="{ name: 'index' }"
          :class="$style.logoLink"
          @click="sidebarStore.show = false"
        >
          <span class="sr-only">{{ t('about.name') }}</span>
          <img
            :class="$style.logo"
            src="/logo.svg"
            :alt="t('about.name')"
          >
        </NuxtLink>
        <button
          type="button"
          :class="$style.btnMobile"
          @click="sidebarStore.show = false"
        >
          <span class="sr-only">Close menu</span>
          <XMarkIcon
            :class="$style.btnMobileIcon"
            aria-hidden="true"
          />
        </button>
      </div>
      <div :class="$style.sidebarMenu">
        <div :class="$style.menu">
          <div
            v-for="item in visibleTopNavigation"
            :key="item.name"
            :class="$style.menuSection"
          >
            <div
              v-if="item.children && item.children.length > 0"
              :class="$style.accordionItem"
            >
              <button
                :class="[
                  $style.menuItem,
                  $style.menuItemParent,
                  { [$style.menuItemCurrent]: isItemGroupCurrent(item) },
                ]"
                @click="toggleAccordion(item.name)"
              >
                <span>
                  <template v-if="typeof item.label === 'object'">
                    {{ t(item.label.key) }}
                    <Badge
                      :value="item.label.count || 0"
                      class="ml-1"
                    />
                  </template>
                  <template v-else>
                    {{ t(item.label ?? `navigation.${item.name}`) }}
                  </template>
                </span>
                <ChevronDownIcon
                  :class="[
                    $style.accordionIcon,
                    openItems.includes(item.name) && $style.accordionIconOpen,
                  ]"
                />
              </button>
              <div
                v-show="openItems.includes(item.name)"
                :class="$style.accordionContent"
              >
                <NuxtLink
                  v-for="child in item.children"
                  :key="child.name"
                  :to="{ name: child.name }"
                  :class="[
                    $style.menuItem,
                    $style.menuItemChild,
                    { [$style.menuItemCurrent]: current(child) },
                  ]"
                  @click="sidebarStore.show = false"
                >
                  <span>
                    <template v-if="typeof child.label === 'object'">
                      {{ t(child.label.key) }}
                      <Badge
                        :value="child.label.count || 0"
                        class="ml-1"
                      />
                    </template>
                    <template v-else>
                      {{ t(child.label ?? `navigation.${child.name}`) }}
                    </template>
                  </span>
                </NuxtLink>
              </div>
            </div>
            <NuxtLink
              v-else
              :to="{ name: item.name }"
              :class="[
                $style.menuItem,
                { [$style.menuItemCurrent]: current(item) },
              ]"
              @click="sidebarStore.show = false"
            >
              <span>
                <template v-if="typeof item.label === 'object'">
                  {{ t(item.label.key) }}
                  <Badge
                    :value="item.label.count || 0"
                    class="ml-1"
                  />

                </template>
                <template v-else>
                  {{ t(item.label ?? `navigation.${item.name}`) }}
                </template>
              </span>
            </NuxtLink>
          </div>

          <div :class="$style.menuSection">
            <NuxtLink
              v-for="item in personalProfileNavigation"
              :key="item.name"
              :to="{ name: item.name }"
              :class="[
                $style.menuItem,
                { [$style.menuItemCurrent]: current(item) },
              ]"
              @click="sidebarStore.show = false"
            >
              {{ t(`navigation.${item.name}`) }}
            </NuxtLink>
          </div>

          <div :class="[$style.menuSection, $style.langSection]">
            <div :class="$style.langWrapper">
              <LanguageDropdown />
            </div>
          </div>

          <div :class="$style.menuSection">
            <NuxtLink
              :class="$style.menuItem"
              @click="sidebarStore.show = false; signOut()"
            >
              {{ t('navigation.personal-logout') }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </DialogPanel>
  </Dialog>
</template>

<script setup lang="ts">
import { Dialog, DialogPanel } from "@headlessui/vue"
import { XMarkIcon, ChevronDownIcon } from "@heroicons/vue/24/outline"
import { computed, ref, unref } from "vue"
import type { NavigationItem } from "@/types/common/navigation"
import LanguageDropdown from "~/components/common/LanguageDropdown.vue"
import Badge from "@/components/common/Badge.vue"

const { t } = useI18n()
const sidebarStore = useSidebarStore()
const { personalTopNavigation, personalProfileNavigation, current, checkPermission } = useNavigation()
const { signOut } = useAuth()

const visibleTopNavigation = computed<Array<NavigationItem>>(() => {
  const nav = unref(personalTopNavigation)
  return nav
    .map(item => ({
      ...item,
      children: item.children?.filter(child => checkPermission(child)),
    }))
    .filter(item => (item.children ? item.children.length > 0 : checkPermission(item)))
})

const isItemGroupCurrent = (item: NavigationItem) => {
  if (!item.children || item.children.length === 0) {
    return current(item)
  }
  return current(item) || item.children.some(child => current(child))
}

const openItems = ref<string[]>([])

const toggleAccordion = (name: string) => {
  if (openItems.value.includes(name)) {
    openItems.value = openItems.value.filter(i => i !== name)
  }
  else {
    openItems.value = [...openItems.value, name]
  }
}
</script>

<style module>
.sidebar {
  @apply xl:hidden;
}
.sidebarInset {
  @apply fixed inset-0 z-10;
}
.sidebarNavigation {
  @apply fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10;
}
.sidebarLogo {
  @apply flex items-center justify-between;
}
.logoLink {
  @apply -m-1.5 p-1.5;
}
.logo {
  @apply h-7 w-auto;
}
.btnMobile {
  @apply -m-2.5 rounded-md p-2.5 text-gray-700;
}
.btnMobileIcon {
  @apply size-6;
}
.sidebarMenu {
  @apply mt-6 flow-root;
}
.menu {
  @apply -my-6 divide-y divide-gray-500/10;
}
.menuSection {
  @apply space-y-2 py-6;
}
.accordionItem {
  @apply space-y-0;
}
.menuItemParent {
  @apply w-full text-left flex items-center justify-between px-3 py-2 rounded-lg font-semibold text-gray-900 hover:bg-gray-50;
}
.accordionIcon {
  @apply size-4 text-gray-400 flex-shrink-0 ml-2 transition-transform duration-200;
}
.accordionIconOpen {
  @apply rotate-180;
}
.accordionContent {
  @apply mt-1 space-y-1 pl-6;
}
.menuItemChild {
  @apply block px-3 py-2 text-sm font-semibold text-gray-900 rounded-lg hover:bg-gray-50;
}
.menuItem {
  @apply -mx-3 px-3 py-2 rounded-lg font-semibold text-gray-900 hover:bg-gray-50 whitespace-nowrap flex items-center;
}
.menuItemCurrent {
  @apply text-primary-600;
}
.langSection {
  @apply py-6;
  padding-left: 0 !important;
  padding-right: 0 !important;
}

.langWrapper {
  @apply w-full;
  margin: 0;
  padding: 0;
}
</style>
