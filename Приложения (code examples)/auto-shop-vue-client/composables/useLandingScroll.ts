export function useLandingScroll() {
  const scrollTo = (id: string) => {
    const target = document.getElementById(id)
    if (!target) {
      return
    }
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" })
  }

  return { scrollTo }
}
