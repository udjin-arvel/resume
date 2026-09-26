<template>
  <NeedsForm mode="create" />
</template>

<script setup lang="ts">
import NeedsForm from "@/components/needs/NeedsForm.vue"
import { RoleEmployee, RoleDirector, RoleAdmin } from "~/constants/roles"

definePageMeta({
  auth: true,
  roles: [RoleEmployee, RoleDirector, RoleAdmin],
  layout: "personal",
  hideTitle: true,
})
</script>
