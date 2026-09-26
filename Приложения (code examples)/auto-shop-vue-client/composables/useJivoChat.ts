const JIVO_WIDGET_ID = "jivo-widget-script"
const JIVO_WIDGET_SRC = "//code.jivo.ru/widget/a7GtoOqx1j"

export function useJivoChat() {
  onMounted(() => {
    if (typeof window.jivo_init === "function") {
      window.jivo_init()
      return
    }

    if (document.getElementById(JIVO_WIDGET_ID)) {
      return
    }

    const script = document.createElement("script")
    script.id = JIVO_WIDGET_ID
    script.src = JIVO_WIDGET_SRC
    script.async = true
    document.head.appendChild(script)
  })

  onBeforeUnmount(() => {
    if (typeof window.jivo_destroy === "function") {
      window.jivo_destroy()
    }
  })
}
