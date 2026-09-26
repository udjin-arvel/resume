<template>
  <ChatLayout />
</template>

<script setup lang="ts">
import ChatLayout from "~/components/chat/ChatLayout.vue"
import {
  RoleAdmin,
  RoleDirector,
  RoleEmployee, RoleLogistic,
  RoleSellerClient,
  RoleSellerContent,
  RoleSellerSearch,
} from "~/constants/roles"

definePageMeta({
  auth: true,
  layout: "personal",
  hideTitle: true,
  hideBread: true,
  fillHeight: true,
  roles: [RoleSellerClient, RoleSellerSearch,
    RoleSellerContent, RoleAdmin, RoleDirector, RoleEmployee, RoleLogistic],
})
</script>
