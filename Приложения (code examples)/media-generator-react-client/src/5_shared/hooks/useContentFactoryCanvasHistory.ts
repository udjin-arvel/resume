import { useCallback, useRef, useState } from 'react'
import type { Connection, Edge, Node } from '@xyflow/react'
import type { NotificationInstance } from 'antd/es/notification/interface'
import type { TContentFactoryPin } from '../models/models'
import { getCustomHandleColors } from '../utils/getCustomHandleColors'

export const MAX_CANVAS_HISTORY = 10

export type HistoryEntry =
    | { kind: 'node:create'; node: Node<TContentFactoryPin> }
    | { kind: 'node:delete'; node: Node<TContentFactoryPin>; edges: Edge[] }
    | { kind: 'node:move'; nodeId: string; from: { x: number; y: number }; to: { x: number; y: number } }
    | { kind: 'edge:create'; edge: Edge; connection: Connection & { projectId: string } }
    | { kind: 'edge:delete'; edge: Edge }

type CreateNodeArgs = {
    projectId: string
    pinType: string
    contentType: string
    positionX: number
    positionY: number
    zIndex: number
    data?: Record<string, unknown>
}

type CreateEdgeArgs = {
    projectId: string
    sourceNodeId: string
    targetNodeId: string
    sourceHandle?: string
    targetHandle?: string
}

type MutationTrigger<T, R = unknown> = (args: T) => { unwrap: () => Promise<R> }

export interface UseContentFactoryCanvasHistoryParams {
    projectId: string | undefined
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
    createNode: MutationTrigger<CreateNodeArgs, { id: string }>
    deleteNode: MutationTrigger<{ nodeId: string }>
    updateNodePosition: MutationTrigger<{ nodeId: string; positionX: number; positionY: number }>
    createEdge: MutationTrigger<CreateEdgeArgs, { id: string }>
    deleteEdge: MutationTrigger<{ edgeId: string }>
    notification: NotificationInstance
}

type IdMap = Record<string, string>

function isNodeAlreadyDeletedError(error: unknown): boolean {
    let message = ''
    if (typeof error === 'string') {
        message = error
    } else {
        try {
            message = JSON.stringify(error)
        } catch {
            message = String(error)
        }
    }
    return message.includes('deleteContentFactoryNode') && message.includes('Node not found or access denied')
}

function buildNodeDataPayload(data: TContentFactoryPin): Record<string, unknown> | undefined {
    const payload: Record<string, unknown> = {}
    if (data.isNote != null) payload.isNote = data.isNote
    if (data.note != null) payload.note = data.note
    if (data.prompt != null) payload.prompt = data.prompt
    if (data.user_image_thumbnail_path != null) payload.user_image_thumbnail_path = data.user_image_thumbnail_path
    if (data.user_image_path != null) payload.user_image_path = data.user_image_path
    if (data.user_image_thumbnail_url != null) payload.user_image_thumbnail_url = data.user_image_thumbnail_url
    if (data.user_image_url != null) payload.user_image_url = data.user_image_url
    if (data.aspect_ratio != null) payload.aspect_ratio = data.aspect_ratio
    return Object.keys(payload).length > 0 ? payload : undefined
}

function buildCreateNodeArgs(projectId: string, node: Node<TContentFactoryPin>): CreateNodeArgs {
    return {
        projectId,
        pinType: node.data.pinType,
        contentType: node.data.contentType,
        positionX: node.position.x,
        positionY: node.position.y,
        zIndex: node.zIndex ?? 0,
        data: buildNodeDataPayload(node.data),
    }
}

function styleEdge(edge: Edge): Edge {
    const colors = getCustomHandleColors(edge.sourceHandle as TContentFactoryPin['contentType'])
    return {
        ...edge,
        style: {
            stroke: colors.backgroundColor,
            strokeWidth: 2,
        },
    }
}

function remapNodeId(id: string, nodeIdMap: IdMap): string {
    return nodeIdMap[id] ?? id
}

function remapEdgeId(id: string, edgeIdMap: IdMap): string {
    return edgeIdMap[id] ?? id
}

function remapNode(node: Node<TContentFactoryPin>, nodeIdMap: IdMap): Node<TContentFactoryPin> {
    const nextId = remapNodeId(node.id, nodeIdMap)
    return {
        ...node,
        id: nextId,
        data: {
            ...node.data,
            id: remapNodeId(String(node.data.id), nodeIdMap),
        },
    }
}

function remapEdge(edge: Edge, nodeIdMap: IdMap, edgeIdMap: IdMap): Edge {
    return {
        ...edge,
        id: remapEdgeId(edge.id, edgeIdMap),
        source: remapNodeId(edge.source, nodeIdMap),
        target: remapNodeId(edge.target, nodeIdMap),
    }
}

function remapHistoryEntry(entry: HistoryEntry, nodeIdMap: IdMap, edgeIdMap: IdMap): HistoryEntry {
    switch (entry.kind) {
        case 'node:create':
            return { kind: 'node:create', node: remapNode(entry.node, nodeIdMap) }
        case 'node:delete':
            return {
                kind: 'node:delete',
                node: remapNode(entry.node, nodeIdMap),
                edges: entry.edges.map((edge) => remapEdge(edge, nodeIdMap, edgeIdMap)),
            }
        case 'node:move':
            return { ...entry, nodeId: remapNodeId(entry.nodeId, nodeIdMap) }
        case 'edge:create':
            return {
                kind: 'edge:create',
                edge: remapEdge(entry.edge, nodeIdMap, edgeIdMap),
                connection: {
                    ...entry.connection,
                    source: entry.connection.source ? remapNodeId(entry.connection.source, nodeIdMap) : entry.connection.source,
                    target: entry.connection.target ? remapNodeId(entry.connection.target, nodeIdMap) : entry.connection.target,
                },
            }
        case 'edge:delete':
            return { kind: 'edge:delete', edge: remapEdge(entry.edge, nodeIdMap, edgeIdMap) }
        default:
            return entry
    }
}

export function useContentFactoryCanvasHistory({
    projectId,
    setNodes,
    setEdges,
    createNode,
    deleteNode,
    updateNodePosition,
    createEdge,
    deleteEdge,
    notification,
}: UseContentFactoryCanvasHistoryParams) {
    const [undoStack, setUndoStack] = useState<HistoryEntry[]>([])
    const [redoStack, setRedoStack] = useState<HistoryEntry[]>([])
    const [isHistoryBusy, setIsHistoryBusy] = useState(false)
    const isApplyingHistoryRef = useRef(false)

    const isApplyingHistory = useCallback(() => isApplyingHistoryRef.current, [])

    const pushHistory = useCallback((entry: HistoryEntry) => {
        if (isApplyingHistoryRef.current) return
        setUndoStack((prev) => [...prev, entry].slice(-MAX_CANVAS_HISTORY))
        setRedoStack([])
    }, [])

    const showError = useCallback(() => {
        notification.error({
            message: 'Не удалось выполнить действие',
            description: 'Попробуйте еще раз',
        })
    }, [notification])

    const safelyDeleteNode = useCallback(async (nodeId: string) => {
        try {
            await deleteNode({ nodeId }).unwrap()
        } catch (error) {
            if (isNodeAlreadyDeletedError(error)) {
                return
            }
            throw error
        }
    }, [deleteNode])

    const restoreNode = useCallback(async (node: Node<TContentFactoryPin>): Promise<Node<TContentFactoryPin>> => {
        if (!projectId) throw new Error('projectId is required')
        const res = await createNode(buildCreateNodeArgs(projectId, node)).unwrap()
        return {
            ...node,
            id: res.id,
            data: { ...node.data, id: res.id },
        }
    }, [projectId, createNode])

    const restoreEdges = useCallback(async (
        edges: Edge[],
        nodeIdMap: Record<string, string>,
    ): Promise<Edge[]> => {
        if (!projectId) throw new Error('projectId is required')
        const restored: Edge[] = []
        for (const edge of edges) {
            const source = nodeIdMap[edge.source] ?? edge.source
            const target = nodeIdMap[edge.target] ?? edge.target
            const res = await createEdge({
                projectId,
                sourceNodeId: source,
                targetNodeId: target,
                sourceHandle: edge.sourceHandle ?? undefined,
                targetHandle: edge.targetHandle ?? undefined,
            }).unwrap()
            restored.push(styleEdge({
                ...edge,
                id: res.id,
                source,
                target,
            }))
        }
        return restored
    }, [projectId, createEdge])

    const restoreEdge = useCallback(async (edge: Edge): Promise<Edge> => {
        if (!projectId) throw new Error('projectId is required')
        const res = await createEdge({
            projectId,
            sourceNodeId: edge.source,
            targetNodeId: edge.target,
            sourceHandle: edge.sourceHandle ?? undefined,
            targetHandle: edge.targetHandle ?? undefined,
        }).unwrap()
        return styleEdge({ ...edge, id: res.id })
    }, [projectId, createEdge])

    const applyUndo = useCallback(async (entry: HistoryEntry): Promise<HistoryEntry> => {
        switch (entry.kind) {
            case 'node:create': {
                const { node } = entry
                await safelyDeleteNode(node.id)
                setNodes((prev) => prev.filter((n) => n.id !== node.id))
                setEdges((prev) => prev.filter((e) => e.source !== node.id && e.target !== node.id))
                return entry
            }
            case 'node:delete': {
                const restoredNode = await restoreNode(entry.node)
                const nodeIdMap = { [entry.node.id]: restoredNode.id }
                const restoredEdges = await restoreEdges(entry.edges, nodeIdMap)
                setNodes((prev) => [...prev, restoredNode])
                setEdges((prev) => [...prev, ...restoredEdges])
                return { kind: 'node:delete', node: restoredNode, edges: restoredEdges }
            }
            case 'node:move': {
                await updateNodePosition({
                    nodeId: entry.nodeId,
                    positionX: entry.from.x,
                    positionY: entry.from.y,
                }).unwrap()
                setNodes((prev) => prev.map((n) =>
                    n.id === entry.nodeId ? { ...n, position: { ...entry.from } } : n
                ))
                return entry
            }
            case 'edge:create': {
                await deleteEdge({ edgeId: entry.edge.id }).unwrap()
                setEdges((prev) => prev.filter((e) => e.id !== entry.edge.id))
                return entry
            }
            case 'edge:delete': {
                const restoredEdge = await restoreEdge(entry.edge)
                setEdges((prev) => [...prev, restoredEdge])
                return { kind: 'edge:delete', edge: restoredEdge }
            }
            default:
                return entry
        }
    }, [safelyDeleteNode, deleteEdge, restoreNode, restoreEdges, restoreEdge, setNodes, setEdges, updateNodePosition])

    const applyRedo = useCallback(async (entry: HistoryEntry): Promise<HistoryEntry> => {
        switch (entry.kind) {
            case 'node:create': {
                const restoredNode = await restoreNode(entry.node)
                setNodes((prev) => [...prev, restoredNode])
                return { kind: 'node:create', node: restoredNode }
            }
            case 'node:delete': {
                const { node, edges } = entry
                await safelyDeleteNode(node.id)
                setNodes((prev) => prev.filter((n) => n.id !== node.id))
                const edgeIds = new Set(edges.map((e) => e.id))
                setEdges((prev) => prev.filter((e) =>
                    e.source !== node.id && e.target !== node.id && !edgeIds.has(e.id)
                ))
                return entry
            }
            case 'node:move': {
                await updateNodePosition({
                    nodeId: entry.nodeId,
                    positionX: entry.to.x,
                    positionY: entry.to.y,
                }).unwrap()
                setNodes((prev) => prev.map((n) =>
                    n.id === entry.nodeId ? { ...n, position: { ...entry.to } } : n
                ))
                return entry
            }
            case 'edge:create': {
                const { connection } = entry
                const res = await createEdge({
                    projectId: connection.projectId,
                    sourceNodeId: connection.source!,
                    targetNodeId: connection.target!,
                    sourceHandle: connection.sourceHandle ?? undefined,
                    targetHandle: connection.targetHandle ?? undefined,
                }).unwrap()
                const colors = getCustomHandleColors(connection.sourceHandle as TContentFactoryPin['contentType'])
                const restoredEdge: Edge = {
                    ...entry.edge,
                    id: res.id,
                    source: connection.source!,
                    target: connection.target!,
                    sourceHandle: connection.sourceHandle ?? undefined,
                    targetHandle: connection.targetHandle ?? undefined,
                    style: { stroke: colors.backgroundColor, strokeWidth: 2 },
                }
                setEdges((prev) => [...prev, restoredEdge])
                return { kind: 'edge:create', edge: restoredEdge, connection }
            }
            case 'edge:delete': {
                await deleteEdge({ edgeId: entry.edge.id }).unwrap()
                setEdges((prev) => prev.filter((e) => e.id !== entry.edge.id))
                return entry
            }
            default:
                return entry
        }
    }, [restoreNode, safelyDeleteNode, updateNodePosition, createEdge, deleteEdge, setNodes, setEdges])

    const undo = useCallback(async () => {
        if (!projectId || undoStack.length === 0 || isApplyingHistoryRef.current) return
        const entry = undoStack[undoStack.length - 1]
        isApplyingHistoryRef.current = true
        setIsHistoryBusy(true)
        try {
            const redoEntry = await applyUndo(entry)
            let nodeIdMap: IdMap = {}
            let edgeIdMap: IdMap = {}

            if (entry.kind === 'node:delete' && redoEntry.kind === 'node:delete') {
                if (entry.node.id !== redoEntry.node.id) {
                    nodeIdMap = { [entry.node.id]: redoEntry.node.id }
                }
                edgeIdMap = entry.edges.reduce<IdMap>((acc, oldEdge, index) => {
                    const restoredEdge = redoEntry.edges[index]
                    if (restoredEdge && oldEdge.id !== restoredEdge.id) {
                        acc[oldEdge.id] = restoredEdge.id
                    }
                    return acc
                }, {})
            }

            setUndoStack((prev) => {
                const next = prev.slice(0, -1)
                if (Object.keys(nodeIdMap).length === 0 && Object.keys(edgeIdMap).length === 0) {
                    return next
                }
                return next.map((stackEntry) => remapHistoryEntry(stackEntry, nodeIdMap, edgeIdMap))
            })
            setRedoStack((prev) => {
                const nextRedoEntry = (
                    Object.keys(nodeIdMap).length === 0 && Object.keys(edgeIdMap).length === 0
                ) ? redoEntry : remapHistoryEntry(redoEntry, nodeIdMap, edgeIdMap)
                if (Object.keys(nodeIdMap).length === 0 && Object.keys(edgeIdMap).length === 0) {
                    return [...prev, nextRedoEntry]
                }
                return [
                    ...prev.map((stackEntry) => remapHistoryEntry(stackEntry, nodeIdMap, edgeIdMap)),
                    nextRedoEntry,
                ]
            })
        } catch (error) {
            console.error('undo failed', error)
            showError()
        } finally {
            isApplyingHistoryRef.current = false
            setIsHistoryBusy(false)
        }
    }, [projectId, undoStack, applyUndo, showError])

    const redo = useCallback(async () => {
        if (!projectId || redoStack.length === 0 || isApplyingHistoryRef.current) return
        const entry = redoStack[redoStack.length - 1]
        isApplyingHistoryRef.current = true
        setIsHistoryBusy(true)
        try {
            const undoEntry = await applyRedo(entry)
            setRedoStack((prev) => prev.slice(0, -1))
            setUndoStack((prev) => [...prev, undoEntry].slice(-MAX_CANVAS_HISTORY))
        } catch (error) {
            console.error('redo failed', error)
            showError()
        } finally {
            isApplyingHistoryRef.current = false
            setIsHistoryBusy(false)
        }
    }, [projectId, redoStack, applyRedo, showError])

    const resetHistory = useCallback(() => {
        setUndoStack([])
        setRedoStack([])
    }, [])

    return {
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
        pushHistory,
        resetHistory,
        undo,
        redo,
        isApplyingHistory,
        isHistoryBusy,
    }
}
