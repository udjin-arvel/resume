import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { TChatAttachment } from '@shared/models/models'

type TPrettify<T> = {
    [K in keyof T]: T[K]
} & {}
interface ICardInfographicsSlice {
   currentChatId: number | null;
   files: TChatAttachment[] | null;
   userMessage: string;
   streamRequestNonce: number;
   streamRequestChatId: number | null;
   isStreaming: boolean;
   streamError: string | null;
   shouldUseWebSearch: boolean;
}

const initialState: TPrettify<ICardInfographicsSlice> = {
    currentChatId: null,
    files: null,
    userMessage: '',
    streamRequestNonce: 0,
    streamRequestChatId: null,
    isStreaming: false,
    streamError: null,
    shouldUseWebSearch: false,
}

export const AiChatSlice = createSlice({
    name: 'aiChat',
    initialState,
    reducers: {
        setFiles: (state, action: PayloadAction<TChatAttachment>) => {
           if (!state.files) {
            state.files = [action.payload];
           } else if (state.files) {
            state.files.push(action.payload);
           }
        },
        removeFile: (state, action: PayloadAction<string>) => {
            state.files = state.files?.filter(file => file.url !== action.payload) ?? null;
        },
        removeFileByFilename: (state, action: PayloadAction<string>) => {
            state.files = state.files?.filter(file => file.original_filename !== action.payload) ?? null;
        },
        removeFileByLoadingStatus: (state) => {
            state.files = state.files?.filter(file => !file.isLoading) ?? null;
        },
        resetAllAssets: (state) => {
            state.files = null;
        },
        setCurrentChatId: (state, action: PayloadAction<number | null>) => {
            state.currentChatId = action.payload;
        },
        setUserMessage: (state, action: PayloadAction<string>) => {
            state.userMessage = action.payload;
        },
        requestStreamStart: (state, action: PayloadAction<number>) => {
            state.streamRequestNonce += 1;
            state.streamRequestChatId = action.payload;
            state.streamError = null;
            state.isStreaming = true;
        },
        setShouldUseWebSearch: (state, action: PayloadAction<boolean>) => {
            state.shouldUseWebSearch = action.payload;
        },
        clearStreamRequest: (state) => {
            state.streamRequestChatId = null;
        },
        setIsStreaming: (state, action: PayloadAction<boolean>) => {
            state.isStreaming = action.payload;
        },
        setStreamError: (state, action: PayloadAction<string | null>) => {
            state.streamError = action.payload;
        },
        resetState: () => {
            return initialState
        },
    },
})

export const { actions, reducer } = AiChatSlice;