<template>
  <ClientBalanceHistory
    v-if="clientId"
    :client-id="clientId"
    account-type="deposit"
    hide-edit
  />
</template>

<script setup lang="ts">
import { computed } from "vue"
import { RoleDirector } from "~/constants/roles"
import ClientBalanceHistory from "@/components/client/ClientBalanceHistory.vue"
import { useUserStore } from "@/stores/user"

definePageMeta({
  layout: "personal",
  auth: true,
  roles: [RoleDirector],
})

const userStore = useUserStore()

const clientId = computed(() => userStore.user?.client_id)
</script>
