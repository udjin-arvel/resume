import { computed, ref, type Ref } from "vue"
import type { OptionBase } from "@/types/form/optionType"
import type { RequestOption } from "@/types/responses/searchRequest"
import type { SearchRequestBinding } from "@/types/responses/searchRequestBinding"
import { RequestStatusInWork, RequestStatusOnBooking } from "@/constants/statuses"

export function useListingRequestSelection(options: Ref<RequestOption[]>, selection: Ref<OptionBase[]>) {
  const { t } = useI18n()
  const attachedOptions = ref<RequestOption[]>([])
  const lockedOptions = computed(() => attachedOptions.value.filter(option => option.status === RequestStatusOnBooking))
  const isLocked = (option: OptionBase) => lockedOptions.value.some(locked => Number(locked.value) === Number(option.value))

  const selectedRequests = computed({
    get: () => selection.value,
    set: (value: OptionBase[]) => {
      const next = value.filter(option =>
        attachedOptions.value.some(attached => Number(attached.value) === Number(option.value))
        || options.value.some(available => Number(available.value) === Number(option.value) && !available.disabled),
      )
      for (const locked of lockedOptions.value) {
        if (!next.some(option => Number(option.value) === locked.value)) {
          next.push(locked)
        }
      }
      selection.value = next
    },
  })

  const initialize = (bindings: SearchRequestBinding[]) => {
    attachedOptions.value = bindings.filter((binding) => {
      const paused = binding.status === RequestStatusOnBooking
      if (paused && binding.proposal_source === "auto" && binding.proposal_status === "rejected") {
        return false
      }
      return paused || options.value.some(option => Number(option.value) === Number(binding.value))
    }).map((binding) => {
      const available = options.value.find(option => Number(option.value) === Number(binding.value))
      const name = available?.name ?? [
        `${t("needs.request_label")} №${String(binding.request_id).padStart(4, "0")}`,
        binding.created_at,
        binding.client_name,
      ].filter(Boolean).join(", ")
      const paused = binding.status === RequestStatusOnBooking
      return {
        ...available,
        id: binding.id,
        value: binding.value,
        name: paused && !available?.disabled_reason ? `${name} — ${t("needs.booking_action_blocked")}` : name,
        status: binding.status,
        disabled: paused || !!available?.disabled || binding.status !== RequestStatusInWork,
        disabled_reason: paused ? "booking_pending" : available?.disabled_reason,
      }
    })
    const attachedIds = new Set(attachedOptions.value.map(option => option.value))
    options.value = [
      ...options.value.filter(option => !attachedIds.has(option.value)),
      ...attachedOptions.value,
    ]
    selection.value = [...attachedOptions.value]
  }

  return { selectedRequests, initialize, isLocked }
}
