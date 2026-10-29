import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { imageGenerationReducer, videoGenerationReducer, imageUpscalingReducer, photoEditorReducer, cardInfographicsReducer, aiChatReducer } from '@entities'
import { API, CONTENT_FACTORY_API } from '@shared'

export const store = configureStore({
  reducer: {
    imageGeneration: imageGenerationReducer,
    videoGeneration: videoGenerationReducer,
    imageUpscaling: imageUpscalingReducer,
    photoEditor: photoEditorReducer,
    cardInfographics: cardInfographicsReducer,
    aiChat: aiChatReducer,
    [API.reducerPath]: API.reducer,
    [CONTENT_FACTORY_API.reducerPath]: CONTENT_FACTORY_API.reducer,
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware()
      .concat(API.middleware)
      .concat(CONTENT_FACTORY_API.middleware),
})
setupListeners(store.dispatch)
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch