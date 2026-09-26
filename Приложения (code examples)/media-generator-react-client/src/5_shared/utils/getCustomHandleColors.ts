import type { TContentFactoryPin } from "../models/models"

export const getCustomHandleColors = (contentType: TContentFactoryPin['contentType']): { color: string, backgroundColor: string } => {
    if (contentType === 'IMAGE') return {
        color: 'var(--cf-color-main-blue, #294DFF)',
        backgroundColor: 'var(--cf-color-blue-muted, #CAD1F5)',
    }
    if (contentType === 'TEXT') return {
        color: 'var(--cf-color-main-orange, #F08400)',
        backgroundColor: 'var(--cf-color-orange-muted, #F2DCC2)',
    }
    if (contentType === 'VIDEO') return {
        color: 'var(--cf-color-main-pink, #FF29BF)',
        backgroundColor: 'var(--cf-color-pink-muted, #FF29BF26)',
    }
    return {
        color: 'var(--cf-color-main-blue, #294DFF)',
        backgroundColor: 'var(--cf-color-blue-muted, #CAD1F5)',
    }
}