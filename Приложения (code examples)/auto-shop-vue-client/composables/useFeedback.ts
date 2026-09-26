import { useApiFeedback } from "@/composables/api/useApiFeedback"
import { useApiAction } from "@/composables/useApiAction"

export function useFeedback() {
  const { run, isLoading, errors } = useApiAction()
  const { sendFeedback: _sendFeedback } = useApiFeedback()

  async function submitFeedback(payload: { name: string, phone: string, city: string }) {
    return run(async () => {
      const response = await _sendFeedback(payload)
      return response?.data || true
    })
  }

  return {
    submitFeedback,
    isLoading,
    errors,
  }
}
