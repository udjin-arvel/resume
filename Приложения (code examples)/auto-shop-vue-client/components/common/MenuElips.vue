<template>
  <HeadlessMenu
    v-slot="{ open }"
    as="div"
    :class="$style.menuWrapper"
  >
    <HeadlessMenuButton
      ref="buttonRef"
      :class="[
        $style.menuButton,
        kind === 'white' ? $style.menuButtonWhite : '',
        kind === 'lightgrey' ? $style.menuButtonLightgrey : '',
      ]"
      @click="emitOpen(open ? false : true)"
    >
      <EllipsisHorizontalIcon
        :class="[
          $style.menuIcon,
          vertical ? 'transform rotate-90' : '',
        ]"
        aria-hidden="true"
      />
    </HeadlessMenuButton>

    <Teleport to="body">
      <transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        :enter-to-class="`transform opacity-100 scale-100 ${transitionOriginClass}`"
        leave-active-class="transition ease-in duration-75"
        :leave-from-class="`transform opacity-100 scale-100 ${transitionOriginClass}`"
        leave-to-class="transform opacity-0 scale-95"
        @after-enter="emitOpen(true)"
        @after-leave="emitOpen(false)"
      >
        <HeadlessMenuItems
          v-if="open"
          ref="menuRef"
          :class="[menuClass, $style.fixedMenu]"
          :style="menuStyle"
        >
          <slot name="header" />
          <div
            v-for="(group, groupIndex) in menuActionGroups"
            :key="groupIndex"
            :class="$style.menuGroup"
          >
            <HeadlessMenuItem
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
                @click="item.action"
              >
                <slot
                  name="item"
                  :item="item"
                >
                  {{ item.label }}
                </slot>
              </button>
            </HeadlessMenuItem>
            <div
              v-if="groupIndex < menuActionGroups.length - 1"
              :class="$style.divider"
            />
          </div>
        </HeadlessMenuItems>
      </transition>
    </Teleport>
  </HeadlessMenu>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, nextTick } from "vue"
import { EllipsisHorizontalIcon } from "@heroicons/vue/24/solid"
import type { MenuActions } from "@/types/common/menuActions"

type Placement =
  | "bottom-start"
  | "bottom-end"
  | "top-start"
  | "top-end"

const props = defineProps<{
  menuActionGroups: MenuActions[][]
  kind?: "white" | "unset" | "lightgrey"
  vertical?: boolean
  placement?: Placement
}>()

const emit = defineEmits<{
  (e: "open-change", open: boolean): void
}>()

const kind = props.kind ?? "unset"
const vertical = props.vertical ?? true
const placement = computed<Placement>(() => props.placement ?? "bottom-end")

const buttonRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const menuStyle = ref({ top: "0px", left: "0px", right: "auto", bottom: "auto" })

function emitOpen(open: boolean) {
  emit("open-change", open)
  if (open) {
    nextTick(() => {
      updatePosition()
    })
  }
}

function updatePosition() {
  if (!buttonRef.value || !menuRef.value) {
    return
  }

  const el = (buttonRef.value as any).$el || buttonRef.value
  const btnRect = el.getBoundingClientRect()
  const menuEl = (menuRef.value as any).$el || menuRef.value
  const menuHeight = menuEl.offsetHeight || 300
  const offset = 4

  let top = "auto", bottom = "auto", left = "auto", right = "auto"

  const spaceBelow = window.innerHeight - btnRect.bottom

  if (placement.value.includes("top") || spaceBelow < (menuHeight + offset)) {
    bottom = `${window.innerHeight - btnRect.top + offset}px`
  }
  else {
    top = `${btnRect.bottom + offset}px`
  }

  if (placement.value.includes("end")) {
    right = `${window.innerWidth - btnRect.right}px`
  }
  else if (placement.value.includes("start")) {
    left = `${btnRect.left}px`
  }

  menuStyle.value = { top, bottom, left, right }
}

if (typeof window !== "undefined") {
  window.addEventListener("scroll", updatePosition, true)
  window.addEventListener("resize", updatePosition)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    emitOpen(false)
  }
}

onMounted(() => {
  window.addEventListener("keydown", onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown)
  if (typeof window !== "undefined") {
    window.removeEventListener("scroll", updatePosition, true)
    window.removeEventListener("resize", updatePosition)
  }
})

const menuClass = computed(() => {
  const base = "menu-elips-pos"
  switch (placement.value) {
    case "bottom-start": return `${base} menu-elips-start`
    case "bottom-end": return `${base} menu-elips-end`
    case "top-start": return `${base} menu-elips-start`
    case "top-end": return `${base} menu-elips-end`
    default: return `${base} menu-elips-end`
  }
})

const transitionOriginClass = computed(() => {
  switch (placement.value) {
    case "bottom-start": return "origin-top-left"
    case "bottom-end": return "origin-top-right"
    case "top-start": return "origin-bottom-left"
    case "top-end": return "origin-bottom-right"
    default: return "origin-top-right"
  }
})
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
  @apply bg-[#f5f5f5] text-black border border-black rounded-lg shadow-sm transition duration-300 hover:bg-[#d9d9d9];
  border: 1px solid #d9d9d9;
}
.menuIcon {
  @apply w-6 h-6 font-bold;
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

.fixedMenu {
  @apply fixed z-[100] min-w-[12rem] w-max rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none;
}
</style>
