import { carStubImage } from "@/constants/catalog"
import type { Media } from "@/types/responses/listing"

export interface CatalogCardImage {
  desktop: string
  mobile: string
  original: string
}

export type PreviewSize = "thumb" | "small" | "medium"

export interface ListingImageMedia {
  url: string
  thumb?: string | null
  small?: string | null
  medium?: string | null
}

const previewChains: Record<PreviewSize, PreviewSize[]> = {
  thumb: ["thumb", "small", "medium"],
  small: ["small", "medium"],
  medium: ["medium"],
}

export function listingImageSrc(m: ListingImageMedia, size: PreviewSize): string {
  for (const key of previewChains[size]) {
    const value = m[key]
    if (value) {
      return value
    }
  }

  return m.url
}

const stubImage: CatalogCardImage = {
  desktop: carStubImage,
  mobile: carStubImage,
  original: carStubImage,
}

export function catalogCardImages(photos: Media[]): CatalogCardImage[] {
  return photos.map((photo) => {
    const original = photo.url
    const desktop = listingImageSrc(photo, "small")

    return {
      desktop,
      mobile: listingImageSrc(photo, "medium") || desktop,
      original,
    }
  })
}

export function catalogCardImagesFromUrls(urls: string[]): CatalogCardImage[] {
  return urls.map(url => ({
    desktop: url,
    mobile: url,
    original: url,
  }))
}

export function displayCatalogImages(images?: CatalogCardImage[]): CatalogCardImage[] {
  return images && images.length > 0 ? images.slice(0, 6) : [stubImage]
}
