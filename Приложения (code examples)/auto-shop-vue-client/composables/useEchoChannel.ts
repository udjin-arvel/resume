import { useNuxtApp } from "nuxt/app"
import type { ChannelEntry, PrivateChannel } from "@/types/common/echo"

export const registry = new Map<string, ChannelEntry>()

export function useEchoChannel() {
  const { $echo } = useNuxtApp()

  function join(channelName: string): PrivateChannel {
    if (registry.has(channelName)) {
      const entry = registry.get(channelName)!
      entry.refCount++
      return entry.channel
    }

    const channel = $echo.private(channelName) as PrivateChannel
    registry.set(channelName, { channel, refCount: 1 })
    return channel
  }

  function leave(channelName: string): void {
    const entry = registry.get(channelName)
    if (!entry) {
      return
    }

    entry.refCount--
    if (entry.refCount <= 0) {
      registry.delete(channelName)
    }
  }

  return { join, leave }
}
