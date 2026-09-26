<template>
  <Catalog
    :is-seller="false"
    :title="t('catalog.list.title')"
    :tab-config="{
      inSale: true,
      inDelivery: false,
      inDeliveryShowBadge: false,
      bought: false,
      sold: false,
      withdrawn: false,
      deleted: false,
      archive: true,
      favorites: isAuthenticated,
    }"
  />
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia"
import { useI18n } from "vue-i18n"
import Catalog from "~/components/catalog/Catalog.vue"
import { RoleAdmin, RoleDirector, RoleEmployee } from "~/constants/roles"
import { useUserStore } from "~/stores/user"

const { t } = useI18n()
const { isAuthenticated } = storeToRefs(useUserStore())

definePageMeta({
  auth: false,
  hideTitle: true,
  layout: "catalog",
  roles: [RoleDirector, RoleAdmin, RoleEmployee],
})
</script>
