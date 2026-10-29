import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type {
  IAIModelsList,
  IUser,
  IGenerationResponse,
  IGenerationStatusResponse,
  IGenerationHistoryResponse,
  TGenerationType,
  IGenerationHistoryResponseDTO,
  INotificationsResponse,
  ISamplesListResponse,
  ISample,
  SampleGender,
  IAiChatListItem,
  ICreateNewAiChatResponse,
  TCurrentChatMessagesResponse,
  IAiChatMessage,
  IUploadAssetResponse,
  TChatAttachment
} from '../models/models'
import { API_URL } from '../сonstants/constants'
import Cookies from 'js-cookie'
import { actions as aiChatActions } from '../../4_entities/reduxSlices/AiChatSlice'
import type { RootState } from '../../0_app/redux/store'

type TSseParsedEvent = {
  event: string | null;
  data: string;
}

type TAssistantChunk = {
  text: string;
  mode: 'append' | 'replace';
}

const logSseChunkDev = (params: { chatId: number; seq: number; chunk: TAssistantChunk; rawData: string }) => {
  if (!import.meta.env.DEV) return;
  const safeTail = params.chunk.text.slice(-24).replace(/\n/g, '\\n');
  // debug log
  console.log('[chat-sse]', {
    chatId: params.chatId,
    seq: params.seq,
    mode: params.chunk.mode,
    chunkLen: params.chunk.text.length,
    chunkTail: safeTail,
    rawLen: params.rawData.length,
  });
}

const parseSseEvent = (rawEvent: string): TSseParsedEvent | null => {
  const lines = rawEvent.split('\n');
  let eventName: string | null = null;
  const dataParts: string[] = [];

  lines.forEach((line) => {
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim().toLowerCase();
      return;
    }
    if (line.startsWith('data:')) {
      const dataPart = line.slice(5);
      // SSE allows a single optional leading whitespace after "data:"
      dataParts.push(dataPart.startsWith(' ') ? dataPart.slice(1) : dataPart);
    }
  });

  if (!dataParts.length && !eventName) return null;
  return {
    event: eventName,
    data: dataParts.join('\n'),
  };
}

const tryParseJson = (data: string): Record<string, unknown> | null => {
  try {
    const parsed = JSON.parse(data) as unknown;
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

const isDoneEvent = (eventName: string | null, data: string, payload: Record<string, unknown> | null) => {
  const doneEventNames = new Set(['done', 'complete', 'completed', 'end', 'finish', 'finished']);
  if (eventName && doneEventNames.has(eventName)) return true;
  if (data === '[DONE]') return true;

  if (!payload) return false;
  if (payload.done === true || payload.finished === true || payload.complete === true) return true;
  if (typeof payload.status === 'string') {
    return doneEventNames.has(payload.status.toLowerCase());
  }
  return false;
}

const getAssistantChunk = (payload: Record<string, unknown> | null, fallbackData: string): TAssistantChunk | null => {
  if (payload) {
    if (payload.type === 'token' && typeof payload.data === 'string') {
      return { text: payload.data, mode: 'append' };
    }
    if (payload.type === 'message' && typeof payload.data === 'string') {
      return { text: payload.data, mode: 'replace' };
    }
    if (typeof payload.delta === 'string') return { text: payload.delta, mode: 'append' };
    if (typeof payload.chunk === 'string') return { text: payload.chunk, mode: 'append' };
    if (typeof payload.token === 'string') return { text: payload.token, mode: 'append' };
    if (typeof payload.text === 'string') return { text: payload.text, mode: 'append' };
    if (typeof payload.content === 'string') return { text: payload.content, mode: 'append' };
    if (typeof payload.full_text === 'string') return { text: payload.full_text, mode: 'replace' };
    if (typeof payload.response === 'string') return { text: payload.response, mode: 'replace' };

    const message = payload.message;
    if (message && typeof message === 'object') {
      const content = (message as { content?: unknown }).content;
      if (typeof content === 'string') return { text: content, mode: 'replace' };
    }
  }

  const looksLikeJson = fallbackData.startsWith('{') || fallbackData.includes('{"type"') || fallbackData.includes('}{');
  if (looksLikeJson) return null;
  if (!fallbackData || fallbackData === '[DONE]') return null;
  return { text: fallbackData, mode: 'append' };
}

const patchAssistantMessage = (
  draft: TCurrentChatMessagesResponse,
  chatId: number,
  chunk: TAssistantChunk,
  tempAssistantMessageId: number
) => {
  if (!draft.messages) {
    draft.messages = [];
  }

  const lastMessage = draft.messages[draft.messages.length - 1];
  if (!lastMessage || lastMessage.role !== 'assistant') {
    draft.messages.push({
      id: tempAssistantMessageId,
      chat_id: chatId,
      role: 'assistant',
      content: '',
      attachments: [],
      created_at: new Date().toISOString(),
    } as IAiChatMessage);
  }

  const assistantMessage = draft.messages[draft.messages.length - 1];
  if (!assistantMessage || assistantMessage.role !== 'assistant') return;

  if (chunk.mode === 'replace') {
    assistantMessage.content = chunk.text;
    return;
  }

  if (!chunk.text) return;
  assistantMessage.content += chunk.text;
}

const delay = async (ms: number) => new Promise((resolve) => {
  setTimeout(resolve, ms);
})

export const API = createApi({
  reducerPath: 'API',
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers) => {
      const token = Cookies.get('radar')
      if (token) {
        headers.set('Authorization', `JWT ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['userBalance', 'generationStatus', 'messages', 'generationsHistory', 'aiChatList', 'currentChatMessages'],
  endpoints: (builder) => ({
    // User
    getUserData: builder.query<IUser, void>({
      query: () => `/me`,
      providesTags: ['userBalance'],
    }),
    topUpBalance: builder.mutation<void, { account_id: number }>({
      query: (data) => ({
        url: `/webhooks/payment`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': 'secret',
        },
        body: JSON.stringify(data),
      }),
      invalidatesTags: ['userBalance'],
    }),
    // Auth
    signIn: builder.mutation<void, { email: string, password: string }>({
      query: (data) => ({
        url: `/login-email`,
        method: 'POST',
        body: data,
      }),
    }),
    signUp: builder.mutation<void, { name?: string, email: string, password: string }>({
      query: (data) => ({
        url: `/register-email`,
        method: 'POST',
        body: data,
      }),
    }),
    otpSignupVerification: builder.mutation<void, { code: string, email: string }>({
      query: (data) => ({
        url: `/confirm-email`,
        method: 'POST',
        body: data,
      }),
    }),
    otpResetPasswordVerification: builder.mutation<void, { confirmation_code: string, email: string }>({
      query: (data) => ({
        url: `/password-reset/verify`,
        method: 'POST',
        body: data,
      }),
    }),
    otpRetry: builder.mutation<void, { email: string }>({
      query: (data) => ({
        url: `/resend-email-confirmation`,
        method: 'POST',
        body: data,
      }),
    }),
    changePasswordPlain: builder.mutation<void, { password_old: string, password_new: string, password_confirm: string, secret: string }>({
      query: (data) => ({
        url: `/password/change`,
        method: 'POST',
        body: {
          old_password: data.password_old,
          new_password: data.password_new,
          secret: data.secret,
        },
      }),
    }),
    resetPasswordStepOne: builder.mutation<void, { email: string }>({
      query: (data) => ({
        url: `/password-reset/start`,
        method: 'POST',
        body: data,
      }),
    }),
    setNewPasswordAfterReset: builder.mutation<void, { new_password: string, email: string, secret: string }>({
      query: (data) => ({
        url: `/password-reset/change`,
        method: 'POST',
        body: data,
      }),
    }),
    // Notifications
    getMessages: builder.query<INotificationsResponse, {limit?: number}>({
      query: ({limit = 200}) => `/notifications?skip=0&limit=${limit}`,
      providesTags: ['messages'],
    }),
    patchMessages: builder.mutation<void, { notification_id: number }>({
      query: ({ notification_id }) => ({
        url: `/notifications/${notification_id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['messages'],
    }),
    readAllMessages: builder.mutation<void, void>({
      query: () => ({
        url: `/notifications/read-all`,
        method: 'PATCH',
      }),
      invalidatesTags: ['messages'],
    }),
    // Models
    getModelsList: builder.query<IAIModelsList, void>({
      query: () => `/task/models`,
      transformResponse: (response: IAIModelsList) => {
        return {
          images: response.images.map(item => ({
            ...item,
            aspect_ratio_options: item.aspect_ratio_options ?? item.ratio_options ?? null,
            ratio_options: undefined,
          })),
          videos: response.videos.map(item => ({
            ...item,
            aspect_ratio_options: item.aspect_ratio_options ?? item.ratio_options ?? null,
            ratio_options: undefined,
            basic_video_duration: item?.duration_options?.sort((a, b) => a - b)?.[0] ?? 0,
          })),
        }
      },
    }),
    getSamples: builder.query<ISample[], { gender?: SampleGender; skip?: number; limit?: number }>({
      query: ({ gender, skip = 0, limit = 100 }) =>
        `/samples?skip=${skip}&limit=${limit}${gender ? `&gender=${gender}` : ''}`,
      transformResponse: (response: ISamplesListResponse) => response.items,
    }),
    // Generation
    createImages: builder.mutation<IGenerationResponse, FormData>({
      query: (formData) => ({
        url: `/task/edit_images`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['generationStatus', 'generationsHistory'],
    }),
    createVideo: builder.mutation<IGenerationResponse, FormData>({
      query: (formData) => ({
        url: `/task/create_video_preview`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['generationStatus', 'generationsHistory'],
    }),
    upscaleImage: builder.mutation<IGenerationResponse, FormData>({
      query: (formData) => ({
        url: `/task/improve_image_quality`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['generationStatus', 'generationsHistory'],
    }),
    editImage: builder.mutation<IGenerationResponse, FormData>({
      query: (formData) => ({
        url: `/task/generate_image`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['generationStatus', 'generationsHistory'],
    }),
    // Ai Chat
    getAiChatList: builder.query<IAiChatListItem[], void>({
      query: () => `/task/chats`,
      providesTags: ['aiChatList'],
    }),
    createNewAiChat: builder.mutation<ICreateNewAiChatResponse, { message: string, title: string, enable_web_search: boolean, attachments: TChatAttachment[] }>({
      query: (data) => ({
        url: `/task/chat`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['aiChatList'],
    }),
    updateAiChat: builder.mutation<void, { chatId: number, data: { title?: string } }>({
      query: ({ chatId, data }) => ({
        url: `/task/chat/${chatId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['aiChatList'],
    }),
    getCurrentChatMessages: builder.query<TCurrentChatMessagesResponse, number>({
      query: (chatId) => `/task/chat/${chatId}`,
      providesTags: ['currentChatMessages'],
      
    }),
    listenCurrentChatStream: builder.query<null, { chatId: number, requestKey: number }>({
      queryFn: async () => ({ data: null }),
      keepUnusedDataFor: 0,
      async onCacheEntryAdded(arg, { cacheDataLoaded, cacheEntryRemoved, dispatch, getState }) {
        // One SSE session per (chatId, requestKey). requestKey forces re-subscribe on each new request.
        const { chatId } = arg;
        const abortController = new AbortController();
        const token = Cookies.get('radar');
        const tempAssistantMessageId = -Date.now();
        let hasReceivedStreamData = false;
        let chunkSeq = 0;
        // Final sync should happen only for real stream completion/final failure, not for navigation aborts.
        let shouldFinalizeWithRefetch = false;

        // Stop the network stream when RTK query cache subscription is removed (unmount/chat switch).
        const abortOnCacheRemoved = cacheEntryRemoved.then(() => {
          abortController.abort();
        });

        try {
          await cacheDataLoaded;
          // UI flags for active stream lifecycle.
          dispatch(aiChatActions.setIsStreaming(true));
          dispatch(aiChatActions.setStreamError(null));
          const maxReconnectAttempts = 2;
          // Lightweight reconnect loop for transient SSE disconnects.
          for (let attempt = 0; attempt < maxReconnectAttempts; attempt += 1) {
            if (abortController.signal.aborted) break;
            try {
              const response = await fetch(`${API_URL}/task/chat/${chatId}/stream`, {
                method: 'GET',
                headers: {
                  Accept: 'text/event-stream',
                  ...(token ? { Authorization: `JWT ${token}` } : {}),
                },
                signal: abortController.signal,
              });

              if (!response.ok || !response.body) {
                throw new Error(`SSE stream failed with status ${response.status}`);
              }

              const reader = response.body.getReader();
              const decoder = new TextDecoder();
              let buffer = '';
              let completedByDoneEvent = false;

              // Read raw SSE chunks and split by event delimiter (\n\n).
              while (true) {
                const { done, value } = await reader.read();
                if (done) {
                  const tailEvent = parseSseEvent(buffer.trim());
                  if (tailEvent) {
                    const tailPayload = tryParseJson(tailEvent.data);
                    if (isDoneEvent(tailEvent.event, tailEvent.data, tailPayload)) {
                      completedByDoneEvent = true;
                    }
                  }
                  // Some providers finish by closing the stream without explicit [DONE] payload.
                  if (hasReceivedStreamData && !abortController.signal.aborted) {
                    completedByDoneEvent = true;
                  }
                  break;
                }

                buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
                const rawEvents = buffer.split('\n\n');
                buffer = rawEvents.pop() ?? '';

                let shouldStop = false;
                rawEvents.forEach((rawEvent) => {
                  if (shouldStop) return;

                  const parsedEvent = parseSseEvent(rawEvent);
                  if (!parsedEvent) return;

                  const payload = tryParseJson(parsedEvent.data);
                  if (isDoneEvent(parsedEvent.event, parsedEvent.data, payload)) {
                    shouldStop = true;
                    completedByDoneEvent = true;
                    return;
                  }

                  if (!payload) {
                    throw new Error('SSE data is not valid JSON');
                  }

                  // Convert provider payload shape to normalized assistant chunk format.
                  const assistantChunk = getAssistantChunk(payload, '');
                  if (!assistantChunk) return;

                  chunkSeq += 1;
                  logSseChunkDev({
                    chatId,
                    seq: chunkSeq,
                    chunk: assistantChunk,
                    rawData: parsedEvent.data,
                  });

                  hasReceivedStreamData = true;
                  // Patch current chat cache in-place to stream typing without full refetch.
                  dispatch(API.util.updateQueryData('getCurrentChatMessages', chatId, (draft) => {
                    patchAssistantMessage(draft, chatId, assistantChunk, tempAssistantMessageId);
                  }));
                });

                if (shouldStop) {
                  break;
                }
              }

              if (!completedByDoneEvent && !abortController.signal.aborted) {
                throw new Error('SSE connection closed unexpectedly');
              }
              if (completedByDoneEvent) {
                // Stream ended normally: sync authoritative backend state once.
                shouldFinalizeWithRefetch = true;
              }
              break;
            } catch (streamError) {
              const isLastAttempt = attempt === maxReconnectAttempts - 1;
              if (abortController.signal.aborted) break;
              if (isLastAttempt) {
                // Final failed attempt: still sync backend state and surface error.
                shouldFinalizeWithRefetch = true;
                throw streamError;
              }
              await delay(750 * (attempt + 1));
            }
          }
        } catch (error) {
          if (!abortController.signal.aborted) {
            dispatch(aiChatActions.setStreamError(error instanceof Error ? error.message : 'Stream connection failed'));
          }
        } finally {
          abortController.abort();
          dispatch(aiChatActions.setIsStreaming(false));
          // Refetch only for finalized sessions; skip on navigation abort to preserve local streamed content.
          if (shouldFinalizeWithRefetch) {
            dispatch(API.util.invalidateTags(['currentChatMessages']));
            dispatch(
              API.endpoints.getCurrentChatMessages.initiate(chatId, {
                forceRefetch: true,
                subscribe: false,
              })
            );
            const state = getState() as RootState;
            // Consume stream request only if it still belongs to this chat.
            if (state.aiChat.streamRequestChatId === chatId) {
              dispatch(aiChatActions.clearStreamRequest());
            }
          }
          // if (shouldSyncFinalMessages && hasReceivedStreamData) {
          //   dispatch(API.util.invalidateTags(['currentChatMessages']));
          //   dispatch(
          //     API.endpoints.getCurrentChatMessages.initiate(chatId, {
          //       forceRefetch: true,
          //       subscribe: false,
          //     })
          //   );
          //   await delay(500);
          //   dispatch(
          //     API.endpoints.getCurrentChatMessages.initiate(chatId, {
          //       forceRefetch: true,
          //       subscribe: false,
          //     })
          //   );
          // }
        }

        await abortOnCacheRemoved;
      },
    }),
    sendMessageToCurrentChat: builder.mutation<void, { chatId: number, data: { message: string, enable_web_search: boolean, attachments: TChatAttachment[] }}>({
      query: ({ data, chatId }) => ({
        url: `/task/chat/${chatId}/message`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['currentChatMessages'],
    }),
    uploadAsset: builder.mutation<IUploadAssetResponse, FormData>({
      query: (data) => ({
        url: `/task/chat/attachment`,
        method: 'POST',
        body: data,
      }),
    }),
    deleteChat: builder.mutation<void, { chatId: number }>({
      query: ({ chatId }) => ({
        url: `/task/chat/${chatId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['aiChatList'],
    }),
    regenerateCurrentChatMessages: builder.mutation<void, { chatId: number, messageId: number }>({
      query: ({ chatId, messageId }) => ({
        url: `/task/chat/${chatId}/message/${messageId}/retry`,
        method: 'POST',
      }),
      invalidatesTags: ['currentChatMessages'],
    }),
    // Generation Status & Services
    getGenerationStatus: builder.query<IGenerationStatusResponse, { task_id?: number, task_type?: TGenerationType | string, edit_type?: Array<'default' | 'infographics' | 'mask' | 'clear'>,  source?: 'generation' | 'content_factory' | 'chat' | 'generate_image' }>({
      query: ({ task_id, task_type, source, edit_type }) => {
        if (task_id) {
          return `/task/status${task_id != null ? `?task_id=${task_id}` : ''}${task_type != null ? `&task_type=${task_type}` : ''}${source != null ? `&source=${source}` : ''}${edit_type != null ? `&edit_type=${edit_type.join(',')}` : ''}`
        }
        return `/task/status${task_type != null ? `?task_type=${task_type}` : ''}${source != null ? `&source=${source}` : ''}${edit_type != null ? `&edit_type=${edit_type.join(',')}` : ''}`
      },
      providesTags: ['generationStatus'],
    }),
    closeTask: builder.mutation<{ success: boolean; task_id: number }, { task_id?: number }>({
      query: ({ task_id }) => ({
        url: `/task/close${task_id != null ? `?task_id=${task_id}` : ''}`,
        method: 'POST',
      }),
      invalidatesTags: ['generationStatus', 'generationsHistory'],
    }),
    retryGeneration: builder.mutation<void, { task_id: number }>({
      query: ({ task_id }) => ({
        url: `/task/${task_id}/retry`,
        method: 'POST',
      }),
      // invalidatesTags: ['generationStatus', 'generationsHistory'],
    }),
    getGenerationsHistory: builder.query<IGenerationHistoryResponseDTO[], { limit: number, task_type?: TGenerationType | string, generationSource?: 'generation' | 'content_factory' | 'chat' | 'generate_image', projectId?: string, editType?: Array<'default' | 'infographics' | 'mask' | 'clear'> }>({
      query: (data) => `/task/history?limit=${data.limit}${data.task_type != null ? `&task_type=${data.task_type}` : ''}&source=${data.generationSource}${data.projectId != null ? `&project_id=${data.projectId}` : ''}${data.editType != null ? `&edit_type=${data.editType.join(',')}` : ''}`,
      transformResponse: (response: IGenerationHistoryResponse[]) => {
        const DTO: IGenerationHistoryResponseDTO[] = [];
        response.forEach(item => {
          item?.generations?.forEach(g => {
            const { id, result, created_at, prompt, reference, reference_thumbnails } = g ?? {};
            const dtoObject: IGenerationHistoryResponseDTO = {
              generation_id: id,
              created_at,
              result,
              task_id: item.task_id,
              ai_model: item.ai_model,
              prompt,
              reference,
              reference_thumbnails,
              result_thumbnail: g?.result_thumbnail ?? null,
              sample: g?.sample ?? null,

            }
            DTO.push(dtoObject);
          })
        })
        return DTO;
      },
      providesTags: ['generationsHistory'],
    }),
    deleteGeneration: builder.mutation<void, { generation_id: number }>({
      query: ({ generation_id }) => ({
        url: `/task/generations/${generation_id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['generationStatus', 'generationsHistory'],
    }),
    markErrorAsRead: builder.mutation<void, { task_id: number }>({
      query: ({ task_id }) => ({
        url: `/task/${task_id}/acknowledge-error`,
        method: 'POST',
      }),
      invalidatesTags: ['generationStatus', 'generationsHistory'],
    }),
    contentFactoryUserImageUpload: builder.mutation<{path: string, path_thumbnail: string, url: string, url_thumbnail: string}, { formData: FormData, nodeId: string }>({
      query: ({ formData, nodeId }) => ({
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        url: `/content-factory/nodes/${nodeId}/image`,
        method: 'POST',
        body: formData,
      }),
    }),
  }),
})