import { onMounted, onUnmounted } from "vue"
import { useUserStore } from "@/stores/user"
import { useEchoChannel, registry } from "@/composables/useEchoChannel"
import type { SearchRequestUpdatedPayload } from "@/types/common/echo"
import {
  RoleAdmin,
  RoleDirector,
  RoleSellerClient,
  RoleSellerSearch,
} from "@/constants/roles"

const STAFF_ROLES = [RoleAdmin, RoleDirector, RoleSellerClient, RoleSellerSearch]

export function useSearchRequestsRealtime(
  onUpdate: () => void,
  requestId?: () => number | undefined,
  onProposalsUpdate?: () => void,
) {
  const userStore = useUserStore()
  const { join, leave } = useEchoChannel()

  let userChannelName: string | null = null
  let staffChannelName: string | null = null

  function handleEvent(payload: SearchRequestUpdatedPayload) {
    const id = requestId?.()
    if (id !== undefined && payload.request_id !== id) {
      return
    }
    onUpdate()
  }

  function handleProposalsEvent(payload: SearchRequestUpdatedPayload) {
    const id = requestId?.()
    if (id !== undefined && payload.request_id !== id) {
      return
    }
    (onProposalsUpdate ?? onUpdate)()
  }

  function setup() {
    const userId = userStore.currentUserId || userStore.user?.id
    const role = userStore.user?.role
    if (!userId) {
      return
    }

    userChannelName = `user.${userId}`
    join(userChannelName)
      .listen(".search-request.updated", handleEvent)
      .listen(".search-request.proposals-updated", handleProposalsEvent)

    if (role && STAFF_ROLES.includes(role)) {
      staffChannelName = "search-requests.staff"
      join(staffChannelName)
        .listen(".search-request.updated", handleEvent)
        .listen(".search-request.proposals-updated", handleProposalsEvent)
    }
  }

  function teardown() {
    if (userChannelName) {
      registry.get(userChannelName)?.channel
        .stopListening(".search-request.updated", handleEvent)
        .stopListening(".search-request.proposals-updated", handleProposalsEvent)
      leave(userChannelName)
      userChannelName = null
    }

    if (staffChannelName) {
      registry.get(staffChannelName)?.channel
        .stopListening(".search-request.updated", handleEvent)
        .stopListening(".search-request.proposals-updated", handleProposalsEvent)
      leave(staffChannelName)
      staffChannelName = null
    }
  }

  onMounted(setup)
  onUnmounted(teardown)
}
