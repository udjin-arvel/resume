import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
// import type { IGenerationReference } from '..';

type TPrettify<T> = {
    [K in keyof T]: T[K]
} & {}
interface ICardInfographicsSlice {
    productImage: { id: string; url: string } | null;
    infographicsImage: { id: string; url: string } | null;
    productPrompt: string;
    infographicsPrompt: string;
    isGenerationInProgress: boolean;
    dimensions: string | null;
    needToEnchance: boolean;
}

type CardInfographicsSettingsPayload =
    { [K in keyof ICardInfographicsSlice]: { key: K; value: ICardInfographicsSlice[K] } }[keyof ICardInfographicsSlice];

const initialState: TPrettify<ICardInfographicsSlice> = {
    productImage: null,
    infographicsImage: null,
    productPrompt: '',
    infographicsPrompt: '',
    isGenerationInProgress: false,
    dimensions: '1:1',
    needToEnchance: true,
}

export const CardInfographicsSlice = createSlice({
    name: 'cardInfographics',
    initialState,
    reducers: {
        addImage: (state, action: PayloadAction<{key: 'product' | 'infographics', image: { id: string; url: string } }>) => {
            const { key, image } = action.payload;
            if (key === 'product') {
                state.productImage = image;
            } else {
                state.infographicsImage = image;
            }
        },
        removeImage: (state, action: PayloadAction<{key: 'product' | 'infographics'}>) => {
            const { key } = action.payload;
            if (key === 'product') {
                state.productImage = null;
            } else {
                state.infographicsImage = null;
            }
        },
        removeAllImages: (state) => {
            state.productImage = null;
            state.infographicsImage = null;
        },
        setCardInfographicsSettings: (state, action: PayloadAction<CardInfographicsSettingsPayload>) => {
            const { key, value } = action.payload;
            return {
                ...state,
                [key]: value,
            }
        },
        invokeReferencesFromStatus: (state, action: PayloadAction<Pick<ICardInfographicsSlice, 'productImage' | 'infographicsImage' | 'productPrompt' | 'infographicsPrompt'>>) => {
            const { productImage, infographicsImage, productPrompt, infographicsPrompt } = action.payload;
            state.productImage = productImage;
            state.infographicsImage = infographicsImage;
            state.productPrompt = productPrompt ?? '';
            state.infographicsPrompt = infographicsPrompt ?? '';
        },
        resetState: () => {
            return initialState
        },
        setIsGenerationInProgress: (state, action: PayloadAction<boolean>) => {
            state.isGenerationInProgress = action.payload
        },
        setPrompt: (state, action: PayloadAction<{key: 'product' | 'infographics', prompt: string}>) => {
            const { key, prompt } = action.payload;
            if (key === 'product') {
                state.productPrompt = prompt;
            } else {
                state.infographicsPrompt = prompt;
            }
        },
        resetPrompt: (state, action: PayloadAction<{key: 'product' | 'infographics'}>) => {
            const { key } = action.payload;
            if (key === 'product') {
                state.productPrompt = '';
            } else {
                state.infographicsPrompt = '';
            }
        },
        resetAllPrompts: (state) => {
            state.productPrompt = '';
            state.infographicsPrompt = '';
        },
    },
})

export const { actions, reducer } = CardInfographicsSlice;