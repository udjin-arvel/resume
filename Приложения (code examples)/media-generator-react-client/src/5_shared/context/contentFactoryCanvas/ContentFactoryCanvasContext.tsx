import React, { createContext, useContext } from 'react'
import type { TContentFactoryPin } from '../../models/models'

interface IContentFactoryCanvasContextValue {
    onGenerationStart: () => void
    hoveredSourceContentType: TContentFactoryPin['contentType'] | null
    hoveredSourceNodeId: string | null
    setHoveredSourceContentType: (type: TContentFactoryPin['contentType'] | null) => void
    setHoveredSourceNodeId: (nodeId: string | null) => void
}

const ContentFactoryCanvasContext = createContext<IContentFactoryCanvasContextValue | null>(null)

export const ContentFactoryCanvasProvider: React.FC<{
    onGenerationStart: () => void
    hoveredSourceContentType: TContentFactoryPin['contentType'] | null
    hoveredSourceNodeId: string | null
    setHoveredSourceContentType: (type: TContentFactoryPin['contentType'] | null) => void
    setHoveredSourceNodeId: (nodeId: string | null) => void
    children: React.ReactNode
}> = ({ onGenerationStart, hoveredSourceContentType, hoveredSourceNodeId, setHoveredSourceContentType, setHoveredSourceNodeId, children }) => {
    return (
        <ContentFactoryCanvasContext.Provider value={{ onGenerationStart, hoveredSourceContentType, hoveredSourceNodeId, setHoveredSourceContentType, setHoveredSourceNodeId }}>
            {children}
        </ContentFactoryCanvasContext.Provider>
    )
}

export function useContentFactoryCanvas(): IContentFactoryCanvasContextValue {
    const ctx = useContext(ContentFactoryCanvasContext)
    if (!ctx) {
        return {
            onGenerationStart: () => {},
            hoveredSourceContentType: null,
            hoveredSourceNodeId: null,
            setHoveredSourceContentType: () => {},
            setHoveredSourceNodeId: () => {},
        }
    }
    return ctx
}
