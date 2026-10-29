<template>
  <div :class="$style.pair">
    <FormInput
      :model-value="modelValue"
      :class="$style.field"
      :label="label"
      :placeholder="placeholder"
      :disabled="disabled"
      :invalid-message="invalidMessage"
      @update:model-value="onRuUpdate"
    />
    <div :class="$style.latinRow">
      <FormInput
        ref="latinInputRef"
        :model-value="latinInputValue"
        :class="[$style.field, !isLatinEditing && $style.latinLocked]"
        :placeholder="latinPlaceholder"
        :disabled="disabled || !isLatinEditing"
        @update:model-value="onLatinInput"
        @keydown.enter.prevent="commitLatinEdit"
      />
      <button
        v-if="!disabled"
        type="button"
        :class="$style.actionBtn"
        :aria-label="isLatinEditing ? t('common.save') : t('common.edit')"
        @click="onActionClick"
      >
        <CheckIcon
          v-if="isLatinEditing"
          :class="$style.actionIcon"
          aria-hidden="true"
        />
        <PencilSquareIcon
          v-else
          :class="$style.actionIcon"
          aria-hidden="true"
        />
      </button>
    </div>
    <p
      v-if="helperText"
      :class="$style.helper"
    >
      {{ helperText }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { CheckIcon, PencilSquareIcon } from "@heroicons/vue/24/outline"
import FormInput from "@/components/form/Input.vue"
import { sanitizeInvoiceLatinField } from "@/utils/transliterateToLatin"

const props = withDefaults(defineProps<{
  modelValue: string
  latin?: string
  label: string
  persistedLatin?: string
  disabled?: boolean
  invalidMessage?: string
  helperText?: string
  placeholder?: string
  latinPlaceholder?: string
}>(), {
  latin: "",
  persistedLatin: "",
  disabled: false,
  invalidMessage: "",
  helperText: "",
  placeholder: "",
  latinPlaceholder: "",
})

const emit = defineEmits<{
  "update:modelValue": [value: string]
  "update:latin": [value: string]
}>()

const { t } = useI18n()

const isLatinEditing = ref(false)
const latinDraft = ref("")
const latinInputRef = ref<InstanceType<typeof FormInput> | null>(null)

const autoLatin = computed(() => {
  const fromRu = sanitizeInvoiceLatinField(props.modelValue)
  return fromRu || props.persistedLatin
})

const displayedLatin = computed(() => {
  const manual = sanitizeInvoiceLatinField(props.latin)
  return manual || autoLatin.value
})

const latinInputValue = computed(() => (
  isLatinEditing.value ? latinDraft.value : displayedLatin.value
))

watch(autoLatin, (value) => {
  if (!props.latin && !isLatinEditing.value) {
    latinDraft.value = value
  }
})

watch(() => props.disabled, (value) => {
  if (value && isLatinEditing.value) {
    commitLatinEdit()
  }
})

function onRuUpdate(value: string | number) {
  emit("update:modelValue", String(value))
  emit("update:latin", "")
}

function startLatinEdit() {
  if (props.disabled || isLatinEditing.value) {
    return
  }

  isLatinEditing.value = true
  latinDraft.value = displayedLatin.value

  nextTick(() => {
    const input = latinInputRef.value?.$el?.querySelector("input") as HTMLInputElement | null
    input?.focus()
    input?.select()
  })
}

function onLatinInput(value: string | number) {
  if (isLatinEditing.value) {
    latinDraft.value = String(value)
  }
}

function commitLatinEdit() {
  if (!isLatinEditing.value || props.disabled) {
    return
  }

  emit("update:latin", sanitizeInvoiceLatinField(latinDraft.value))
  isLatinEditing.value = false
}

function onActionClick() {
  if (isLatinEditing.value) {
    commitLatinEdit()
  }
  else {
    startLatinEdit()
  }
}
</script>

<style module>
.pair {
  @apply flex flex-col gap-2;
}

.field {
  @apply w-full;
}

.latinRow {
  @apply flex items-center gap-2;

  & > div {
    @apply w-full;
  }
}

.latinRow .field {
  @apply min-w-0 flex-1;
}

.latinLocked :global(input) {
  @apply border-gray-200 bg-gray-50 text-gray-500;
}

.actionBtn {
  @apply inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-900 focus:outline-none;
}

.actionIcon {
  @apply h-4 w-4;
}

.helper {
  @apply text-sm text-gray-500;
}
</style>
