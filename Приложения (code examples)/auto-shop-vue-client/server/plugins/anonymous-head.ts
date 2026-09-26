const TRANSPARENT_ICON
  = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAen63NgAAAAASUVORK5CYII="

const toHostname = (url: string) =>
  url.replace(/^https?:\/\//, "").split("/")[0].split(":")[0]

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("render:html", (html, { event }) => {
    const anonymousDomain = useRuntimeConfig(event).public.anonymousShareDomain as string
    if (!anonymousDomain) {
      return
    }

    const host = (getRequestHeader(event, "host") || "").split(":")[0]
    if (host !== toHostname(anonymousDomain)) {
      return
    }

    html.head.push(`<link rel="icon" href="${TRANSPARENT_ICON}">`)
  })
})
