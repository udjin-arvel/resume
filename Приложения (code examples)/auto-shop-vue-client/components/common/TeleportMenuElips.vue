<template>
  <Menu
    v-slot="{ open }"
    as="div"
    :class="$style.menuWrapper"
  >
    <MenuButton
      ref="referenceRef"
      :class="[
        $style.menuButton,
        kind === 'white' ? $style.menuButtonWhite : '',
        kind === 'lightgrey' ? $style.menuButtonLightgrey : '',
      ]"
    >
      <EllipsisHorizontalIcon
        :class="[$style.menuIcon, vertical ? 'transform rotate-90' : '']"
        aria-hidden="true"
      />
    </MenuButton>

    <Teleport to="body">
      <div
        v-if="open"
        ref="floatingWrapRef"
        :style="floatingWrapStyles"
      >
        <transition
          enter-active-class="transition ease-out duration-150"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition ease-in duration-100"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <MenuItems
            v-if="open"
            ref="floatingRef"
            :class="$style.menuItems"
            static
          >
            <slot name="header" />
            <div
              v-for="(group, groupIndex) in menuActionGroups"
              :key="groupIndex"
              :class="$style.menuGroup"
            >
              <MenuItem
                v-for="(item, index) in group"
                :key="index"
                v-slot="{ active, disabled }"
                :disabled="item.disabled"
              >
                <button
                  type="button"
                  :class="[
                    active ? $style.activeItem : '',
                    disabled ? $style.disabledItem : '',
                    item.style === 'underline' ? $style.underlineItem : '',
                    item.style === 'red' ? $style.redItem : '',
                    $style.menuButtonItem,
                  ]"
                  @click="handleItemClick(item)"
                >
                  <slot
                    name="item"
                    :item="item"
                  >
                    {{ item.label }}
                  </slot>
                </button>
              </MenuItem>
              <div
                v-if="groupIndex < menuActionGroups.length - 1"
                :class="$style.divider"
              />
            </div>
          </MenuItems>
        </transition>
      </div>
    </Teleport>
  </Menu>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { EllipsisHorizontalIcon } from "@heroicons/vue/24/solid"
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue"
import { useFloating, flip, shift, offset, autoUpdate } from "@floating-ui/vue"
import type { MenuActions } from "@/types/common/menuActions"

const props = defineProps<{
  menuActionGroups: MenuActions[][]
  kind?: "white" | "unset" | "lightgrey"
  vertical?: boolean
  placement?: import("@floating-ui/vue").Placement
}>()

const kind = props.kind ?? "unset"
const vertical = props.vertical ?? true

const referenceRef = ref<HTMLElement | null>(null)
const floatingRef = ref<HTMLElement | null>(null)
const floatingWrapRef = ref<HTMLElement | null>(null)

const menuPlacement = computed(() => props.placement ?? "bottom-end")

const { floatingStyles } = useFloating(referenceRef, floatingWrapRef, {
  placement: menuPlacement.value,
  middleware: [offset(6), flip(), shift()],
  whileElementsMounted: (refEl, floatEl, cleanup) =>
    autoUpdate(refEl, floatEl, cleanup, {
      ancestorScroll: true,
      ancestorResize: true,
      elementResize: true,
      layoutShift: true,
    }),
})

const floatingWrapStyles = floatingStyles

type MenuItemType = (typeof props.menuActionGroups)[number][number]
function handleItemClick(item: MenuItemType) {
  item.action?.()
}
</script>

<style module>
.menuWrapper {
  @apply relative flex-none flex justify-end;
}
.menuButton {
  @apply flex items-center justify-center p-0 h-10 w-10 min-w-[40px] min-h-[40px] text-gray-500 hover:text-gray-900;
}
.menuButtonWhite {
  @apply bg-white text-gray-900 border border-gray-300 rounded-lg shadow-sm transition duration-300 hover:bg-black hover:text-white;
}
.menuButtonLightgrey {
  @apply bg-[#f5f5f5] text-black rounded-lg shadow-sm transition duration-300 hover:bg-[#d9d9d9];
  border: 1px solid #d9d9d9;
}
.menuIcon {
  @apply w-6 h-6 font-bold;
}
.menuItems {
  @apply z-50 mt-2 w-max max-w-96 rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none;
}
.menuGroup {
  @apply flex flex-col;
}
.menuButtonItem {
  @apply block w-full px-3 py-1 text-left text-sm/6 text-gray-900 font-normal whitespace-nowrap;
}
.activeItem {
  @apply bg-gray-50 outline-none;
}
.disabledItem {
  @apply cursor-not-allowed opacity-50;
}
.underlineItem {
  @apply underline;
}
.redItem {
  @apply text-red-600;
}
.divider {
  @apply my-1 h-px bg-gray-200 mx-3;
}
</style>
