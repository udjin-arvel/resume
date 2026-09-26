import { computed, ref, toValue, type MaybeRef } from "vue"
import { storeToRefs } from "pinia"
import { useI18n } from "vue-i18n"
import { useApiListing } from "@/composables/api/useApiListing"
import { useUserStore } from "@/stores/user"
import { SaleStatusWithdrawn } from "@/constants/catalog"
import type { MenuActions } from "@/types/common/menuActions"
import { navigateTo } from "#app"

export function useCatalogCardMenu(
  listingId: string | number,
  refreshListings: () => void,
  visibility: string = "visible",
  totalVideo: MaybeRef<number> = 0,
  totalDiagnostic: MaybeRef<number> = 0,
  totalCompensation: MaybeRef<number> = 0,
  totalBooking: MaybeRef<number> = 0,
  totalMessages: MaybeRef<number> = 0,
  deleted: boolean = false,
  saleStatus: string | null = null,
) {
  const { t } = useI18n()
  const { hide, unhide, destroy, restore, withdraw } = useApiListing()
  const userStore = useUserStore()
  const { isAdmin, isSellerContent, isSellerSearch } = storeToRefs(userStore)

  const isAddToRequestModalOpen = ref(false)
  const isReturnToSaleModalOpen = ref(false)

  const openAddToRequestModal = () => {
    isAddToRequestModalOpen.value = true
  }

  const closeAddToRequestModal = () => {
    isAddToRequestModalOpen.value = false
  }

  const closeReturnToSaleModal = () => {
    isReturnToSaleModalOpen.value = false
  }

  const menuActionGroups = computed((): MenuActions[][] => {
    if (deleted) {
      return [[
        {
          label: t("catalog.actions.restore"),
          action: async () => {
            await restore(Number(listingId))
            refreshListings()
          },
          disabled: false,
        },
      ]]
    }

    if (saleStatus === SaleStatusWithdrawn) {
      const withdrawnActions: MenuActions[] = [
        {
          label: t("catalog.actions.return_to_sale"),
          action: () => {
            navigateTo({ name: "personal-listings-id", params: { id: listingId } })
          },
          disabled: false,
        },
      ]

      if (isAdmin.value) {
        withdrawnActions.push({
          label: t("catalog.actions.delete"),
          action: async () => {
            await destroy(Number(listingId))
            refreshListings()
          },
          disabled: false,
          style: "red",
        })
      }

      return [withdrawnActions]
    }

    const actions = [
      {
        label: t("catalog.actions.view_edit"),
        key: "view_edit",
        action: () => {
          navigateTo({ name: "personal-listings-id", params: { id: listingId } })
        },
        disabled: false,
      },
      {
        label: visibility === "hidden" ? t("catalog.actions.unhide") : t("catalog.actions.hide"),
        key: "hide_unhide",
        action: async () => {
          if (visibility === "hidden") {
            await unhide(Number(listingId))
          }
          else {
            await hide(Number(listingId))
          }
          refreshListings()
        },
        disabled: false,
      },
      {
        label: `${t("catalog.actions.video_requests")} (${toValue(totalVideo)})`,
        key: "video_requests",
        action: () => {
          navigateTo({ name: "personal-listings-id-video", params: { id: listingId } })
        },
        disabled: false,
      },
      {
        label: `${t("catalog.actions.diagnostic_requests")} (${toValue(totalDiagnostic)})`,
        key: "diagnostic_requests",
        action: () => {
          navigateTo({ name: "personal-listings-id-diagnostic", params: { id: listingId } })
        },
        disabled: false,
      },
      {
        label: `${t("catalog.actions.compensation_requests")} (${toValue(totalCompensation)})`,
        key: "compensation_requests",
        action: () => {
          navigateTo({ name: "personal-listings-id-compensation", params: { id: listingId } })
        },
        disabled: false,
      },
      {
        label: `${t("catalog.actions.booking_requests")} (${toValue(totalBooking)})`,
        key: "booking_requests",
        action: () => {
          navigateTo({ name: "personal-listings-id-booking", params: { id: listingId } })
        },
        disabled: false,
      },
      {
        label: `${t("catalog.actions.chats")} (${toValue(totalMessages)})`,
        key: "chats",
        action: () => {
          navigateTo({
            path: "/personal/chats",
            query: { listingId: String(listingId) },
          })
        },
        disabled: false,
      },
      {
        label: t("catalog.actions.add_to_request"),
        key: "add_to_request",
        action: () => {
          openAddToRequestModal()
        },
        disabled: false,
      },
      {
        label: t("catalog.actions.withdraw"),
        key: "withdraw",
        action: async () => {
          await withdraw(Number(listingId))
          refreshListings()
        },
        disabled: false,
      },
      {
        label: t("catalog.actions.delete"),
        key: "delete",
        action: async () => {
          await destroy(Number(listingId))
          refreshListings()
        },
        disabled: false,
        style: "red" as const,
      },
    ]

    return [
      actions.filter((item) => {
        if (item.key === "delete" && !isAdmin.value) {
          return false
        }

        if (isSellerContent.value) {
          const restricted = [
            "booking_requests",
            "diagnostic_requests",
            "compensation_requests",
            "chats",
            "video_requests",
            "add_to_request",
          ]
          if (restricted.includes(item.key)) {
            return false
          }
        }

        if (isSellerSearch.value) {
          const restricted = [
            "booking_requests",
            "diagnostic_requests",
            "compensation_requests",
            "chats",
          ]
          if (restricted.includes(item.key)) {
            return false
          }
        }

        return true
      }),
    ]
  })

  return {
    menuActionGroups,
    isAddToRequestModalOpen,
    closeAddToRequestModal,
    isReturnToSaleModalOpen,
    closeReturnToSaleModal,
  }
}
