import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { IAIModelListItem, ISample, SampleGender } from '@shared/models/models'

export type IGenerationReference = { id: string; url: string; generationId?: number }

interface ImageGenerationState {
    references: IGenerationReference[];
    prompt: string;
    modelType: IAIModelListItem | null;
    dimensions: string | null;
    selectedSampleGender: SampleGender;
    selectedSample: ISample | null;
    needToEnchance: boolean;
    isGenerationInProgress: boolean;
    isEnchanceModeActive: boolean;
}

type SetImageGenerationSettingsPayload =
    { [K in keyof ImageGenerationState]: { key: K; value: ImageGenerationState[K] } }[keyof ImageGenerationState];

const initialState: ImageGenerationState = {
    references: [],
    prompt: '',
    modelType: null,
    dimensions: '1:1',
    selectedSampleGender: 'female',
    selectedSample: null,
    needToEnchance: true,
    isGenerationInProgress: false,
    isEnchanceModeActive: false,
}

export const ImageGenerationSlice = createSlice({
    name: 'imageGeneration',
    initialState,
    reducers: {
        setImageGenerationSettings: (state, action: PayloadAction<SetImageGenerationSettingsPayload>) => {
            const { key, value } = action.payload;
            if (key === 'modelType') {
                const newDimensions = state.dimensions && value?.aspect_ratio_options?.includes(state.dimensions) ? state.dimensions : value?.aspect_ratio_options?.[0] ?? null;
                return {
                    ...state,
                    modelType: value,
                    dimensions: newDimensions
                }
            }
            return {
                ...state,
                [key]: value,
            }
        },
        setSelectedSampleGender: (state, action: PayloadAction<SampleGender>) => {
            return {
                ...state,
                selectedSampleGender: action.payload,
            }
        },
        setSelectedSample: (state, action: PayloadAction<ISample | null>) => {
            return {
                ...state,
                selectedSample: action.payload,
            }
        },
        addReference: (state, action: PayloadAction<IGenerationReference>) => {
            return {
                ...state,
                references: [...state.references, action.payload],
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
        setIsEnchanceModeActive: (state, action: PayloadAction<boolean>) => {
            return {
                ...state,
                isEnchanceModeActive: action.payload,
            }
        },
        resetState: (state) => {
            return {
                ...state,
                references: [],
                prompt: '',
                dimensions: '1:1',
                needToEnchance: false,
                isEnchanceModeActive: false,
            };
        },
    },
})

export const { actions, reducer } = ImageGenerationSlice;