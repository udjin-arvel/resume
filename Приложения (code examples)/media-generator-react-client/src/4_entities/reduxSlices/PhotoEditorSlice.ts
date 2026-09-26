import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { IGenerationReference } from '..';

type TPrettify<T> = {
    [K in keyof T]: T[K]
} & {}
interface IPhotoEditorState {
    mainImage: { id: string; url: string } | null;
    references: { id: string; url: string }[] | null;
    isGenerationInProgress: boolean;
    prompt: string;
}

const initialState: TPrettify<IPhotoEditorState> = {
    mainImage: null,
    references: null,
    isGenerationInProgress: false,
    prompt: '',
}

export const PhotoEditorSlice = createSlice({
    name: 'photoEditor',
    initialState,
    reducers: {
        addMainImage: (state, action: PayloadAction<{ id: string; url: string }>) => {
            state.mainImage = action.payload
        },
        removeMainImage: (state) => {
            state.mainImage = null
        },
        addReference: (state, action: PayloadAction<{ id: string; url: string }>) => {
            if (state.references) {
                state.references.push(action.payload)
            } else {
                state.references = [action.payload]
            }
        },
        removeReference: (state, action: PayloadAction<{ id: string }>) => {
            const refs = state.references
            const refIndexToDelete = refs?.findIndex((ref) => ref.id === action.payload.id)
            if (refIndexToDelete !== undefined && refIndexToDelete !== -1 && refs) {
                if (refs[refIndexToDelete].url.startsWith('blob:')) {
                    URL.revokeObjectURL(refs[refIndexToDelete].url)
                }
                refs.splice(refIndexToDelete, 1)
            }
            if (refs?.length === 0) {
                state.references = null
            }
        },
        removeAllReferences: (state) => {
            state.references = null
        },
        invokeReferencesFromStatus: (state, action: PayloadAction<{ references: IGenerationReference[], prompt: string }>) => {
            state.references = action.payload.references
            state.prompt = action.payload.prompt
        },
        resetState: () => {
            return initialState
        },
        setIsGenerationInProgress: (state, action: PayloadAction<boolean>) => {
            state.isGenerationInProgress = action.payload
        },
        setPrompt: (state, action: PayloadAction<string>) => {
            state.prompt = action.payload
        },
        resetPrompt: (state) => {
            state.prompt = ''
        },
    },
})

export const { actions, reducer } = PhotoEditorSlice;