<template>
  <div>
    <slot name="header" />
    <div :class="containerClass">
      <TileCard
        v-for="(car, index) in cars"
        :key="index"
        :name="car.name"
        :images="catalogCardImagesFromUrls(car.images)"
        :description="car.description"
        :price="car.price"
        :link="car.link"
        :has-diagnostics="car.hasDiagnostics"
        :has-videos="car.hasVideos"
        :diagnostic-requested="car.diagnosticRequested"
        :compensation-requested="car.compensationRequested"
        :video-requested="car.videoRequested"
        :video-loaded="car.videoLoaded"
        :diagnostic-loaded="car.diagnosticLoaded"
        :compensation-loaded="car.compensationLoaded"
        :booking-requested="car.bookingRequested"
        :diagnostic-subscribed="car.diagnosticSubscribed"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import TileCard from "~/components/catalog/TileCard.vue"
import { catalogCardImagesFromUrls } from "@/utils/catalogImages"

defineProps<{
  cars: Array<{
    name: string
    images: Array<string>
    description: string
    price: string | number
    link: string
    hasDiagnostics: boolean
    hasVideos: boolean
    diagnosticRequested: boolean
    compensationRequested: boolean
    videoRequested: boolean
    diagnosticLoaded: boolean
    compensationLoaded: boolean
    diagnosticSubscribed: boolean
    videoLoaded: boolean
    bookingRequested: boolean
  }>
  containerClass?: string
}>()
</script>
