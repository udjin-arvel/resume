import { onBeforeUnmount, onMounted, ref, type Ref } from "vue"

export function useCountUp(target: Ref<HTMLElement | null>, to: number, duration: number) {
  const value = ref(to)
  let observer: IntersectionObserver | null = null
  let frame = 0

  const run = () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduceMotion) {
      value.value = to
      return
    }

    let start: number | null = null
    const tick = (timestamp: number) => {
      if (start === null) {
        start = timestamp
      }
      const progress = Math.min((timestamp - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      value.value = Math.round(eased * to)
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }
    frame = requestAnimationFrame(tick)
  }

  onMounted(() => {
    const element = target.value
    if (!element || !("IntersectionObserver" in window)) {
      return
    }

    value.value = 0
    observer = new IntersectionObserver((entries) => {
      if (entries.some(entry => entry.isIntersecting)) {
        run()
        observer?.disconnect()
        observer = null
      }
    }, { threshold: 0.5 })
    observer.observe(element)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    cancelAnimationFrame(frame)
  })

  return { value }
}
