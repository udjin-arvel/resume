import { onBeforeUnmount, onMounted, type Ref } from "vue"

export function useRevealOnScroll(root: Ref<HTMLElement | null>, selector = ".ld-reveal") {
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    const rootElement = root.value
    if (!rootElement) {
      return
    }

    const items = Array.from(rootElement.querySelectorAll<HTMLElement>(selector))
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (!("IntersectionObserver" in window) || reduceMotion) {
      items.forEach((item) => {
        item.classList.add("is-in")
      })
      return
    }

    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in")
          observer?.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" })

    items.forEach((item) => {
      observer?.observe(item)
    })
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })
}
