import { useChatStore } from "@/stores/chat"

export function usePresenceChat(chatId: number) {
  const { $echo } = useNuxtApp() as any
  const chatStore = useChatStore()

  const channelName = `chat.${chatId}`

  $echo.join(channelName)
    .here((users: any[]) => {
      chatStore.setOnlineParticipants(chatId, users)
    })
    .joining((user: any) => {
      chatStore.addOnlineParticipant(chatId, user)
    })
    .leaving((user: any) => {
      chatStore.removeOnlineParticipant(chatId, user)
    })

  return () => {
    $echo.leave(`presence-${channelName}`)
    chatStore.setOnlineParticipants(chatId, [])
  }
}
