import { ref } from "vue"
import { useApiListingRequest } from "@/composables/api/useApiListingRequest"
import { RequestTypeBooking } from "@/constants/listingRequests"
import type { ListingRequest, BookingClient } from "@/types/responses/listingRequest"
import type { OptionBase } from "@/types/form/optionType"

export function useBookingRequests() {
  const { getListingRequests, decline, getBookingClients } = useApiListingRequest()

  const rawBookingData = ref<ListingRequest[]>([])
  const allClientOptions = ref<OptionBase[]>([])
  const clientPaidServicesInfo = ref<Map<number, { diagnostic: boolean, compensation: boolean }>>(new Map())
  const isLoading = ref(false)
  const isProcessing = ref(false)

  const loadRequests = async (listingId: number) => {
    isLoading.value = true
    try {
      const resp = await getListingRequests(listingId, {
        filter: { type: RequestTypeBooking },
        limit: 1000,
      })
      rawBookingData.value = resp.data ?? []
    }
    catch (e) {
      console.error("Failed to load booking requests:", e)
    }
    finally {
      isLoading.value = false
    }
  }

  const loadClients = async (listingId: number) => {
    try {
      const resp = await getBookingClients(listingId)
      if (!resp.data) {
        return
      }

      const clients = resp.data as BookingClient[]
      const uniqueClients = new Map<number, string>()
      clients.forEach((c) => {
        if (!uniqueClients.has(c.id)) {
          uniqueClients.set(c.id, c.name)
        }
      })
      allClientOptions.value = Array.from(uniqueClients.entries()).map(([id, name]) => ({
        id,
        value: id,
        name,
        disabled: false,
      }))

      const paidServicesMap = new Map<number, { diagnostic: boolean, compensation: boolean }>()
      clients.forEach(c => paidServicesMap.set(c.user_id, {
        diagnostic: c.has_paid_diagnostic,
        compensation: c.has_paid_compensation,
      }))
      clientPaidServicesInfo.value = paidServicesMap
    }
    catch {
      allClientOptions.value = []
    }
  }

  const declineRequest = async (listingId: number, requestId: number) => {
    isProcessing.value = true
    try {
      await decline(listingId, requestId)
      await Promise.all([loadRequests(listingId), loadClients(listingId)])
    }
    catch (e) {
      console.error("Failed to decline booking:", e)
    }
    finally {
      isProcessing.value = false
    }
  }

  return {
    rawBookingData,
    allClientOptions,
    clientPaidServicesInfo,
    isLoading,
    isProcessing,
    loadRequests,
    loadClients,
    declineRequest,
  }
}
