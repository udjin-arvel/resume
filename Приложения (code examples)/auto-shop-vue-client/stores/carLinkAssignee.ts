import { defineStore } from "pinia"
import { ref } from "vue"
import { useApiCarLink } from "@/composables/api/useApiCarLink"
import { useApiAction } from "@/composables/useApiAction"
import type { AssigneeData } from "@/types/common/user"
import type { ApiResponse } from "@/types/responses/response"

export const useCarLinkAssigneeStore = defineStore("carLinkAssignee", () => {
  const assignees = ref<AssigneeData[]>([])
  const isLoaded = ref(false)

  const { assignees: _fetchAssignees } = useApiCarLink()
  const { run, isLoading } = useApiAction()

  async function loadAssignees() {
    if (isLoaded.value) {
      return assignees.value
    }

    return run(async () => {
      const res = await _fetchAssignees({ camelize: true }) as ApiResponse<AssigneeData[]>
      if (res.data) {
        assignees.value = res.data
        isLoaded.value = true
      }
      return res.data
    })
  }

  return {
    assignees,
    isLoaded,
    isLoading,
    loadAssignees,
  }
})
