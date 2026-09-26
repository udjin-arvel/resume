import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import updateLocale from "dayjs/plugin/updateLocale"
import "dayjs/locale/ru"
import "dayjs/locale/zh-cn"

dayjs.extend(relativeTime)
dayjs.extend(updateLocale)

export default defineNuxtPlugin((nuxtApp) => {
  const i18n = nuxtApp.$i18n as unknown as { locale: Ref<string> }

  if (i18n?.locale?.value) {
    syncDayjsLocale(i18n.locale.value)
    watch(i18n.locale, (newLocale: string) => syncDayjsLocale(newLocale))
  }
})

function syncDayjsLocale(locale: string) {
  switch (locale) {
    case "zh":
    case "zh-CN":
      dayjs.locale("zh-cn")
      break
    case "ru":
      dayjs.locale("ru")
      break
    default:
      dayjs.locale("en")
  }
}
