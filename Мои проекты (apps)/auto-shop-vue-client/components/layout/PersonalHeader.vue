<template>
  <header :class="$style.header">
    <div :class="$style.headerContent">
      <nav
        :class="$style.navigation"
        aria-label="Global"
      >
        <NuxtLink
          :to="{ name: 'personal' }"
          :class="$style.logoLink"
        >
          <span class="sr-only">{{ t('about.name') }}</span>
          <img
            :class="$style.logo"
            src="/logo.svg"
            :alt="t('about.name')"
          >
        </NuxtLink>

        <div
          v-if="userStore.isAuthenticated"
          :class="$style.btnMobileWrap"
        >
          <button
            type="button"
            :class="$style.btnMobile"
            @click="sidebarStore.show = true"
          >
            <span class="sr-only">Open main menu</span>
            <Bars3Icon
              :class="$style.btnMobileIcon"
              aria-hidden="true"
            />
          </button>
        </div>

        <div
          v-if="userStore.isAuthenticated"
          ref="navAreaRef"
          :class="$style.navArea"
        >
          <PopoverGroup :class="$style.navItems">
            <Popover
              v-for="item in visibleItems"
              :key="item.name"
              v-slot="{ open, close }"
              :class="$style.menuItem"
            >
              <PopoverButton
                v-if="item.children"
                :class="[
                  $style.navButton,
                  { [$style.navButtonActive]: current(item) },
                ]"
                @mouseenter="onHoverOpen($event, open)"
                @mouseleave="onHoverLeave(close)"
              >
                <LayoutPersonalHeaderNavLabel :item="item" />
                <ChevronDownIcon
                  :class="$style.menuChevronDown"
                  aria-hidden="true"
                />
              </PopoverButton>
              <PopoverButton
                v-else
                as="template"
              >
                <NuxtLink
                  :to="{ name: item.name }"
                  :class="[
                    $style.navButton,
                    { [$style.navButtonActive]: current(item) },
                  ]"
                >
                  <LayoutPersonalHeaderNavLabel :item="item" />
                </NuxtLink>
              </PopoverButton>

              <transition
                enter-active-class="transition ease-out duration-200"
                enter-from-class="opacity-0 translate-y-1"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition ease-in duration-150"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 translate-y-1"
              >
                <PopoverPanel
                  v-if="item.children"
                  :class="$style.menuPanel"
                  @mouseenter="onPanelEnter"
                  @mouseleave="onPanelLeave(close)"
                >
                  <div
                    v-for="subItem in item.children"
                    :key="subItem.name"
                    :class="[$style.menuPanelItem, 'group']"
                  >
                    <NuxtLink
                      :to="{ name: subItem.name }"
                      :class="[
                        $style.menuLink,
                        { [$style.menuLinkActive]: current({ name: subItem.name }) },
                      ]"
                    >
                      <LayoutPersonalHeaderNavLabel :item="subItem" />
                      <span class="absolute inset-0" />
                    </NuxtLink>
                  </div>
                </PopoverPanel>
              </transition>
            </Popover>
          </PopoverGroup>

          <Menu
            v-if="hiddenItems.length > 0"
            v-slot="{ open, close }"
            as="div"
            :class="$style.menuItem"
          >
            <MenuButton
              :class="[
                $style.moreButton,
                { [$style.moreButtonOpen]: open || isMoreActive },
              ]"
            >
              {{ t('navigation.more') }}
              <ChevronDownIcon
                :class="[$style.menuChevronDown, { [$style.menuChevronDownOpen]: open }]"
                aria-hidden="true"
              />
            </MenuButton>
            <transition
              enter-active-class="transition ease-out duration-200"
              enter-from-class="opacity-0 translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition ease-in duration-150"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 translate-y-1"
            >
              <MenuItems :class="$style.morePanel">
                <template
                  v-for="item in hiddenItems"
                  :key="item.name"
                >
                  <template v-if="item.children?.length">
                    <div :class="$style.moreGroupLabel">
                      <LayoutPersonalHeaderNavLabel :item="item" />
                    </div>
                    <MenuItem
                      v-for="subItem in item.children"
                      :key="subItem.name"
                      v-slot="{ active }"
                    >
                      <NuxtLink
                        :to="{ name: subItem.name }"
                        :class="[
                          $style.moreLink,
                          { [$style.moreLinkActive]: active || current(subItem) },
                        ]"
                        @click="close()"
                      >
                        <LayoutPersonalHeaderNavLabel :item="subItem" />
                      </NuxtLink>
                    </MenuItem>
                  </template>
                  <MenuItem
                    v-else
                    v-slot="{ active }"
                  >
                    <NuxtLink
                      :to="{ name: item.name }"
                      :class="[
                        $style.moreLink,
                        { [$style.moreLinkActive]: active || current(item) },
                      ]"
                      @click="close()"
                    >
                      <LayoutPersonalHeaderNavLabel :item="item" />
                    </NuxtLink>
                  </MenuItem>
                </template>
              </MenuItems>
            </transition>
          </Menu>

          <div
            ref="measureRef"
            :class="$style.measure"
            aria-hidden="true"
          >
            <span
              v-for="item in visibleTopNavigation"
              :key="item.name"
              :class="$style.navButton"
              tabindex="-1"
            >
              <LayoutPersonalHeaderNavLabel :item="item" />
              <ChevronDownIcon
                v-if="item.children"
                :class="$style.menuChevronDown"
                aria-hidden="true"
              />
            </span>
            <span
              :class="$style.moreButton"
              tabindex="-1"
            >
              {{ t('navigation.more') }}
              <ChevronDownIcon
                :class="$style.menuChevronDown"
                aria-hidden="true"
              />
            </span>
          </div>
        </div>

        <PopoverGroup :class="userStore.isAuthenticated ? $style.menu : $style.menuGuest">
          <LanguageDropdown />
          <NotificationDropdown v-if="userStore.canViewNotifications" />
          <Popover
            v-if="userStore.isAuthenticated"
            v-slot="{ open, close }"
            :class="$style.menuItem"
          >
            <PopoverButton
              :class="[$style.profileButton, 'group flex items-center']"
              @mouseenter="onHoverOpen($event, open)"
              @mouseleave="onHoverLeave(close)"
            >
              <span :class="$style.avatarWrapper">
                <svg
                  :class="$style.avatarSvg"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="12"
                    cy="9"
                    r="3"
                    stroke="black"
                    stroke-width="1.5"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="none"
                    stroke-width="1.5"
                  />
                  <path
                    d="M17.9691 20C17.81 17.1085 16.9247 15 11.9999 15C7.07521 15 6.18991 17.1085 6.03076 20"
                    stroke="black"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </svg>
              </span>
              <svg
                :class="[$style.arrowSvg, { [$style.arrowSvgOpen]: open }]"
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
            </PopoverButton>
            <transition
              enter-active-class="transition ease-out duration-200"
              enter-from-class="opacity-0 translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition ease-in duration-150"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 translate-y-1"
            >
              <PopoverPanel
                :class="$style.menuPanelPersonal"
                @mouseenter="onPanelEnter"
                @mouseleave="onPanelLeave(close)"
              >
                <NuxtLink
                  v-for="item in personalProfileNavigation"
                  :key="item.name"
                  :to="{ name: item.name }"
                  :class="[
                    $style.menuLinkPersonal,
                    { [$style.menuLinkPersonalActive]: current(item) },
                  ]"
                >
                  {{ t(`navigation.${item.name}`) }}
                </NuxtLink>
                <NuxtLink
                  :class="$style.menuLinkPersonal"
                  @click="signOut()"
                >
                  {{ t('navigation.personal-logout') }}
                </NuxtLink>
              </PopoverPanel>
            </transition>
          </Popover>

          <div
            v-else
            :class="$style.guestActions"
          >
            <NuxtLink
              :to="loginPage"
              :class="[$style.guestLogin, $style.guestLoginWide]"
            >
              {{ t('navigation.personal-login') }}
            </NuxtLink>
            <NuxtLink
              :to="registerPage"
              :class="$style.guestRegister"
            >
              {{ t('catalog.detail.register_action') }}
            </NuxtLink>
          </div>
        </PopoverGroup>
      </nav>
    </div>
    <LayoutPersonalSidebarMobile v-if="userStore.isAuthenticated" />
  </header>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems, Popover, PopoverButton, PopoverGroup, PopoverPanel } from "@headlessui/vue"
import { Bars3Icon, ChevronDownIcon } from "@heroicons/vue/24/outline"
import { computed, ref, unref } from "vue"
import { useUserStore } from "@/stores/user"
import { loginPage, registerPage } from "@/constants/pages"
import LanguageDropdown from "~/components/common/LanguageDropdown.vue"
import NotificationDropdown from "~/components/common/NotificationDropdown.vue"
import LayoutPersonalSidebarMobile from "@/components/layout/PersonalSidebarMobile.vue"
import LayoutPersonalHeaderNavLabel from "@/components/layout/PersonalHeaderNavLabel.vue"
import { useNavigation } from "@/composables/useNavigation"
import { useOverflowNavigation } from "@/composables/useOverflowNavigation"

const { t } = useI18n()
const sidebarStore = useSidebarStore()
const userStore = useUserStore()
const { signOut } = useAuth()
const { personalTopNavigation, personalProfileNavigation, current, checkPermission } = useNavigation()

const visibleTopNavigation = computed(() => {
  const nav = unref(personalTopNavigation)
  return nav
    .map(item => ({
      ...item,
      children: item.children?.filter(child => checkPermission(child)),
    }))
    .filter(item => (item.children ? item.children.length > 0 : checkPermission(item)))
})

const navAreaRef = ref<HTMLElement | null>(null)
const measureRef = ref<HTMLElement | null>(null)

const { visibleItems, hiddenItems } = useOverflowNavigation(
  visibleTopNavigation,
  navAreaRef,
  measureRef,
)

const isMoreActive = computed(() => hiddenItems.value.some(item => current(item)))

const hoverState = ref<{ closeTimeout: number | null, insidePanel: boolean }>({
  closeTimeout: null,
  insidePanel: false,
})

const clearCloseTimeout = () => {
  if (hoverState.value.closeTimeout) {
    clearTimeout(hoverState.value.closeTimeout as unknown as number)
    hoverState.value.closeTimeout = null
  }
}

const onHoverOpen = (e: MouseEvent, open: boolean) => {
  clearCloseTimeout()
  if (!open) {
    const btn = (e.currentTarget || e.target) as HTMLElement
    btn.click()
  }
}

const onHoverLeave = (close: () => void) => {
  clearCloseTimeout()
  hoverState.value.closeTimeout = window.setTimeout(() => {
    if (!hoverState.value.insidePanel) {
      close()
    }
  }, 120)
}

const onPanelEnter = () => {
  hoverState.value.insidePanel = true
  clearCloseTimeout()
}

const onPanelLeave = (close: () => void) => {
  hoverState.value.insidePanel = false
  onHoverLeave(close)
}
</script>

<style module>
.header {
  @apply relative z-20 bg-white;
}
.headerContent {
  @apply mx-auto px-6 lg:px-8;
}
.navigation {
  @apply relative py-3 flex items-center gap-3 border-b border-gray-900/10;
}
.logoLink {
  @apply -m-1.5 p-1.5 flex items-center flex-shrink-0;
}
.logo {
  @apply h-7 w-auto;
}
.btnMobileWrap {
  @apply flex lg:hidden ml-auto;
}
.btnMobile {
  @apply -m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700;
}
.btnMobileIcon {
  @apply size-6;
}
.navArea {
  @apply hidden lg:flex min-w-0 flex-1 items-center gap-1 relative justify-end;
}
.navItems {
  @apply flex min-w-0 items-center gap-1 overflow-hidden;
}
.measure {
  @apply pointer-events-none absolute -left-[9999px] -top-[9999px] flex items-center gap-1;
}
.menu {
  @apply hidden lg:flex lg:gap-x-4 items-center flex-shrink-0 ml-auto;
}
.menuGuest {
  @apply flex gap-x-3 lg:gap-x-4 items-center flex-shrink-0 ml-auto;
}
.menuItem {
  @apply relative flex-shrink-0;
}
.navButton {
  @apply inline-flex items-center gap-x-1 whitespace-nowrap rounded-[9px] px-3 py-1.5 text-sm text-gray-900/85 transition-colors hover:bg-gray-100 outline-none;
}
.navButtonActive {
  @apply bg-gray-100 text-gray-900;
}
.moreButton {
  @apply inline-flex items-center gap-1 whitespace-nowrap rounded-[9px] px-3 py-1.5 text-sm font-semibold text-gray-900/85 transition-colors hover:bg-gray-100 outline-none;
}
.moreButtonOpen {
  @apply bg-gray-100 text-gray-900;
}
.morePanel {
  @apply absolute right-0 top-full z-50 mt-2 min-w-[12rem] rounded-[9px] border border-gray-200 bg-white p-1.5 shadow-lg outline-none;
}
.moreLink {
  @apply flex w-full items-center rounded-[9px] px-3 py-2 text-left text-sm text-gray-900/85 transition-colors hover:bg-gray-100;
}
.moreLinkActive {
  @apply bg-gray-100 text-gray-900;
}
.moreGroupLabel {
  @apply px-3 py-1.5 text-xs font-semibold text-gray-500;
}
.profileButton {
  @apply flex items-center gap-x-1 rounded-[9px] text-sm/6 font-semibold text-gray-900 hover:bg-gray-100 outline-none px-2 py-1 whitespace-nowrap transition-colors;
}
.menuPanel {
  @apply absolute left-0 top-full z-10 mt-2 w-72 max-w-max rounded-[9px] bg-white p-2 shadow-lg ring-1 ring-gray-900/5;
}
.menuPanelPersonal {
  @apply absolute right-0 top-full z-10 mt-3 w-56 rounded-[9px] bg-white p-2 shadow-lg ring-1 ring-gray-900/5;
}
.menuLink {
  @apply block font-semibold text-gray-900;
}
.menuLinkActive {
  @apply bg-gray-100 font-semibold text-primary-600;
}
.menuPanelItem {
  @apply relative rounded-lg px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50;
}
.menuLinkPersonal {
  @apply cursor-pointer block rounded-lg px-3 py-2 text-sm/6 font-semibold text-gray-900 hover:bg-gray-50;
}
.menuLinkPersonalActive {
  @apply bg-gray-100 text-primary-600;
}
.arrowSvg {
  @apply ml-1 size-4 text-black transition-transform duration-200;
}
.arrowSvgOpen {
  @apply rotate-180;
}
.avatarWrapper {
  @apply inline-flex items-center justify-center size-10 rounded-full bg-gray-200;
}
.avatarSvg {
  @apply size-6;
}
.menuChevronDown {
  @apply size-4 flex-none text-gray-400 transition-transform duration-200;
}
.menuChevronDownOpen {
  @apply rotate-180;
}
.guestActions {
  @apply flex items-center gap-2 sm:gap-3;
}
.guestLogin {
  @apply text-sm font-medium text-gray-700 hover:text-black whitespace-nowrap;
}
.guestLoginWide {
  @apply hidden sm:inline;
}
.guestRegister {
  @apply text-xs sm:text-sm font-medium rounded-md bg-black text-white px-2.5 py-1.5 sm:px-3 sm:py-2 hover:bg-gray-800 whitespace-nowrap;
}
</style>
