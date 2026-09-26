// nuxt-yandex-metrika injects <noscript><div><img ...></noscript> into <head> without closing </div>.
// HTML5 parser doesn't implicitly close <div> before </noscript>, so the whole page body ends up
// nested inside the unclosed <div>. We remove that tag from <head> and inject a properly
// formed noscript (with </div>) at the beginning of <body>, as Yandex recommends.
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("render:html", (html) => {
    // Match noscript with or without closing </div> — the module omits it
    const headPattern = /<noscript[^>]*>[\s\S]*?mc\.yandex\.ru[\s\S]*?(?:<\/noscript>|$)/i

    let metrId: string | null = null

    for (let i = 0; i < html.head.length; i++) {
      const match = html.head[i].match(headPattern)
      if (match) {
        const idMatch = match[0].match(/mc\.yandex\.ru\/watch\/(\d+)/)
        if (idMatch) {
          metrId = idMatch[1]
        }
        html.head[i] = html.head[i].replace(headPattern, "")
        break
      }
    }

    if (!metrId) {
      const cfg = useRuntimeConfig()
      metrId = (cfg.public as Record<string, any>).yandexMetrika?.id ?? null
    }

    if (metrId) {
      const noscript = `<noscript><div><img src="https://mc.yandex.ru/watch/${metrId}" style="position:absolute; left:-9999px;" alt=""></div></noscript>`
      if (!Array.isArray(html.bodyPrepend)) {
        html.bodyPrepend = []
      }
      html.bodyPrepend.unshift(noscript)
    }
  })
})
