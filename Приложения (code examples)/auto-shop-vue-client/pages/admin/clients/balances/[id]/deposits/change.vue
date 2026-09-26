<template>
  <ClientBalanceChange
    :client-id="userId"
    account-type="deposit"
  />
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useRoute } from "vue-router"
import { RoleAdmin } from "~/constants/roles"
import ClientBalanceChange from "@/components/client/ClientBalanceChange.vue"

definePageMeta({
  layout: "personal",
  auth: true,
  roles: [RoleAdmin],
  hideTitle: true,
})

const route = useRoute()
const userId = computed(() => Number(route.params.id))
</script>
