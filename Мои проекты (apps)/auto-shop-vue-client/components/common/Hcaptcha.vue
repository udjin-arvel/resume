<template>
  <div>
    <ClientOnly>
      <div
        :class="[
          $style.captchaWrapper,
          isInvalid ? $style.captchaWrapperInvalid : '',
        ]"
      >
        <div
          ref="containerRef"
          :class="$style.captcha"
        />
        <div
          v-if="isInvalid"
          :class="$style.invalid"
        >
          <ExclamationCircleIcon
            :class="$style.invalidIcon"
            aria-hidden="true"
          />
        </div>
      </div>
    </ClientOnly>

    <p
      v-if="isInvalid"
      :class="$style.invalidMessage"
    >
      {{ invalidMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ExclamationCircleIcon } from "@heroicons/vue/24/solid"
import { computed, onMounted, onBeforeUnmount, ref, watch } from "vue"

interface HcaptchaProps {
  modelValue: string | null
  invalidMessage?: string
}

const props = defineProps<HcaptchaProps>()
const config = useRuntimeConfig()

const emit = defineEmits<{
  (e: "update:modelValue", value: string | null): void
}>()

const containerRef = ref<HTMLElement | null>(null)
const widgetId = ref<number | null>(null)
const scriptLoaded = ref(false)

const isInvalid = computed(() => !!props.invalidMessage)

const HCAPTCHA_SITE_KEY = config.public.hcaptchaKey as string

function renderOrReset() {
  const el = containerRef.value
  const hcaptcha = (window as any).hcaptcha
  if (!hcaptcha || !el) {
    return
  }

  if (widgetId.value === null) {
    widgetId.value = hcaptcha.render(el, {
      "sitekey": HCAPTCHA_SITE_KEY,
      "callback": (token: string) => {
        emit("update:modelValue", token)
      },
      "error-callback": () => {
        emit("update:modelValue", null)
      },
      "expired-callback": () => {
        emit("update:modelValue", null)
      },
    })
  }
  else {
    hcaptcha.reset(widgetId.value)
  }
}

onMounted(() => {
  const existing = document.querySelector(
    "script[src^=\"https://js.hcaptcha.com/1/api.js\"]",
  ) as HTMLScriptElement | null

  const hcaptcha = (window as any).hcaptcha
  if (hcaptcha) {
    scriptLoaded.value = true
    return
  }

  const onLoad = () => {
    scriptLoaded.value = true
  }

  if (existing) {
    existing.addEventListener("load", onLoad, { once: true })
    return
  }

  const script = document.createElement("script")
  script.src = "https://js.hcaptcha.com/1/api.js?render=explicit"
  script.async = true
  script.defer = true
  script.addEventListener("load", onLoad, { once: true })
  document.head.appendChild(script)
})

watch(
  [scriptLoaded, containerRef],
  ([loaded, el]) => {
    if (loaded && el) {
      renderOrReset()
    }
  },
  { immediate: true },
)

watch(
  () => props.modelValue,
  (val) => {
    const hcaptcha = (window as any).hcaptcha

    if (val === null && hcaptcha && widgetId.value !== null) {
      hcaptcha.reset(widgetId.value)
    }
  },
)

onBeforeUnmount(() => {
  const hcaptcha = (window as any).hcaptcha
  if (!hcaptcha || widgetId.value === null) {
    return
  }

  hcaptcha.remove(widgetId.value)
})
</script>

<style module>
.captchaWrapper {
  @apply relative inline-block;
}
.captchaWrapperInvalid {
  @apply border border-red-300 rounded-md;
}
.captcha {
  @apply my-1;
}
.invalid {
  @apply absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none;
}
.invalidIcon {
  @apply h-5 w-5 text-red-500;
}
.invalidMessage {
  @apply mt-2 text-sm text-red-600;
}
</style>
