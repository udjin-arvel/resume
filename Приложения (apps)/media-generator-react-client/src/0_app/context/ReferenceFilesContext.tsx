import React, { createContext, useCallback, useContext, useMemo, useRef } from 'react'

interface IReferenceFilesContextValue {
    registerReferenceFile: (id: string, file: File) => void
    unregisterReferenceFile: (id: string) => void
    getReferenceFile: (id: string) => File | undefined
    getReferenceFilesInOrder: (ids: string[]) => File[]
    clearAllReferenceFiles: () => void
}

const ReferenceFilesContext = createContext<IReferenceFilesContextValue | null>(null)

export const ReferenceFilesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const mapRef = useRef(new Map<string, File>())

    const registerReferenceFile = useCallback((id: string, file: File) => {
        mapRef.current.set(id, file)
    }, [])

    const unregisterReferenceFile = useCallback((id: string) => {
        mapRef.current.delete(id)
    }, [])

    const getReferenceFile = useCallback((id: string) => mapRef.current.get(id), [])

    const getReferenceFilesInOrder = useCallback((ids: string[]) => {
        return ids.map((id) => mapRef.current.get(id)).filter((f): f is File => f != null)
    }, [])

    const clearAllReferenceFiles = useCallback(() => {
        mapRef.current.clear()
    }, [])

    const value = useMemo(
        () => ({
            registerReferenceFile,
            unregisterReferenceFile,
            getReferenceFile,
            getReferenceFilesInOrder,
            clearAllReferenceFiles,
        }),
        [
            registerReferenceFile,
            unregisterReferenceFile,
            getReferenceFile,
            getReferenceFilesInOrder,
            clearAllReferenceFiles,
        ],
    )

    return <ReferenceFilesContext.Provider value={value}>{children}</ReferenceFilesContext.Provider>
}

export function useReferenceFiles(): IReferenceFilesContextValue {
    const ctx = useContext(ReferenceFilesContext)
    if (!ctx) {
        throw new Error('useReferenceFiles must be used within ReferenceFilesProvider')
    }
    return ctx
}
