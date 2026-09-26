<template>
  <Catalog
    :is-seller="true"
    :title="t('catalog.list.title')"
    :tab-config="{
      inSale: true,
      inDelivery: false,
      inDeliveryShowBadge: false,
      bought: false,
      sold: true,
      withdrawn: true,
      deleted: true,
      archive: false,
    }"
  />
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n"
import Catalog from "~/components/catalog/Catalog.vue"
import { RoleAdmin, RoleSellerClient, RoleSellerContent, RoleSellerSearch } from "@/constants/roles"

const { t } = useI18n()

definePageMeta({
  auth: true,
  roles: [RoleAdmin, RoleSellerSearch, RoleSellerContent, RoleSellerClient],
  hideTitle: true,
  layout: "catalog",
})
</script>
