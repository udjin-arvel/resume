import type { ApiListStrictResponse, ApiResponse } from "@/types/responses/response"
import type { ChatMessage } from "@/types/common/chat"
import type { ChatMessagesRequest } from "@/types/requests/chat"
import { useApiParamTransform } from "@/composables/api/useApiParamTransform"

export function useApiChatMessages() {
  const { call } = useApiParamTransform()
  const baseUrl = "api/v1/chats"

  const index = (
    chatId: number | string,
    params: ChatMessagesRequest = {},
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) => call<ApiListStrictResponse<ChatMessage>>(`${baseUrl}/${chatId}/messages`, { method: "GET", params }, opts)

  const store = (
    chatId: number | string,
    payload: { text: string, mentions?: string[], files?: number[] },
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) => call<ApiResponse<ChatMessage>>(`${baseUrl}/${chatId}/messages`, { method: "POST", body: payload }, opts)

  const translate = (
    messageId: number | string,
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) =>
    call<ApiResponse<ChatMessage>>(
      `${baseUrl}/translate/${messageId}`,
      { method: "PUT" },
      opts,
    )

  return { index, store, translate }
}
