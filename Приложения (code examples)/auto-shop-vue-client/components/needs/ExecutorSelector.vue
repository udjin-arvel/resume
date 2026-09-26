<template>
  <div class="flex items-center gap-2">
    <span v-if="!canAssign">{{ currentExecutor?.name || '—' }}</span>
    <Button
      v-else-if="!currentExecutor"
      kind="lightgrey"
      :disabled="isAssigning"
      @click="handleTakeToWork"
    >
      {{ t(requestStatus === RequestStatusOnBooking ? 'needs.assign_self' : 'needs.take_to_work') }}
    </Button>

    <div
      v-else
      class="relative"
    >
      <Button
        kind="white"
        :disabled="isAssigning"
        @click="showDropdown = !showDropdown"
      >
        {{ currentExecutor.name }}
        <ChevronDownIcon class="w-4 h-4 ml-2" />
      </Button>

      <div
        v-if="showDropdown"
        class="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
      >
        <div class="p-2">
          <FormInput
            v-model="searchQuery"
            :placeholder="t('needs.search_executor')"
            class="mb-2"
          />
        </div>
        <div class="max-h-60 overflow-y-auto">
          <button
            v-for="seller in filteredSellers"
            :key="seller.id"
            :disabled="isAssigning"
            :class="[
              'w-full text-left px-4 py-2 hover:bg-gray-100 transition rounded',
              selectedExecutorId === seller.id ? 'bg-blue-50 text-blue-600' : '',
            ]"
            @click="selectedExecutorId = seller.id"
          >
            {{ seller.name }}
          </button>
        </div>
        <div class="border-t border-gray-200 p-2 flex justify-between gap-2">
          <Button
            kind="black"
            size="sm"
            :disabled="!canSubmitAssignment"
            @click="handleAssign"
          >
            {{ t('needs.assign') }}
          </Button>
          <Button
            kind="lightgrey"
            size="sm"
            :disabled="isAssigning"
            @click="handleCancel"
          >
            {{ t('common.cancel') }}
          </Button>
        </div>
      </div>
    </div>
    <p
      v-if="assignmentFailed"
      role="alert"
      class="max-w-60 text-xs text-red-600"
    >
      {{ t('needs.action_error') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue"
import { useI18n } from "vue-i18n"
import { ChevronDownIcon } from "@heroicons/vue/24/outline"
import useSearchRequest from "@/composables/useSearchRequest"
import { useUserStore } from "@/stores/user"
import Button from "@/components/common/Button.vue"
import FormInput from "@/components/form/Input.vue"
import type { NamedEntity } from "@/types/common/entities"
import type { SearchRequestStatusType } from "@/types/responses/searchRequest"
import { RequestStatusNew, RequestStatusInWork, RequestStatusOnBooking } from "@/constants/statuses"

interface Props {
  searchRequestId: number
  requestStatus?: SearchRequestStatusType
  currentExecutor?: NamedEntity | null
  onUpdate?: () => void
}

const props = defineProps<Props>()
const { t } = useI18n()
const { sellers, loadSellers, assignExecutorToRequest } = useSearchRequest()
const userStore = useUserStore()

const showDropdown = ref(false)
const searchQuery = ref("")
const selectedExecutorId = ref<number | null>(null)
const isAssigning = ref(false)
const assignmentFailed = ref(false)
const canAssign = computed(() => props.requestStatus === RequestStatusNew
  || props.requestStatus === RequestStatusInWork
  || props.requestStatus === RequestStatusOnBooking)
const canSubmitAssignment = computed(() => canAssign.value && !isAssigning.value
  && selectedExecutorId.value !== null
  && (props.requestStatus === RequestStatusNew || selectedExecutorId.value !== props.currentExecutor?.id))

watch(canAssign, (allowed) => {
  if (!allowed) {
    showDropdown.value = false
  }
})

const filteredSellers = computed(() => {
  if (!searchQuery.value) {
    return sellers.value
  }
  return sellers.value.filter(s =>
    s.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

watch(showDropdown, (newValue) => {
  if (!newValue) {
    selectedExecutorId.value = null
    searchQuery.value = ""
  }
  else {
    selectedExecutorId.value = props.currentExecutor?.id || null
  }
})

async function handleTakeToWork() {
  const user = userStore.user
  if (!user?.id) {
    return
  }
  await assignExecutor(user.id)
}

async function handleAssign() {
  if (!canSubmitAssignment.value || !selectedExecutorId.value) {
    return
  }
  if (await assignExecutor(selectedExecutorId.value)) {
    handleCancel()
  }
}

async function assignExecutor(executorId: number): Promise<boolean> {
  if (!canAssign.value || isAssigning.value) {
    return false
  }
  isAssigning.value = true
  assignmentFailed.value = false
  try {
    const success = await assignExecutorToRequest(props.searchRequestId, executorId)
    assignmentFailed.value = !success
    if (success) {
      props.onUpdate?.()
    }
    return success
  }
  finally {
    isAssigning.value = false
  }
}

function handleCancel() {
  showDropdown.value = false
  selectedExecutorId.value = null
  searchQuery.value = ""
}

onMounted(loadSellers)
</script>
