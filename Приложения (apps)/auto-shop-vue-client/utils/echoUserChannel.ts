import { watch } from "vue"

interface EchoUserChannelOptions {
  echo: any
  getUserId: () => number | null
  subscribe: (userId: number) => void
  unsubscribe?: () => void
}

export function watchEchoUserChannel(options: EchoUserChannelOptions): void {
  let subscribedUserId: number | null = null

  watch(
    options.getUserId,
    (userId) => {
      if (userId === subscribedUserId) {
        return
      }

      if (subscribedUserId !== null) {
        options.echo.leave(`user.${subscribedUserId}`)
        options.unsubscribe?.()
        subscribedUserId = null
      }

      if (userId) {
        subscribedUserId = userId
        options.subscribe(userId)
      }
    },
    { immediate: true },
  )
}
