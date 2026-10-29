<template>
  <span>{{ header }}</span>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import type { ChatRole } from "@/types/common/chat"
import { ChatRoles } from "~/constants/chat"

const props = defineProps<{
  author: string
  role: ChatRole
  isSelf?: boolean
}>()

const { t } = useI18n()

const header = computed(() => {
  let name = props.author

  if (props.isSelf || props.role === "self") {
    name = ""
  }
  else if (props.role === ChatRoles.Admin) {
    name = t("chat.admin")
  }
  else if (props.role === ChatRoles.Logistic) {
    name = t("chat.logistic")
  }

  return name
})
</script>
