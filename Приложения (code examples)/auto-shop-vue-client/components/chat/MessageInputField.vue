<template>
  <textarea
    ref="textarea"
    v-model="proxyValue"
    :placeholder="placeholder"
    rows="1"
    :class="$style.textarea"
    @input="autoResize"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue"

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()
const emit = defineEmits(["update:modelValue"])

const textarea = ref<HTMLTextAreaElement | null>(null)

const proxyValue = computed({
  get: () => props.modelValue,
  set: (val: string) => emit("update:modelValue", val),
})

const autoResize = () => {
  if (!textarea.value) {
    return
  }
  textarea.value.style.height = "auto"
  textarea.value.style.height = textarea.value.scrollHeight + "px"
}

onMounted(autoResize)

watch(
  () => props.modelValue,
  (val) => {
    if (val === "") {
      if (textarea.value) {
        textarea.value.style.height = "auto"
      }
    }
    else {
      autoResize()
    }
  },
)
</script>

<style module>
.textarea {
  @apply flex-1 pt-0 pl-0 min-w-0 bg-transparent border-none resize-none text-sm;
  min-height: 44px;
  line-height: 1.5;
  outline: none;
  box-shadow: none;
}
.textarea:focus {
  outline: none;
  box-shadow: none;
}
</style>
