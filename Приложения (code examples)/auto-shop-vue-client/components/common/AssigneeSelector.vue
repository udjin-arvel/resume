<template>
  <div>
    <div
      v-if="label"
      class="mb-2"
    >
      <span class="block text-sm font-medium leading-6 text-gray-700">
        {{ label }}
      </span>
    </div>
    <div class="flex items-center gap-2">
      <Button
        v-if="!currentAssignee && showTakeToWork"
        kind="lightgrey"
        @click="$emit('take-to-work')"
      >
        {{ takeToWorkText }}
      </Button>
      <div
        v-if="currentAssignee || showDropdownWhenEmpty"
        class="relative"
      >
        <Button
          :kind="hasError ? 'redOutline' : 'white'"
          @click="showDropdown = !showDropdown"
        >
          {{ currentAssignee ? currentAssignee.name : emptyText }}
          <ChevronDownIcon class="w-4 h-4 ml-2 inline-block" />
        </Button>

        <div
          v-if="showDropdown"
          class="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
        >
          <div class="p-2">
            <FormInput
              v-model="searchQuery"
              :placeholder="searchPlaceholder"
              class="mb-2"
            />
          </div>
          <div class="max-h-60 overflow-y-auto">
            <button
              v-for="option in filteredOptions"
              :key="option.id"
              :class="[
                'w-full text-left px-4 py-2 hover:bg-gray-100 transition rounded text-sm',
                selectedId === option.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700',
              ]"
              @click="selectedId = option.id"
            >
              {{ option.name }}
            </button>

            <div
              v-if="!filteredOptions.length"
              class="px-4 py-2 text-sm text-gray-500"
            >
              {{ emptyOptionsText }}
            </div>
          </div>

          <div class="border-t border-gray-200 p-2 flex justify-between gap-2">
            <Button
              kind="black"
              size="sm"
              :disabled="!selectedId || selectedId === currentAssignee?.id"
              @click="handleAssign"
            >
              {{ assignText }}
            </Button>
            <Button
              kind="lightgrey"
              size="sm"
              @click="handleCancel"
            >
              {{ cancelText }}
            </Button>
          </div>
        </div>
      </div>
    </div>
    <p
      v-if="hasError"
      class="mt-2 text-sm text-red-600"
    >
      {{ invalidMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { useI18n } from "vue-i18n"
import { ChevronDownIcon } from "@heroicons/vue/24/outline"
import Button from "@/components/common/Button.vue"
import FormInput from "@/components/form/Input.vue"

export interface AssigneeOption {
  id: number | string
  name: string
}

const { t } = useI18n()

const props = withDefaults(defineProps<{
  label?: string
  currentAssignee?: AssigneeOption | null
  options: AssigneeOption[]
  takeToWorkText?: string
  showTakeToWork?: boolean
  showDropdownWhenEmpty?: boolean
  emptyText?: string
  searchPlaceholder?: string
  assignText?: string
  cancelText?: string
  emptyOptionsText?: string
  invalidMessage?: string | null
}>(), {
  currentAssignee: null,
  showTakeToWork: true,
  showDropdownWhenEmpty: false,
  invalidMessage: null,
  label: undefined,
})

const takeToWorkText = computed(() => props.takeToWorkText ?? t("needs.take_to_work"))
const emptyText = computed(() => props.emptyText ?? t("logistic.order_list.unassigned"))
const searchPlaceholder = computed(() => props.searchPlaceholder ?? t("common.search"))
const assignText = computed(() => props.assignText ?? t("needs.assign"))
const cancelText = computed(() => props.cancelText ?? t("common.cancel"))
const emptyOptionsText = computed(() => props.emptyOptionsText ?? t("common.no_data"))

const hasError = computed(() => !!props.invalidMessage)

const emit = defineEmits<{
  (e: "take-to-work"): void
  (e: "assign", id: number | string): void
}>()

const showDropdown = ref(false)
const searchQuery = ref("")
const selectedId = ref<number | string | null>(null)

const filteredOptions = computed(() => {
  if (!searchQuery.value) {
    return props.options
  }
  const q = searchQuery.value.toLowerCase()
  return props.options.filter(o => o.name.toLowerCase().includes(q))
})

watch(showDropdown, (newValue) => {
  if (!newValue) {
    selectedId.value = null
    searchQuery.value = ""
  }
  else {
    selectedId.value = props.currentAssignee?.id || null
  }
})

function handleAssign() {
  if (!selectedId.value) {
    return
  }
  emit("assign", selectedId.value)
  showDropdown.value = false
}

function handleCancel() {
  showDropdown.value = false
  selectedId.value = null
  searchQuery.value = ""
}
</script>
