<template>
  <div />
</template>

<script setup lang="ts">
import type { VerifyEmail as VerifyEmailRequest } from "@/types/requests/auth/verifyEmail"
import { loginPage } from "@/constants/pages"

definePageMeta({
  layout: "auth",
  auth: false,
  compact: false,
})

const route = useRoute()
const { verify } = useAuth()

onMounted(async () => {
  const id = route.params.id as string
  const hash = route.params.hash as string
  const expires = route.query.expires as string
  const signature = route.query.signature as string

  try {
    await verify(id, hash, {
      expires: expires,
      signature: signature,
    } as VerifyEmailRequest, {
      callbackUrl: "/personal/profile",
    })
  }
  catch {
    navigateTo(loginPage)
  }
})
</script>

<style module></style>
