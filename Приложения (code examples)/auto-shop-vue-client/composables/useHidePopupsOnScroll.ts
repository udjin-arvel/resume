import { useThrottleFn } from "@vueuse/core"

export function useHidePopupsOnScroll(wrapper: Ref<HTMLElement | null>, delay = 1000) {
  const hidePopups = useThrottleFn(() => {
    document.querySelectorAll("div > div[role='menu']").forEach((menu) => {
      const parent = menu.parentElement
      if (parent && parent.parentElement === document.body) {
        parent.remove()
      }
    })
  }, delay)

  onMounted(() => {
    const el = wrapper.value
    el?.addEventListener("wheel", hidePopups, { passive: true })
    el?.addEventListener("scroll", hidePopups, { passive: true })
  })

  onBeforeUnmount(() => {
    const el = wrapper.value
    el?.removeEventListener("wheel", hidePopups)
    el?.removeEventListener("scroll", hidePopups)
  })
}
