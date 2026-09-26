<template>
  <NeedsForm
    mode="edit"
    :request-id="id"
  />
</template>

<script setup lang="ts">
import { useRoute } from "vue-router"
import NeedsForm from "@/components/needs/NeedsForm.vue"
import { RoleEmployee, RoleDirector, RoleAdmin } from "~/constants/roles"

definePageMeta({
  auth: true,
  roles: [RoleEmployee, RoleDirector, RoleAdmin],
  layout: "personal",
  hideTitle: true,
})

const route = useRoute()
const id = Number(route.params.id)
</script>
