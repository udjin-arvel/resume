<template>
  <ClientBalanceHistory
    :client-id="userId"
    account-type="deposit"
  />
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useRoute } from "vue-router"
import { RoleAdmin } from "~/constants/roles"
import ClientBalanceHistory from "~/components/client/ClientBalanceHistory.vue"

definePageMeta({
  layout: "personal",
  auth: true,
  roles: [RoleAdmin],
})

const route = useRoute()
const userId = computed(() => Number(route.params.id))
</script>
