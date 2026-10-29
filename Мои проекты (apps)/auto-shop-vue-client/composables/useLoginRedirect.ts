import { loginPage } from "@/constants/pages"

export function useLoginRedirect() {
  const route = useRoute()

  const goToLogin = () => {
    return navigateTo({
      path: loginPage,
      query: { redirect: route.fullPath },
    })
  }

  return { goToLogin }
}
