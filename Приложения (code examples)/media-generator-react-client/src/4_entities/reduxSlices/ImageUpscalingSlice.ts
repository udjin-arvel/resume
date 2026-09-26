import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { IAIModelListItem } from '@shared/models/models'

interface ImageUpscalingState {
    modelType: IAIModelListItem | null;
    upscaleRate: 'x2' | 'x4' | 'x8';
    reference: { id: string; url: string } | null;
    isGenerationInProgress: boolean;
}

const initialState: ImageUpscalingState = {
    reference: null,
    modelType: null,
    upscaleRate: 'x4',
    isGenerationInProgress: false,
}

export const ImageUpscalingSlice = createSlice({
    name: 'imageUpscaling',
    initialState,
    reducers: {
        setImageUpscalingSettings: (state, action: PayloadAction<{key: keyof ImageUpscalingState, value: any}>) => {
            const { key, value } = action.payload;
           return {
            ...state,
            [key]: value,
           }
        },
        addReference: (state, action: PayloadAction<{ id: string; url: string }>) => {
            return {
                ...state,
                reference: action.payload,
            }
        },
        removeReference: (state) => {
            const refToDelete = state.reference;
            if (refToDelete && refToDelete.url.startsWith('blob:')) {
                URL.revokeObjectURL(refToDelete.url);
            }
            return {
                ...state,
                reference: null,
            }
        },
        resetState: () => {
            return initialState;
        },
        setIsGenerationInProgress: (state, action: PayloadAction<boolean>) => {
            return {
                ...state,
                isGenerationInProgress: action.payload,
            }
        },
    },
})

export const { actions, reducer } = ImageUpscalingSlice;