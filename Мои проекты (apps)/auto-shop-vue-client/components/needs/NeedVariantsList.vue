<template>
  <div :class="$style.list">
    <button
      v-for="(variant, index) in variants"
      :key="variant.localId"
      type="button"
      :class="[$style.card, index === activeIndex ? $style.active : '']"
      @click="$emit('select', index)"
    >
      <div :class="$style.head">
        <Label
          kind="blue"
          :text="t('needs.form.priority_label', { n: variant.priority })"
        />
        <div
          v-if="variants.length > 1"
          :class="$style.actions"
          @click.stop
        >
          <Button
            kind="unset"
            size="unset"
            :disabled="index === 0"
            :class="$style.iconBtn"
            @click="$emit('move-up', index)"
          >
            ↑
          </Button>
          <Button
            kind="unset"
            size="unset"
            :disabled="index === variants.length - 1"
            :class="$style.iconBtn"
            @click="$emit('move-down', index)"
          >
            ↓
          </Button>
          <Button
            v-if="canRemove"
            kind="unset"
            size="unset"
            :class="$style.removeBtn"
            @click="$emit('remove', index)"
          >
            ✕
          </Button>
        </div>
      </div>
      <div :class="$style.title">
        {{ titleFor(variant) }}
      </div>
      <div
        v-if="variant.models?.length"
        :class="$style.meta"
      >
        {{ t('needs.form.selected_cars') }}: {{ variant.models.length }}
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n"
import Button from "@/components/common/Button.vue"
import Label from "@/components/common/Label.vue"
import type { NeedVariantFormState } from "@/types/requests/searchRequest"
import { brandSeriesLabel } from "@/composables/needs/useNeedVariantsForm"

defineProps<{
  variants: NeedVariantFormState[]
  activeIndex: number
  canRemove?: boolean
}>()

defineEmits<{
  "select": [index: number]
  "remove": [index: number]
  "move-up": [index: number]
  "move-down": [index: number]
}>()

const { t } = useI18n()

const titleFor = (variant: NeedVariantFormState) => {
  const label = brandSeriesLabel(variant)
  return label || t("needs.form.variant_unnamed", { n: variant.priority })
}
</script>

<style module>
.list {
  @apply flex flex-col gap-2.5 mb-4;
}

.card {
  @apply block w-full rounded-[9px] border border-gray-200 bg-gray-50 p-2.5 text-left transition-colors cursor-pointer hover:border-gray-300;
}

.active {
  @apply border-blue-300 bg-sky-50;
}

.head {
  @apply flex items-start justify-between gap-3;
}

.actions {
  @apply flex items-center gap-3 text-gray-500;
}

.title {
  @apply mt-1.5 text-base text-gray-900;
}

.meta {
  @apply text-xs text-gray-500 mt-1;
}

.iconBtn {
  @apply px-1 text-gray-500 hover:text-gray-900 disabled:opacity-30;
}

.removeBtn {
  @apply px-1 text-gray-500 hover:text-primary;
}
</style>
