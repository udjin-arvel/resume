const SKIP_PREFIXES = ["/_nuxt", "/api", "/__nuxt", "/sitemap.xml"]

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname
  const search = getRequestURL(event).search

  if (SKIP_PREFIXES.some(prefix => path.startsWith(prefix))) {
    return
  }

  const deduped = path.replace(/\/+/g, "/")
  const lowered = deduped.toLowerCase()

  if (lowered !== path) {
    return sendRedirect(event, lowered + search, 301)
  }
})
