<template>
  <div :class="$style.relativeBlock">
    <Popover
      v-slot="{ open }"
      :class="$style.relativeBlock"
    >
      <PopoverButton as="template">
        <Button
          kind="white"
          :class="$style.button"
        >
          <ArrowTopRightOnSquareIcon :class="$style.icon" />
          {{ t('catalog.detail.copy_link_btn') }}
          <ChevronDownIcon :class="$style.arrowIcon" />
        </Button>
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
          v-if="open"
          :class="$style.menuPanel"
        >
          <div :class="$style.menuHeader">
            {{ t('catalog.detail.access_by_link') }}
          </div>

          <div
            v-if="generatedLink"
            :class="$style.generatedBlock"
          >
            <div :class="$style.linkLabelGray">
              {{ t('catalog.detail.link') }}
            </div>
            <div :class="$style.linkInputRow">
              <input
                :value="generatedLink"
                readonly
                :class="$style.linkInput"
                @click="copyLink"
              >
              <button
                :class="$style.copyBtn"
                @click="copyLink"
              >
                <DocumentDuplicateIconOutline :class="$style.copyIcon" />
              </button>
            </div>
            <div :class="$style.successText">
              {{ t('catalog.detail.copied') }}
            </div>
            <button
              :class="$style.resetBtn"
              @click="resetGeneration"
            >
              {{ t('catalog.actions.create_new') }}
            </button>
          </div>
          <div v-else>
            <template v-if="anonymousAvailable">
              <div :class="$style.linkLabelGray">
                {{ t('catalog.detail.link_domain') }}
              </div>
              <Select
                v-model="domainType"
                :options="domainOptions"
                :class="$style.linkDurationSelect"
              />
            </template>

            <div :class="$style.linkLabelGray">
              {{ t('catalog.detail.on_page') }}
            </div>

            <div :class="$style.photoRowMenu">
              <span :class="$style.photoLabelMenu">{{ t('catalog.detail.photo') }}</span>
              <ClientOnly>
                <Switch
                  v-model="settings.photo"
                  :class="$style.photoSwitchMenu"
                />
              </ClientOnly>
            </div>
            <div :class="$style.photoRowMenu">
              <span :class="$style.photoLabelMenu">{{ t('catalog.detail.video') }}</span>
              <ClientOnly>
                <Switch
                  v-model="settings.video"
                  :class="$style.photoSwitchMenu"
                />
              </ClientOnly>
            </div>
            <div :class="$style.photoRowMenu">
              <span :class="$style.photoLabelMenu">{{ t('catalog.detail.diagnostic') }}</span>
              <ClientOnly>
                <Switch
                  v-model="settings.diagnostic"
                  :class="$style.photoSwitchMenu"
                />
              </ClientOnly>
            </div>
            <div :class="$style.photoRowMenu">
              <span :class="$style.photoLabelMenu">{{ t('catalog.detail.compensation') }}</span>
              <ClientOnly>
                <Switch
                  v-model="settings.compensation"
                  :class="$style.photoSwitchMenu"
                />
              </ClientOnly>
            </div>
            <div :class="$style.photoRowMenu">
              <span :class="$style.photoLabelMenu">{{ t('catalog.detail.price') }}</span>
              <ClientOnly>
                <Switch
                  v-model="settings.price"
                  :class="$style.photoSwitchMenu"
                />
              </ClientOnly>
            </div>

            <div :class="$style.linkLabelGray">
              {{ t('catalog.detail.link_expiry') }}
            </div>
            <Select
              v-model="settings.duration"
              :options="linkDurationOptions"
              :class="$style.linkDurationSelect"
            />

            <Button
              kind="blue"
              :class="$style.generateBtn"
              :disabled="loading"
              @click="handleGenerate"
            >
              {{ loading ? t('common.loading') : t('catalog.detail.copy_link_btn') }}
            </Button>
          </div>
        </PopoverPanel>
      </transition>
    </Popover>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { Popover, PopoverButton, PopoverPanel, Switch } from "@headlessui/vue"
import { ArrowTopRightOnSquareIcon, ChevronDownIcon } from "@heroicons/vue/24/solid"
import { DocumentDuplicateIcon as DocumentDuplicateIconOutline } from "@heroicons/vue/24/outline"
import Button from "@/components/common/Button.vue"
import Select from "@/components/form/Select.vue"
import type { ShareLinkGenerationResult } from "@/composables/useSharedLink"

const props = defineProps<{
  loading: boolean
  linkDurationOptions: any[]
  lastGeneratedShare?: ShareLinkGenerationResult | null
}>()

const emit = defineEmits<{
  (e: "generate", payload: { photo: boolean, video: boolean, diagnostic: boolean, compensation: boolean, price: boolean, duration: string, anonymous: boolean }): void
}>()

const { t } = useI18n()
const config = useRuntimeConfig()

const anonymousAvailable = computed(() => !!config.public.anonymousShareDomain)

const domainType = ref("anonymous")
const domainOptions = computed(() => [
  { id: 1, value: "branded", name: t("catalog.detail.domain_branded"), disabled: false },
  { id: 2, value: "anonymous", name: t("catalog.detail.domain_anonymous"), disabled: false },
])

const isAnonymousSelected = computed(() => domainType.value === "anonymous")

const settings = reactive({
  photo: true,
  video: true,
  diagnostic: true,
  compensation: true,
  price: false,
  duration: "unlimited",
})

const generatedLink = ref<string | null>(null)
const generatedText = ref<string | null>(null)

watch(() => props.lastGeneratedShare, (val) => {
  if (val) {
    generatedLink.value = val.url
    generatedText.value = val.text
    copyLink()
  }
})

function handleGenerate() {
  emit("generate", {
    ...settings,
    anonymous: isAnonymousSelected.value,
  })
}

function resetGeneration() {
  generatedLink.value = null
  generatedText.value = null
}

async function copyLink() {
  const text = generatedText.value || generatedLink.value
  if (!text) {
    return
  }
  await navigator.clipboard.writeText(text)
}
</script>

<style module>
.relativeBlock { @apply relative; }
.button { @apply whitespace-nowrap flex items-center; }
.icon { @apply w-5 h-5 inline-block mr-1; }
.arrowIcon { @apply w-4 h-4 ml-2; }
.menuPanel { @apply absolute top-full z-50 mt-2 w-72 rounded-xl bg-white p-4 shadow-lg ring-1 ring-gray-900/5 right-0; }
.menuHeader { @apply font-bold text-base mb-3; }
.linkLabelGray { @apply text-gray-500 text-xs mb-1 mt-2; }
.linkInputRow { @apply flex items-center w-full mb-1 mt-1; }
.linkInput { @apply flex-1 text-sm border border-gray-300 rounded-l px-2 py-1.5 bg-gray-50 text-gray-600 truncate; }
.copyBtn { @apply px-3 py-1.5 bg-gray-100 border border-l-0 border-gray-300 rounded-r hover:bg-gray-200 transition; }
.copyIcon { @apply w-5 h-5 text-gray-600; }
.photoRowMenu { @apply flex items-center justify-between mb-2; }
.photoLabelMenu { @apply text-sm font-medium text-gray-900; }
.photoSwitchMenu { @apply relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors; }
.photoSwitchMenu[aria-checked="true"] { @apply bg-blue-600; }
.photoSwitchMenu::after { @apply absolute h-4 w-4 rounded-full bg-white transition-transform content-[''] translate-x-1; }
.photoSwitchMenu[aria-checked="true"]::after { @apply translate-x-6; }
.linkDurationSelect { @apply mt-1 w-full; }
.generateBtn { @apply w-full justify-center mt-4; }
.successText { @apply text-green-600 text-xs text-center mb-2; }
.resetBtn { @apply text-xs text-blue-600 underline w-full text-center hover:no-underline; }
</style>
