import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from "vue"

const DEFAULT_GAP = 4

export function useOverflowNavigation<T>(
  items: Ref<T[]>,
  navRef: Ref<HTMLElement | null>,
  measureRef: Ref<HTMLElement | null>,
  gap = DEFAULT_GAP,
) {
  const visibleCount = ref(items.value.length)

  const measure = () => {
    const navEl = navRef.value
    const measureEl = measureRef.value
    if (!navEl || !measureEl) {
      return
    }

    const list = items.value
    const available = navEl.clientWidth
    if (available <= 0) {
      visibleCount.value = list.length
      return
    }

    const children = Array.from(measureEl.children) as HTMLElement[]
    const widths = list.map((_, i) => children[i]?.getBoundingClientRect().width ?? 0)
    const moreWidth = children[list.length]?.getBoundingClientRect().width ?? 0

    let max = 0
    for (let k = 0; k <= list.length; k++) {
      const itemsWidth = widths
        .slice(0, k)
        .reduce((sum, width, idx) => sum + width + (idx > 0 ? gap : 0), 0)
      const needed = itemsWidth + (k < list.length ? gap + moreWidth : 0)
      if (needed <= available) {
        max = k
      }
    }

    visibleCount.value = max
  }

  let observer: ResizeObserver | null = null
  let rafId = 0

  const scheduleMeasure = () => {
    if (typeof requestAnimationFrame === "undefined") {
      measure()
      return
    }
    cancelAnimationFrame(rafId)
    rafId = requestAnimationFrame(() => {
      measure()
    })
  }

  if (typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(() => scheduleMeasure())
  }

  watch(navRef, (el, prev) => {
    if (prev) {
      observer?.unobserve(prev)
    }
    if (el) {
      observer?.observe(el)
    }
  }, { immediate: true })

  onMounted(() => {
    nextTick(scheduleMeasure)
  })

  onBeforeUnmount(() => {
    if (typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(rafId)
    }
    observer?.disconnect()
    observer = null
  })

  watch(items, () => nextTick(scheduleMeasure), { deep: true })

  const visibleItems = computed(() => items.value.slice(0, visibleCount.value))
  const hiddenItems = computed(() => items.value.slice(visibleCount.value))

  return {
    visibleItems,
    hiddenItems,
  }
}
