/** Meta-теги, которые должны быть в начале <head> для превью ссылок. */
const SEO_META_RE = /<meta\b(?=[^>]*(?:property="og:[^"]+"|property="twitter:[^"]+"|name="description"|name="twitter:[^"]+"))[^>]*>/gi

function prioritizeSeoMetaInHead(headHtml: string): string {
  const tags = headHtml.match(SEO_META_RE)
  if (!tags?.length) {
    return headHtml
  }

  const result = headHtml.replace(SEO_META_RE, "")
  const seoBlock = tags.join("")

  const titleMatch = result.match(/<title[^>]*>[\s\S]*?<\/title>/i)
  if (titleMatch?.index !== undefined) {
    const insertPos = titleMatch.index + titleMatch[0].length
    return result.slice(0, insertPos) + seoBlock + result.slice(insertPos)
  }

  const viewportMatch = result.match(/<meta\s+name="viewport"[^>]*>/i)
  if (viewportMatch?.index !== undefined) {
    const insertPos = viewportMatch.index + viewportMatch[0].length
    return result.slice(0, insertPos) + seoBlock + result.slice(insertPos)
  }

  return seoBlock + result
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("render:html", (html) => {
    if (!html.head?.length) {
      return
    }

    html.head = html.head.map(chunk => prioritizeSeoMetaInHead(chunk))
  })
})
