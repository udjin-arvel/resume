import Echo from "laravel-echo"
import Pusher from "pusher-js"
import { useTokenStore } from "@/stores/token"

// @ts-expect-error: window.Pusher не имеет типового описания
window.Pusher = Pusher

export default defineNuxtPlugin(() => {
  const tokenStore = useTokenStore()
  const config = useRuntimeConfig()

  const portStr = String(config.public.reverb.port || "443")
  const wsPort = parseInt(portStr, 10)
  const forceTLS = config.public.reverb.scheme === "https"

  const echo = new Echo({
    broadcaster: "reverb",
    key: config.public.reverb.key,
    wsHost: config.public.reverb.host,
    wsPort: wsPort,
    wssPort: wsPort,
    forceTLS: forceTLS,
    disableStats: true,
    enabledTransports: ["ws", "wss"],
    namespace: "",
    authorizer: (channel: { name: string }) => ({
      authorize: (socketId: string, callback: (error: Error | null, data: any) => void) => {
        $fetch(`${config.public.apiBase}broadcasting/auth`, {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            ...(tokenStore.token ? { Authorization: `Bearer ${tokenStore.token}` } : {}),
          },
          body: {
            socket_id: socketId,
            channel_name: channel.name,
          },
        })
          .then(response => callback(null, response))
          .catch((error: Error) => callback(error, null))
      },
    }),
  })

  return {
    provide: { echo },
  }
})
