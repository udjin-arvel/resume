import type { ApiListStrictResponse, ApiResponse } from "@/types/responses/response"
import type { UnreadTotalsPayload } from "@/types/common/unread"
import type { Chat } from "@/types/common/chat"
import { useApiParamTransform } from "@/composables/api/useApiParamTransform"
import type {
  ChatListRequest,
  GetBuyerSellerRequest,
  GetSearchRequestChatRequest,
  GetAdminUserRequest,
  FilterOptions,
} from "@/types/requests/chat"

export function useApiChat() {
  const { call } = useApiParamTransform()
  const baseUrl = "api/v1/chats"

  const index = (
    params: ChatListRequest = {},
    opts: { camelize?: boolean, snakeParams?: boolean } = {},
  ) =>
    call<ApiListStrictResponse<Chat>>(baseUrl, { method: "GET", params }, { ...opts, snakeParams: true })

  const filterOptions = (opts: { camelize?: boolean, snakeParams?: boolean } = {}) =>
    call<ApiResponse<FilterOptions>>(`${baseUrl}/filters`, { method: "GET" }, opts)

  const markAsUnread = (chatId: number) =>
    call<ApiResponse<UnreadTotalsPayload>>(`${baseUrl}/${chatId}/mark-unread`, { method: "POST" })

  const markAsRead = (chatId: number) =>
    call<ApiResponse<UnreadTotalsPayload>>(`${baseUrl}/${chatId}/mark-read`, { method: "POST" })

  const show = (
    chatId: number,
    opts: { camelize?: boolean } = {},
  ) =>
    call<ApiResponse<Chat>>(`${baseUrl}/${chatId}`, { method: "GET" }, opts)

  const getBuyerSeller = (payload: GetBuyerSellerRequest) =>
    call<ApiResponse<Chat>>(
      `${baseUrl}/get_buyer_seller`,
      { method: "GET", params: payload },
      { snakeParams: true },
    )

  const getSearchRequest = (payload: GetSearchRequestChatRequest) =>
    call<ApiResponse<Chat>>(
      `${baseUrl}/get_search_request`,
      { method: "GET", params: payload },
      { snakeParams: true },
    )

  const getAdminUser = (payload: GetAdminUserRequest) =>
    call<ApiResponse<Chat>>(
      `${baseUrl}/get_admin_user`,
      { method: "GET", params: payload },
      { snakeParams: true },
    )

  return { index, filterOptions, markAsUnread, markAsRead, show, getAdminUser, getBuyerSeller, getSearchRequest }
}
