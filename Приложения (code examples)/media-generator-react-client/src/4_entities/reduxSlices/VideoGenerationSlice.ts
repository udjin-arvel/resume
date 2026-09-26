import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { IAIModelListItem, ISample, SampleGender } from '@shared/models/models'

export type IGenerationReference = { id: string; url: string; generationId?: number }

interface VideoGenerationState {
    references: IGenerationReference[];
    prompt: string;
    modelType: IAIModelListItem | null;
    quality: string | null;
    length: number | null;
    dimensions: string | null;
    hasSound: boolean;
    needToEnchance: boolean;
    isGenerationInProgress: boolean;
    selectedSample: ISample | null;
    selectedSampleGender: SampleGender | null;
    isGoLiveModeActive: boolean;
}

type SetVideoGenerationSettingsPayload = { [K in keyof VideoGenerationState]: { key: K; value: VideoGenerationState[K] } }[keyof VideoGenerationState];

const initialState: VideoGenerationState = {
    references: [],
    prompt: '',
    modelType: null,
    selectedSample: null,
    selectedSampleGender: null,
    quality: null,
    length: null,
    dimensions: null,
    hasSound: false,
    needToEnchance: true,
    isGenerationInProgress: false,
    isGoLiveModeActive: false,
}

export const VideoGenerationSlice = createSlice({
    name: 'videoGeneration',
    initialState,
    reducers: {
        setVideoGenerationSettings: (state, action: PayloadAction<SetVideoGenerationSettingsPayload>) => {
            const { key, value } = action.payload;
            if (key === 'modelType') {
                const newDimensions = state.dimensions && value?.aspect_ratio_options?.includes(state.dimensions) ? state.dimensions : value?.aspect_ratio_options?.[0] ?? null;
                const newQuality = state.quality && value?.resolution_options?.includes(state.quality) ? state.quality : value?.resolution_options?.[0] ?? null;
                let newLength = null;
                if (value?.duration_options_by_resolution) {
                    newLength = state.length && value?.duration_options_by_resolution?.[newQuality ?? '']?.includes(state.length) ? state.length : value?.duration_options_by_resolution?.[newQuality ?? '']?.[0] ?? null;
                } else {
                    newLength = state.length && value?.duration_options?.includes(state.length) ? state.length : value?.duration_options?.[0] ?? null;
                }
                return {
                    ...state,
                    modelType: value,
                    dimensions: newDimensions,
                    quality: newQuality,
                    length: newLength,
                    hasSound: value?.audio_toggle_param ? state.hasSound : false,
                }
            }
            if (key === 'quality') {
                let newLength = null;
                if (state.modelType?.duration_options_by_resolution) {
                    newLength = state.length && state.modelType.duration_options_by_resolution?.[value ?? '']?.includes(state.length) ? state.length : state.modelType.duration_options_by_resolution?.[value ?? '']?.[0] ?? null;
                }
                return {
                    ...state,
                    length: newLength ?? state.length,
                    quality: value,
                }
            }
            return {
                ...state,
                [key]: value,
            }
        },
        addReference: (state, action: PayloadAction<IGenerationReference>) => {
            return {
                ...state,
                references: [...state.references, action.payload],
            }
        },
        replaceAllReferences: (state, action: PayloadAction<IGenerationReference[]>) => {
            const refsToDelete = state.references
            if (refsToDelete) {
                refsToDelete.forEach((ref) => {
                    if (ref.url.startsWith('blob:')) {
                        URL.revokeObjectURL(ref.url);
                    }
                });
            }
            return {
                ...state,
                prompt: '',
                references: action.payload,
            }
        },
        setIsGenerationInProgress: (state, action: PayloadAction<boolean>) => {
            return {
                ...state,
                isGenerationInProgress: action.payload,
            }
        },
        removeReference: (state, action: PayloadAction<{ id: string }>) => {
            const refToDelete = state.references.find((reference) => reference.id === action.payload.id);
            if (refToDelete && refToDelete.url.startsWith('blob:')) {
                URL.revokeObjectURL(refToDelete.url);
            }
            return {
                ...state,
                references: state.references.filter((reference) => reference.id !== action.payload.id),
            }
        },
        invokeReferencesFromStatus: (state, action: PayloadAction<{ references: IGenerationReference[], prompt: string }>) => {
            return {
                ...state,
                prompt: action.payload.prompt,
                references: action.payload.references,
            }
        },
        setPrompt: (state, action: PayloadAction<string>) => {
            return {
                ...state,
                prompt: action.payload,
            }
        },
        setIsGoLiveModeActive: (state, action: PayloadAction<boolean>) => {
            return {
                ...state,
                isGoLiveModeActive: action.payload,
            }
        },
        resetState: (state) => {
            return {
                ...state,
                references: [],
                prompt: '',
                quality: null,
                length: null,
                dimensions: null,
                hasSound: false,
                needToEnchance: false,
            };
        },
    },
})

export const { actions, reducer } = VideoGenerationSlice;