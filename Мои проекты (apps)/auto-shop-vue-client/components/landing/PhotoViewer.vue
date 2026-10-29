<template>
  <HeadlessTransitionRoot
    appear
    :show="modelValue"
    as="template"
  >
    <HeadlessDialog
      as="div"
      class="relative z-50"
      @close="close"
    >
      <HeadlessTransitionChild
        as="template"
        enter="duration-200 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-150 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div :class="$style.backdrop" />
      </HeadlessTransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <HeadlessTransitionChild
            as="template"
            enter="duration-200 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-150 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <HeadlessDialogPanel :class="['ld-page', $style.panel]">
              <div :class="$style.head">
                <HeadlessDialogTitle
                  as="h3"
                  :class="$style.title"
                >
                  {{ title }}
                </HeadlessDialogTitle>
                <button
                  type="button"
                  :class="$style.close"
                  :aria-label="closeLabel"
                  @click="close"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  ><path
                    d="m6 6 12 12M18 6 6 18"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                  /></svg>
                </button>
              </div>
              <img
                :src="src"
                :alt="alt"
                :class="$style.img"
              >
              <p :class="$style.caption">
                {{ caption }}
              </p>
            </HeadlessDialogPanel>
          </HeadlessTransitionChild>
        </div>
      </div>
    </HeadlessDialog>
  </HeadlessTransitionRoot>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
  src: string
  alt: string
  title: string
  caption: string
  closeLabel: string
}>()

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void
}>()

const close = () => {
  emit("update:modelValue", false)
}
</script>

<style module>
.backdrop {
  position: fixed;
  inset: 0;
  background: #0e1116a8;
  backdrop-filter: blur(5px);
}

.panel {
  width: 760px;
  max-width: 100%;
  border-radius: 16px;
  background: #fff;
  box-shadow: var(--ld-shadow-3);
  overflow: hidden;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 17px;
}

.title {
  margin: 0;
  font-size: 16px;
  line-height: 1.35;
  font-weight: 700;
  letter-spacing: -.01em;
}

.close {
  display: grid;
  place-items: center;
  flex: none;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--ld-panel);
  color: var(--ld-ink);
  cursor: pointer;
}

.close:focus-visible {
  outline: 2px solid var(--ld-accent);
  outline-offset: 3px;
}

.img {
  display: block;
  width: 100%;
  max-height: calc(100dvh - 156px);
  object-fit: contain;
  background: var(--ld-panel);
}

.caption {
  margin: 0;
  padding: 12px 17px;
  font-size: 12px;
  color: var(--ld-muted);
}
</style>
