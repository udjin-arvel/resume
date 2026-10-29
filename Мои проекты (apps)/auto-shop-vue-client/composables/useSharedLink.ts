import { ref } from "vue"
import { useI18n } from "vue-i18n"
import useListing from "@/composables/useListing"
import { buildListingSharePreview } from "@/utils/listingSharePreview"
import type { ListingFull } from "~/types/responses/listing"

const getLinkDurationOptions = (t: ReturnType<typeof useI18n>["t"]) => [
  { id: 1, value: "12h", name: t("catalog.detail.duration_12h"), disabled: false },
  { id: 2, value: "24h", name: t("catalog.detail.duration_24h"), disabled: false },
  { id: 3, value: "unlimited", name: t("catalog.detail.duration_unlimited"), disabled: false },
]

export interface ShareLinkGenerationResult {
  url: string
  text: string
}

export type ShareLinkSettings = {
  photo: boolean
  video: boolean
  diagnostic: boolean
  compensation: boolean
  price: boolean
  duration: string
  anonymous?: boolean
}

type GetListingForPreview = () => ListingFull | null | undefined | Promise<ListingFull | null | undefined>

export function useSharedLink(
  listingId: number = 0,
  options?: {
    getListing?: GetListingForPreview
  },
) {
  const { t } = useI18n()
  const config = useRuntimeConfig()
  const { shareListing, show } = useListing()

  const isGeneratingLink = ref(false)
  const lastGeneratedShare = ref<ShareLinkGenerationResult | null>(null)

  const resolveListing = async (): Promise<ListingFull | null> => {
    if (options?.getListing) {
      const listing = await options.getListing()
      return listing ?? null
    }

    const listing = await show(listingId)
    return listing ?? null
  }

  const handleGenerateLink = async (settings: ShareLinkSettings) => {
    if (!listingId) {
      return
    }

    isGeneratingLink.value = true
    lastGeneratedShare.value = null

    try {
      const response = await shareListing(listingId, {
        settings: {
          show_photos: settings.photo,
          show_videos: settings.video,
          show_diagnostics: settings.diagnostic,
          show_compensation: settings.compensation,
          show_price: settings.price,
        },
        duration: settings.duration,
      })

      if (response && response.code) {
        const rawDomain = settings.anonymous && config.public.anonymousShareDomain
          ? (config.public.anonymousShareDomain as string)
          : (config.public.shareDomain as string)
        const domain = rawDomain.replace(/\/$/, "")
        const url = `${domain}/catalog/${response.code}`

        const listing = await resolveListing()
        if (listing) {
          const preview = buildListingSharePreview(listing, t, url, {
            showPrice: settings.price,
            includeConditionText: true,
          })
          lastGeneratedShare.value = {
            url,
            text: preview,
          }
        }
        else {
          lastGeneratedShare.value = {
            url,
            text: url,
          }
        }
      }
    }
    catch (e) {
      console.error("Share error:", e)
    }
    finally {
      isGeneratingLink.value = false
    }
  }

  return {
    isGeneratingLink,
    lastGeneratedShare,
    linkDurationOptions: getLinkDurationOptions(t),
    handleGenerateLink,
  }
}
