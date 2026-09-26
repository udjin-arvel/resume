<template>
  <div>
    <label
      v-if="label"
      :class="$style.label"
    >{{ label }}</label>
    <div class="flex items-center gap-0">
      <SearchableSelect
        :key="`left-${leftKey}`"
        v-model="left"
        :options="filteredLeftOptions"
        :placeholder="leftPlaceholder"
        :with-border-without-right="true"
        :default-to-first-option="false"
        class="flex-1"
      />
      <SearchableSelect
        :key="`right-${rightKey}`"
        v-model="right"
        :options="filteredRightOptions"
        :placeholder="rightPlaceholder"
        :with-border-without-left="true"
        :default-to-first-option="false"
        class="flex-1"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import SearchableSelect from "@/components/form/SearchableSelect.vue"
import type { OptionBase } from "@/types/form/optionType"

const props = defineProps<{
  label?: string
  leftOptions: OptionBase[]
  rightOptions: OptionBase[]
  leftPlaceholder?: string
  rightPlaceholder?: string
  modelValue?: { left: OptionBase | undefined, right: OptionBase | undefined }
}>()

const emits = defineEmits(["update:modelValue"])

const leftKey = ref(0)
const rightKey = ref(0)

const left = computed<OptionBase | undefined>({
  get() {
    return props.modelValue?.left ?? undefined
  },
  set(val) {
    emits("update:modelValue", { left: val, right: right.value })
  },
})

const right = computed<OptionBase | undefined>({
  get() {
    return props.modelValue?.right ?? undefined
  },
  set(val) {
    emits("update:modelValue", { left: left.value, right: val })
  },
})

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue?.left === undefined) {
      leftKey.value++
    }
    if (newValue?.right === undefined) {
      rightKey.value++
    }
  },
  { deep: true },
)

const filteredLeftOptions = computed(() => {
  const rightVal = right.value
  if (rightVal == null || rightVal.value == null) {
    return props.leftOptions
  }
  return props.leftOptions.filter(option =>
    Number(option.value) <= Number(rightVal.value),
  )
})

const filteredRightOptions = computed(() => {
  const leftVal = left.value
  if (leftVal == null || leftVal.value == null) {
    return props.rightOptions
  }
  return props.rightOptions.filter(option =>
    Number(option.value) >= Number(leftVal.value),
  )
})
</script>

<style module>
.label {
  @apply block text-sm font-medium leading-5 text-gray-700 mb-2;
}
</style>
