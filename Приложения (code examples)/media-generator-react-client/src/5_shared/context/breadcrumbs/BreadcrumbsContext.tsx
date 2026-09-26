import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

interface IBreadcrumbsContextValue {
    labels: Record<string, string>
    setLabel: (path: string, label: string) => void
    removeLabel: (path: string) => void
}

const BreadcrumbsContext = createContext<IBreadcrumbsContextValue | null>(null)

export const BreadcrumbsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [labels, setLabels] = useState<Record<string, string>>({})

    const setLabel = useCallback((path: string, label: string) => {
        setLabels(prev => ({ ...prev, [path]: label }))
    }, [])

    const removeLabel = useCallback((path: string) => {
        setLabels(prev => {
            const next = { ...prev }
            delete next[path]
            return next
        })
    }, [])

    return (
        <BreadcrumbsContext.Provider value={{ labels, setLabel, removeLabel }}>
            {children}
        </BreadcrumbsContext.Provider>
    )
}

export function useBreadcrumbsContext(): IBreadcrumbsContextValue {
    const ctx = useContext(BreadcrumbsContext)
    if (!ctx) {
        throw new Error('useBreadcrumbsContext must be used within BreadcrumbsProvider')
    }
    return ctx
}

export function useBreadcrumbLabel(path: string, label: string | undefined): void {
    const { setLabel, removeLabel } = useBreadcrumbsContext()

    useEffect(() => {
        if (label) {
            setLabel(path, label)
        }
        return () => {
            removeLabel(path)
        }
    }, [path, label])
}
