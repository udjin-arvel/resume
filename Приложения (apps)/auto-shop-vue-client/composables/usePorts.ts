import { ref, computed } from "vue"
import { useI18n } from "vue-i18n"
import { useApiPorts } from "@/composables/api/useApiPorts"
import type { Port } from "@/types/responses/port"
import type { OptionBase } from "@/types/form/optionType"

export default function usePorts() {
  const { index } = useApiPorts()
  const { locale } = useI18n()

  const ports = useState<Port[]>("logistic_ports_list", () => [])
  const isLoading = ref(false)

  const reload = async (force = false) => {
    if (ports.value.length > 0 && !force) {
      return
    }

    isLoading.value = true
    try {
      const response = await index()
      if (response.data) {
        ports.value = response.data
      }
    }
    catch (e) {
      console.error("Failed to load ports:", e)
    }
    finally {
      isLoading.value = false
    }
  }

  const portName = (port: Port): string => {
    const localized = locale.value === "zh" ? port.name_zh : port.name_ru
    return localized || port.name_en || port.code
  }

  const portNameByCode = (code: string): string => {
    const port = ports.value.find(p => p.code === code)
    return port ? portName(port) : code
  }

  const findPort = (code: string | undefined): Port | undefined =>
    code ? ports.value.find(p => p.code === code) : undefined

  const portOptions = computed<OptionBase[]>(() =>
    ports.value.map((port, idx) => ({
      id: port.id ?? idx + 1,
      value: port.code,
      name: portName(port),
      disabled: false,
    })),
  )

  return {
    ports,
    reload,
    isLoading,
    portName,
    portNameByCode,
    findPort,
    portOptions,
  }
}
