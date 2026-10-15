<template>
  <Catalog
    :is-seller="false"
    :title="t('catalog.list.cars_title')"
    :tab-config="{
      inSale: false,
      inDelivery: true,
      inDeliveryShowBadge: false,
      bought: true,
      sold: false,
      withdrawn: false,
      deleted: false,
      archive: false,
    }"
  />
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n"
import Catalog from "~/components/catalog/Catalog.vue"
import { RoleAdmin, RoleDirector, RoleEmployee } from "~/constants/roles"

const { t } = useI18n()

definePageMeta({
  auth: true,
  hideTitle: true,
  layout: "catalog",
  roles: [RoleDirector, RoleAdmin, RoleEmployee],
})
</script>
