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
            enter-from="opacity-0 translate-y-2"
            enter-to="opacity-100 translate-y-0"
            leave="duration-150 ease-in"
            leave-from="opacity-100 translate-y-0"
            leave-to="opacity-0 translate-y-2"
          >
            <HeadlessDialogPanel :class="['ld-page', $style.panel]">
              <button
                type="button"
                :class="$style.close"
                :aria-label="t('landing.requests.auth.close')"
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
              <div :class="$style.icon">
                <svg
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                ><rect
                  x="5"
                  y="10"
                  width="14"
                  height="11"
                  rx="3"
                  stroke="currentColor"
                  stroke-width="1.7"
                /><path
                  d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                /></svg>
              </div>
              <HeadlessDialogTitle
                as="h3"
                :class="$style.title"
              >
                {{ t("landing.requests.auth.title") }}
              </HeadlessDialogTitle>
              <p :class="$style.text">
                {{ t("landing.requests.auth.text") }}
              </p>
              <NuxtLink
                :to="{ name: 'personal-register' }"
                :class="['ld-btn', 'ld-btn--primary', $style.btn]"
              >
                {{ t("landing.requests.auth.register") }}
              </NuxtLink>
              <button
                type="button"
                :class="['ld-btn', 'ld-btn--ghost', $style.btn]"
                @click="close"
              >
                {{ t("landing.requests.auth.ok") }}
              </button>
            </HeadlessDialogPanel>
          </HeadlessTransitionChild>
        </div>
      </div>
    </HeadlessDialog>
  </HeadlessTransitionRoot>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n"

defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void
}>()

const { t } = useI18n()

const close = () => {
  emit("update:modelValue", false)
}
</script>

<style module>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(14, 17, 22, .38);
  backdrop-filter: blur(4px);
}

.panel {
  position: relative;
  width: 420px;
  max-width: 100%;
  padding: 34px;
  border: 1px solid var(--ld-line);
  border-radius: 22px;
  background: #fff;
  box-shadow: var(--ld-shadow-3);
  text-align: center;
}

.close {
  position: absolute;
  top: 12px;
  right: 12px;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  color: var(--ld-muted);
  background: transparent;
  cursor: pointer;
}

.close:hover {
  background: var(--ld-panel);
}

.icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  margin: 2px auto 20px;
  background: var(--ld-accent-wash);
  color: var(--ld-accent);
  border-radius: 15px;
}

.title {
  margin: 0;
  font-size: 25px;
  line-height: 1.2;
  letter-spacing: -.025em;
  font-weight: 800;
}

.text {
  margin: 15px 0 24px;
  font-size: 14px;
  line-height: 1.65;
  color: var(--ld-muted);
}

.panel .btn {
  width: 100%;
  font-size: 14px;
  padding: 12px 18px;
}

.panel .btn + .btn {
  margin-top: 10px;
}

.panel button.btn {
  line-height: normal;
}
</style>
