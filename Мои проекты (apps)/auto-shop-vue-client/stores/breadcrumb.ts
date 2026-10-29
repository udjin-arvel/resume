import { defineStore } from "pinia"
import { ref } from "vue"

export const useBreadcrumbStore = defineStore("breadcrumb", () => {
  const breadcrumb = ref("")

  function updateBreadcrumb(newBreadcrumb: string) {
    breadcrumb.value = newBreadcrumb
  }

  return { breadcrumb, updateBreadcrumb }
})
