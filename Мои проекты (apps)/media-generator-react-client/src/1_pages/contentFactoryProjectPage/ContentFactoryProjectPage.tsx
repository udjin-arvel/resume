import React, { useCallback, useState, useEffect, useRef, useContext, useMemo } from 'react'
import { ReactFlow, ReactFlowProvider, Background, BackgroundVariant, applyNodeChanges, applyEdgeChanges, addEdge, useReactFlow, useViewport, useOnViewportChange } from '@xyflow/react'
import type { Connection, Edge, EdgeChange, Node, NodeChange, OnConnectStart, Viewport } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import styles from './ContentFactoryProjectPage.module.css'
import { CONTENT_FACTORY_API, API, useContentFactorySocket, getCustomHandleColors, useContentFactoryCanvasHistory, useBreadcrumbLabel, ContentFactoryCanvasProvider, RadarAntdButton, Spinner } from '@shared'
import { skipToken } from '@reduxjs/toolkit/query'
import { useParams, useNavigate } from 'react-router'
import { ContentFactoryPin, ContentFactoryEdge, GalleryModal } from '@features'
import type { TContentFactoryPin, TContentFactoryPinGeneratedContent, TContentFactoryPinUserContent, ISocketMessageData } from '@shared/models/models'
import { Tooltip, App as AntdApp, ConfigProvider, Select, Popover, Divider } from 'antd'
import { AuthContext } from '@app'


const controlPanelIcons = {
    'text': (
        <svg width="15" height="14" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.95833 0C1.77221 0 0 1.77221 0 3.95833C0 4.30351 0.279822 4.58333 0.625 4.58333C0.970178 4.58333 1.25 4.30351 1.25 3.95833C1.25 2.46256 2.46256 1.25 3.95833 1.25H6.66667V12.5H4.79167C4.44649 12.5 4.16667 12.7798 4.16667 13.125C4.16667 13.4702 4.44649 13.75 4.79167 13.75H9.79167C10.1368 13.75 10.4167 13.4702 10.4167 13.125C10.4167 12.7798 10.1368 12.5 9.79167 12.5H7.91667V1.25H10.625C12.1208 1.25 13.3333 2.46256 13.3333 3.95833C13.3333 4.30351 13.6132 4.58333 13.9583 4.58333C14.3035 4.58333 14.5833 4.30351 14.5833 3.95833C14.5833 1.77221 12.8111 0 10.625 0H3.95833Z" fill="currentColor" />
        </svg>
    ),
    'gen_image': (
        <svg width="17" height="14" viewBox="0 0 17 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4.58333 5C5.27369 5 5.83333 4.44036 5.83333 3.75C5.83333 3.05964 5.27369 2.5 4.58333 2.5C3.89298 2.5 3.33333 3.05964 3.33333 3.75C3.33333 4.44036 3.89298 5 4.58333 5Z" fill="currentColor" />
            <path fillRule="evenodd" clipRule="evenodd" d="M3.33333 0H13.3333C15.1743 0 16.6667 1.49238 16.6667 3.33333V10C16.6667 11.8409 15.1743 13.3333 13.3333 13.3333H3.33333C1.49238 13.3333 0 11.8409 0 10V3.33333C0 1.49238 1.49238 0 3.33333 0ZM13.3333 1.25H3.33333C2.18274 1.25 1.25 2.18274 1.25 3.33333V10C1.25 10.3215 1.32284 10.626 1.45292 10.898L3.27859 8.38765C4.11853 7.23274 5.86484 7.30996 6.59957 8.5345C6.91745 9.06429 7.70543 8.99734 7.92937 8.42151L8.84901 6.05672C9.43591 4.54754 11.5081 4.38777 12.3194 5.78914L15.2418 10.8369C15.3542 10.5807 15.4167 10.2977 15.4167 10V3.33333C15.4167 2.18274 14.4839 1.25 13.3333 1.25ZM3.33333 12.0833C2.96767 12.0833 2.62401 11.9891 2.3253 11.8237L4.28951 9.12287C4.60267 8.69227 5.25377 8.72106 5.52771 9.17762C6.38029 10.5986 8.49376 10.419 9.09437 8.87457L10.014 6.50978C10.2209 5.97767 10.9516 5.92133 11.2376 6.41544L14.362 11.8121C14.0585 11.9847 13.7074 12.0833 13.3333 12.0833H3.33333Z" fill="currentColor" />
        </svg>

    ),
    'gen_video': (
        <svg width="17" height="14" viewBox="0 0 17 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M5.41667 8.90576C5.41667 10.3098 7.02174 11.1473 8.22003 10.3685L11.2804 8.37937C12.351 7.68354 12.351 6.1498 11.2804 5.45396L8.22003 3.46487C7.02174 2.68603 5.41667 3.52351 5.41667 4.92757V8.90576ZM6.66667 8.90576V4.92757C6.66667 4.73965 6.76429 4.5813 6.94722 4.48585C7.1319 4.38949 7.34858 4.38929 7.53883 4.51295L10.5992 6.50204C10.9114 6.70495 10.9114 7.12838 10.5992 7.3313L7.53883 9.32039C7.34858 9.44404 7.1319 9.44384 6.94722 9.34748C6.76429 9.25204 6.66667 9.09368 6.66667 8.90576Z" fill="currentColor" />
            <path fillRule="evenodd" clipRule="evenodd" d="M13.3333 0H3.33333C1.49238 0 0 1.49238 0 3.33333V10.6667C0 12.5076 1.49238 14 3.33333 14H13.3333C15.1743 14 16.6667 12.5076 16.6667 10.6667V3.33333C16.6667 1.49238 15.1743 0 13.3333 0ZM3.33333 1.25H13.3333C14.4839 1.25 15.4167 2.18274 15.4167 3.33333V10.6667C15.4167 11.8173 14.4839 12.75 13.3333 12.75H3.33333C2.18274 12.75 1.25 11.8173 1.25 10.6667V3.33333C1.25 2.18274 2.18274 1.25 3.33333 1.25Z" fill="currentColor" />
        </svg>

    ),
    'note': (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.1875 1.25C1.68103 1.25 1.25 1.67193 1.25 2.21788V9.38117C1.25 9.80158 1.42282 9.9471 1.49653 9.98037C1.55385 10.0062 1.74053 10.0481 2.01498 9.76371C2.24718 9.52307 2.50842 9.24909 2.80212 8.93722C3.34349 8.36238 4.06758 8.07496 4.79167 8.07496V9.32496C4.39919 9.32496 4.00672 9.48138 3.7121 9.79421C3.41531 10.1094 3.15056 10.387 2.91449 10.6317C2.3744 11.1914 1.64121 11.4171 0.982295 11.1197C0.339778 10.8297 0 10.1449 0 9.38117V2.21788C0 1.00438 0.968085 0 2.1875 0H7.39583C8.61525 0 9.58333 1.00438 9.58333 2.21788V3.125H8.33333V2.21788C8.33333 1.67193 7.90231 1.25 7.39583 1.25H2.1875Z" fill="currentColor" />
            <path fillRule="evenodd" clipRule="evenodd" d="M8.02083 4.16667C6.80142 4.16667 5.83333 5.17105 5.83333 6.38455V13.5478C5.83333 14.3115 6.17311 14.9964 6.81563 15.2864C7.47454 15.5838 8.20773 15.3581 8.74783 14.7983C8.9839 14.5537 9.24864 14.276 9.54544 13.9609C10.1347 13.3352 11.1153 13.3352 11.7046 13.9609C12.0014 14.276 12.2661 14.5537 12.5022 14.7983C13.0423 15.3581 13.7755 15.5838 14.4344 15.2864C15.0769 14.9964 15.4167 14.3115 15.4167 13.5478V6.38455C15.4167 5.17105 14.4486 4.16667 13.2292 4.16667H8.02083ZM7.08333 6.38455C7.08333 5.8386 7.51436 5.41667 8.02083 5.41667H13.2292C13.7356 5.41667 14.1667 5.8386 14.1667 6.38455V13.5478C14.1667 13.9682 13.9939 14.1138 13.9201 14.147C13.8628 14.1729 13.6761 14.2148 13.4017 13.9304C13.1695 13.6897 12.9082 13.4158 12.6145 13.1039C11.5318 11.9542 9.71819 11.9542 8.63545 13.1039C8.34175 13.4158 8.08051 13.6897 7.84831 13.9304C7.57386 14.2148 7.38718 14.1729 7.32986 14.147C7.25615 14.1138 7.08333 13.9682 7.08333 13.5478V6.38455Z" fill="currentColor" />
        </svg>

    ),
    'user_image': (
        <svg width="17" height="15" viewBox="0 0 17 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.33853 6.80307C2.93572 5.30775 3.21808 4.08222 3.8398 3.17087C4.47069 2.24609 5.47723 1.60794 6.57108 1.36185C7.66418 1.11592 8.80132 1.2702 9.70285 1.86908C10.5918 2.45959 11.3236 3.5303 11.5297 5.2641C11.567 5.57853 11.8337 5.81534 12.1503 5.81534C13.9292 5.81534 14.9092 7.04461 14.9941 8.38709C15.0782 9.71818 14.2711 11.1852 12.2576 11.5848C11.9191 11.6519 11.699 11.9809 11.7662 12.3194C11.8334 12.658 12.1623 12.878 12.5009 12.8109C15.143 12.2866 16.3643 10.2499 16.2416 8.30823C16.1286 6.52155 14.8675 4.83573 12.6924 4.59475C12.3694 2.83261 11.5265 1.57984 10.3945 0.827875C9.16641 0.0120597 7.66952 -0.166527 6.29671 0.142328C4.92466 0.451014 3.63344 1.2553 2.8072 2.46643C2.05344 3.57133 1.70777 4.98501 2.01019 6.59747C1.31492 6.94022 0.791665 7.39937 0.451105 7.93951C0.0304936 8.6066 -0.0861705 9.35912 0.0602886 10.0717C0.352541 11.4935 1.65544 12.6669 3.4683 12.8811C3.8111 12.9216 4.12182 12.6765 4.16233 12.3337C4.20283 11.9909 3.95778 11.6802 3.61499 11.6397C2.25345 11.4788 1.45244 10.6361 1.28469 9.81998C1.20115 9.41354 1.26546 8.99162 1.50848 8.60619C1.75315 8.21813 2.204 7.82945 2.95255 7.55157C3.25523 7.43922 3.42251 7.11482 3.33853 6.80307Z" fill="currentColor" />
            <path d="M7.68304 8.3117C7.92711 8.06762 8.32284 8.06762 8.56692 8.3117L10.2336 9.97837C10.4777 10.2224 10.4777 10.6182 10.2336 10.8623C9.98951 11.1063 9.59378 11.1063 9.3497 10.8623L8.74998 10.2625V13.7536C8.74998 14.0988 8.47015 14.3786 8.12498 14.3786C7.7798 14.3786 7.49998 14.0988 7.49998 13.7536V10.2625L6.90025 10.8623C6.65618 11.1063 6.26045 11.1063 6.01637 10.8623C5.77229 10.6182 5.77229 10.2224 6.01637 9.97837L7.68304 8.3117Z" fill="currentColor" />
        </svg>
    ),
    'undo': (
        <svg width="15" height="12" viewBox="0 0 15 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.56694 1.06694C3.81102 0.822863 3.81102 0.427135 3.56694 0.183058C3.32286 -0.0610197 2.92713 -0.0610191 2.68306 0.183059L0.183058 2.68307C0.165016 2.70111 0.148191 2.72014 0.132636 2.74003C0.0603825 2.83232 0.013511 2.94543 0.00252444 3.06887C0.000848544 3.08746 0 3.10619 0 3.12501C0 3.26077 0.0441708 3.39198 0.124554 3.49942C0.142316 3.52316 0.161846 3.54574 0.183059 3.56695L2.68306 6.06694C2.92714 6.31102 3.32287 6.31102 3.56694 6.06694C3.81102 5.82286 3.81102 5.42713 3.56694 5.18306L2.13388 3.75H6.45833C10.2553 3.75 13.3333 6.82804 13.3333 10.625C13.3333 10.9702 13.6132 11.25 13.9583 11.25C14.3035 11.25 14.5833 10.9702 14.5833 10.625C14.5833 6.13769 10.9456 2.5 6.45833 2.5H2.13389L3.56694 1.06694Z" fill="currentColor" />
        </svg>
    ),
    'redo': (
        <svg width="15" height="12" viewBox="0 0 15 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.0163 1.06694C10.7722 0.822863 10.7722 0.427135 11.0163 0.183058C11.2604 -0.0610197 11.6561 -0.0610191 11.9002 0.183059L14.3957 2.67862C14.5115 2.79205 14.5833 2.95014 14.5833 3.125C14.5833 3.29949 14.5118 3.45728 14.3965 3.57067L11.9002 6.06694C11.6561 6.31102 11.2604 6.31102 11.0163 6.06694C10.7722 5.82286 10.7722 5.42713 11.0163 5.18306L12.4494 3.75H8.125C4.32805 3.75 1.25 6.82804 1.25 10.625C1.25 10.9702 0.970177 11.25 0.624999 11.25C0.279821 11.25 0 10.9702 0 10.625C0 6.13769 3.63769 2.5 8.125 2.5H12.4494L11.0163 1.06694Z" fill="currentColor" />
        </svg>
    )
}

const initialNodes: Node<TContentFactoryPin>[] = []

const initialEdges: Edge[] = [];

const nodeTypes = {
    contentFactoryPin: ContentFactoryPin,
}

const edgeTypes = {
    default: ContentFactoryEdge,
}

const getCanvasInitZoomState = (): number => {
    let zoom = .7;
    const savedZoom = localStorage.getItem('CANVAS_ZOOM_STATE')
    if (savedZoom) {
        zoom = Number(savedZoom)
    }
    return zoom
}

const VIEWER_NODE_MOVE_DURATION_MS = 350

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

const ContentFactoryProjectPageInner = () => {
    const { projectId } = useParams()
    const navigate = useNavigate()
    const ctx = useContext(AuthContext)
    const isUserExists = Boolean(ctx?.user)
    const { data: projectData, isError: isProjectDataError } = CONTENT_FACTORY_API.useGetContentFactoryProjectByIdQuery(projectId ?? skipToken)
    useBreadcrumbLabel(`/canvas/${projectId}`, projectData?.name ?? '...')
    const [isGalleryModalOpen, setIsGalleryModalOpen] = useState<{ open: boolean, generationId: number | null, contentType: 'image' | 'video' }>({ open: false, generationId: null, contentType: 'image' });
    const [sharePopoverOpen, setSharePopoverOpen] = useState(false)
    const [nodes, setNodes] = useState<Node[]>(initialNodes)
    const [edges, setEdges] = useState<Edge[]>(initialEdges)
    const { data: nodesData, refetch: refetchNodes } = CONTENT_FACTORY_API.useGetContentFactoryNodesQuery(projectId ?? skipToken)
    const { data: edgesData, refetch: refetchEdges } = CONTENT_FACTORY_API.useGetContentFactoryEdgesQuery(projectId ?? skipToken)
    const [duplicateContentFactoryProject, {data: duplicateContentFactoryProjectData, isLoading: isDuplicateContentFactoryProjectLoading, isError: isDuplicateContentFactoryProjectError, isSuccess: isDuplicateContentFactoryProjectSuccess, reset: resetDuplicateContentFactoryProject }] = CONTENT_FACTORY_API.useDuplicateContentFactoryProjectMutation();
    const [createNode] = CONTENT_FACTORY_API.useCreateContentFactoryNodeMutation()
    const [updateNodePosition] = CONTENT_FACTORY_API.useUpdateContentFactoryNodePositionMutation()
    const [createEdge] = CONTENT_FACTORY_API.useCreateContentFactoryEdgeMutation()
    const [deleteEdge] = CONTENT_FACTORY_API.useDeleteContentFactoryEdgeMutation()
    const [deleteNode] = CONTENT_FACTORY_API.useDeleteContentFactoryNodeMutation();
    const { refetch: refetchUserData } = API.useGetUserDataQuery();
    const { data: models } = API.useGetModelsListQuery();
    const { data: projects } = CONTENT_FACTORY_API.useGetContentFactoryProjectsQuery()
    const isViewerMode = useMemo(() => {
        if (!isUserExists) return true;
        if (!projects || !projectId) return undefined;
        const isUserIsProjectOwner = projects?.some(_ => _.id === projectId);
        if (isUserIsProjectOwner) {
            return false
        } else {
            return true
        }
    }, [isUserExists, projects, projectId])
    const { notification, message } = AntdApp.useApp()
    const dragStartPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map())
    const nodesRef = useRef(nodes)
    const nodePositionAnimationsRef = useRef<Map<string, number>>(new Map())

    const animateNodePosition = useCallback((
        nodeId: string,
        to: { x: number; y: number },
        duration = VIEWER_NODE_MOVE_DURATION_MS,
    ) => {
        const existingFrame = nodePositionAnimationsRef.current.get(nodeId)
        if (existingFrame != null) {
            cancelAnimationFrame(existingFrame)
        }

        const node = nodesRef.current.find((n) => n.id === nodeId)
        if (!node) return

        const from = { x: node.position.x, y: node.position.y }
        if (from.x === to.x && from.y === to.y) return

        const start = performance.now()

        const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1)
            const eased = easeOutCubic(progress)

            setNodes((prev) =>
                prev.map((n) =>
                    n.id === nodeId
                        ? {
                            ...n,
                            position: {
                                x: from.x + (to.x - from.x) * eased,
                                y: from.y + (to.y - from.y) * eased,
                            },
                        }
                        : n
                )
            )

            if (progress < 1) {
                const frameId = requestAnimationFrame(tick)
                nodePositionAnimationsRef.current.set(nodeId, frameId)
            } else {
                nodePositionAnimationsRef.current.delete(nodeId)
            }
        }

        const frameId = requestAnimationFrame(tick)
        nodePositionAnimationsRef.current.set(nodeId, frameId)
    }, [])

    const {
        canUndo,
        canRedo,
        pushHistory,
        resetHistory,
        undo,
        redo,
        isApplyingHistory,
        isHistoryBusy,
    } = useContentFactoryCanvasHistory({
        projectId,
        setNodes,
        setEdges,
        createNode,
        deleteNode,
        updateNodePosition,
        createEdge,
        deleteEdge,
        notification,
    })
    const { screenToFlowPosition, setCenter, getZoom, zoomTo } = useReactFlow()
    const viewport = useViewport()
    useOnViewportChange({
        onEnd: (viewport: Viewport) => {
            const { zoom } = viewport;
            localStorage.setItem('CANVAS_ZOOM_STATE', zoom.toString())
        }
    })
    const [connectionLineStyle, setConnectionLineStyle] = useState<React.CSSProperties>({})
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; flowX: number; flowY: number } | null>(null)
    const [hoveredSourceContentType, setHoveredSourceContentType] = useState<TContentFactoryPin['contentType'] | null>(null)
    const [hoveredSourceNodeId, setHoveredSourceNodeId] = useState<string | null>(null)

    const onPaneContextMenu = useCallback((event: React.MouseEvent | MouseEvent) => {
        event.preventDefault()
        const clientX = (event as MouseEvent).clientX
        const clientY = (event as MouseEvent).clientY
        const menuWidth = 240
        const menuHeight = 220
        const x = Math.min(clientX, window.innerWidth - menuWidth - 8)
        const y = Math.min(clientY, window.innerHeight - menuHeight - 8)
        const flowPos = screenToFlowPosition({ x: clientX, y: clientY })
        setContextMenu({ x, y, flowX: flowPos.x, flowY: flowPos.y })
    }, [screenToFlowPosition])

    const closeContextMenu = useCallback(() => setContextMenu(null), [])

    const onConnectStart = useCallback<OnConnectStart>((_, { handleId }) => {
        const colors = getCustomHandleColors(handleId as TContentFactoryPin['contentType'])
        setConnectionLineStyle({ stroke: colors.backgroundColor, strokeWidth: 2 })
    }, [])

    const onConnectEnd = useCallback(() => {
        setConnectionLineStyle({})
        setHoveredSourceContentType(null)
        setHoveredSourceNodeId(null)
    }, [])

    const onNodeUpdated = useCallback((updateData: ISocketMessageData) => {
        console.log('WS_DATA', updateData)
        const { payload, eventType } = updateData;
        const { node_id, result_url, result_url_thumbnail, action, position_x, position_y, status, error, generation, prompt, data, path, path_thumbnail } = payload ?? {};
        const nodePayloadData = data && typeof data === 'object' ? data as Record<string, unknown> : {}
        const nodeId = node_id?.toString()

        if (eventType === 'node.status_changed' && node_id) {
            setNodes((prev) => prev.map((node) => {
                if (node.id !== nodeId) return node
                if (node.data?.status === 'completed' && status === 'processing') return node
                return { ...node, data: { ...node.data, status } }
            }))
            setEdges((prev) => prev.map((edge) => (edge.target === nodeId)
                ? { ...edge, data: { ...edge.data, isDeletable: status && (status === 'queued' || status === 'processing') ? false : true } }
                : edge))
        }
        if (eventType === 'node.failed' && node_id) {
            if (!isViewerMode) {
                notification.error({
                    title: 'Не удалось сгенерировать',
                    description: error as string ?? ''
                })
            }
            setNodes((prev) => prev.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, status: 'failed' } } : node))
        }
        if (eventType === 'node.result_ready' && node_id) {
            const generationPayload = generation && typeof generation === 'object'
                ? generation as Record<string, unknown>
                : null
            const resolvedResultUrl = (result_url_thumbnail
                ?? result_url
                ?? generationPayload?.result_thumbnail
                ?? generationPayload?.result
                ?? null) as string | null

            setNodes((prev) => prev.map((node) => node.id === nodeId
                ? {
                    ...node,
                    data: {
                        ...node.data,
                        generation: generation ?? null,
                        resultUrl: resolvedResultUrl,
                        status: 'completed',
                    },
                }
                : node))
            refetchEdges()
            if (!isViewerMode) {
                refetchUserData()
            }
        }

        if (!isViewerMode) {
            if (eventType === 'project.updated' && action && (action === 'node_image_uploaded' || action === 'node_video_uploaded')) {
                refetchEdges()
            }
            if (eventType === 'project.updated' && action === 'node_position_updated' && node_id && position_x != null && position_y != null) {
                setNodes((prev) => prev.map((node) =>
                    node.id === node_id.toString()
                        ? { ...node, position: { x: Number(position_x), y: Number(position_y) } }
                        : node
                ))
            }
        } else {
            if (eventType === 'project.updated' && action) {
                switch (action) {
                    case 'node_created':
                        refetchNodes()
                        return
                    case 'node_deleted':
                        refetchNodes()
                        refetchEdges()
                        return
                    case 'node_prompt_updated':
                        setNodes((prev) => prev.map((node) => node.id === node_id?.toString() ? { ...node, data: { ...node.data, prompt: prompt ?? '' } } : node))
                        return
                    case 'node_image_uploaded':
                        setNodes((prev) => prev.map((node) => node.id === node_id?.toString()
                            ? {
                                ...node,
                                data: {
                                    ...node.data,
                                    user_image_thumbnail_path: (path_thumbnail ?? nodePayloadData.user_image_thumbnail_path ?? null) as string | null,
                                    user_image_thumbnail_url: (nodePayloadData.url_thumbnail ?? nodePayloadData.url ?? null) as string | null,
                                    user_image_path: (path ?? nodePayloadData.user_image_path ?? null) as string | null,
                                    user_image_url: (nodePayloadData.user_image_url ?? null) as string | null,
                                },
                            }
                            : node))
                        return
                    case 'node_position_updated':
                        if (node_id != null && position_x != null && position_y != null) {
                            animateNodePosition(node_id.toString(), {
                                x: Number(position_x),
                                y: Number(position_y),
                            })
                        }
                        return
                }
            }
            if (eventType === 'edge.updated' && action) {
                switch (action) {
                    case 'created':
                        refetchEdges()
                        return
                    case 'deleted':
                        refetchEdges()
                        return
                }
            }
        }
    }, [isViewerMode, notification, refetchEdges, refetchNodes, refetchUserData, animateNodePosition])

    useContentFactorySocket(projectId ?? '', { onNodeUpdated }) // websocket listener

    const onNodesChange = useCallback(
        (changes: NodeChange[]) => {
            if (!isViewerMode && !isApplyingHistory()) {
                changes.forEach((change) => {
                    if (change.type === 'position' && change.dragging) {
                        const node = nodes.find((n) => n.id === change.id)
                        if (node && !dragStartPositionsRef.current.has(change.id)) {
                            dragStartPositionsRef.current.set(change.id, {
                                x: node.position.x,
                                y: node.position.y,
                            })
                        }
                    }
                    if (change.type === 'position' && !change.dragging && change.position) {
                        const from = dragStartPositionsRef.current.get(change.id)
                        dragStartPositionsRef.current.delete(change.id)
                        if (from && (from.x !== change.position.x || from.y !== change.position.y)) {
                            pushHistory({
                                kind: 'node:move',
                                nodeId: change.id,
                                from,
                                to: { x: change.position.x, y: change.position.y },
                            })
                        }
                    }
                    if (change.type === 'remove') {
                        const node = nodes.find((n) => n.id === change.id) as Node<TContentFactoryPin> | undefined
                        if (node) {
                            const connectedEdges = edges.filter(
                                (e) => e.source === change.id || e.target === change.id,
                            )
                            pushHistory({ kind: 'node:delete', node, edges: connectedEdges })
                        }
                    }
                })
            }
            if (!isViewerMode) {
                changes.forEach((change) => {
                    if (change.type === 'position' && !change.dragging) {
                        updateNodePosition({
                            nodeId: change.id,
                            positionX: change.position?.x ?? 0,
                            positionY: change.position?.y ?? 0
                        })
                    }
                    if (change.type === 'remove') {
                        deleteNode({
                            nodeId: change.id,
                        })
                    }
                })
            }
            setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot))
        },
        [isViewerMode, isApplyingHistory, nodes, edges, pushHistory, updateNodePosition, deleteNode],
    );
    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => {
            if (!isViewerMode && !isApplyingHistory()) {
                changes.forEach((change) => {
                    if (change.type === 'remove') {
                        const edge = edges.find((e) => e.id === change.id)
                        if (edge) {
                            pushHistory({ kind: 'edge:delete', edge })
                        }
                    }
                })
            }
            if (!isViewerMode) {
                changes.forEach((change) => {
                    if (change.type === 'remove') {
                        deleteEdge({
                            edgeId: change.id,
                        })
                    }
                })
            }
            setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot))
        },
        [isViewerMode, isApplyingHistory, edges, pushHistory, deleteEdge],
    );
    const onConnect = useCallback(
        async (params: Connection) => {
            const { source, target, sourceHandle, targetHandle } = params;
            if (source === target) return;
            if (sourceHandle !== targetHandle) return;
            const colors = getCustomHandleColors(sourceHandle as TContentFactoryPin['contentType'])
            try {
                if (projectId) {
                    const res = await createEdge({
                        projectId,
                        sourceNodeId: params.source!,
                        targetNodeId: params.target!,
                        sourceHandle: sourceHandle ?? undefined,
                        targetHandle: targetHandle ?? undefined,
                    }).unwrap()
                    const newEdge: Edge = {
                        id: res.id,
                        source: params.source!,
                        target: params.target!,
                        sourceHandle: sourceHandle ?? undefined,
                        targetHandle: targetHandle ?? undefined,
                        style: { stroke: colors.backgroundColor, strokeWidth: 2 },
                    }
                    setEdges((edgesSnapshot) => addEdge(newEdge, edgesSnapshot))
                    pushHistory({
                        kind: 'edge:create',
                        edge: newEdge,
                        connection: { ...params, projectId },
                    })
                }
            } catch (error) {
                console.error('something went wrong', error)
                notification.error({
                    message: 'Соединение не стабильно',
                    description: 'Попробуйте еще раз',
                })
            }
        },
        [projectId, createEdge, pushHistory, notification],
    );
    const handleOpenGalleryModal = useCallback((generationId: number, contentType: 'image' | 'video') => {
        setIsGalleryModalOpen({ open: true, generationId, contentType })
    }, [])
    const handleAddNode = useCallback(async (nodeType: TContentFactoryPinGeneratedContent | TContentFactoryPinUserContent, isNote: boolean = false, position?: { x: number; y: number }) => {
        const centerFlowPosition = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
        const posX = position?.x ?? centerFlowPosition.x
        const posY = position?.y ?? centerFlowPosition.y
        const topLayerZIndex = nodes?.reduce((maxZIndex, node) => Math.max(maxZIndex, node?.zIndex ?? 0), 0) ?? 0
        const nodeZIndex = position ? 0 : topLayerZIndex + 1

        let generationParams: { ai_model?: string; aspect_ratio?: string } = {};
        if (nodeType.contentType === 'IMAGE' || nodeType.contentType === 'VIDEO') {
            const modelsList = nodeType.contentType === 'IMAGE' ? models?.images : models?.videos;
            const model = modelsList?.[0] ?? null;
            const aspectRatio = model?.aspect_ratio_options?.[0] ?? null;
            generationParams = {
                ai_model: model?.id,
                aspect_ratio: aspectRatio ?? undefined,
            }
        }
        const newNode: Node<TContentFactoryPin> = {
            id: (nodes?.length + 1).toString() + '_' + Date.now().toString(),
            type: 'contentFactoryPin',
            position: { x: posX, y: posY },
            zIndex: nodeZIndex,
            // aspectRatio: aspectRatio,
            data: {
                id: (nodes?.length + 1).toString(),
                ...nodeType,
                isNote: isNote,
                ...generationParams,
            }
        }



        try {
            if (projectId) {
                const res = await createNode({
                    projectId,
                    pinType: nodeType.pinType,
                    contentType: nodeType.contentType,
                    positionX: posX,
                    positionY: posY,
                    aiModel: generationParams?.ai_model ?? undefined,
                    aspectRatio: generationParams?.aspect_ratio ?? undefined,
                    zIndex: nodeZIndex,
                    data: {
                        ...nodeType,
                        isNote: isNote,
                        ...generationParams,
                    }
                }).unwrap()
                if (res.id) {
                    newNode.id = res.id
                    newNode.data.id = res.id
                }
                setNodes((prev) => [...prev, newNode])
                pushHistory({ kind: 'node:create', node: newNode })
                if (!position) {
                    setCenter(posX, posY, { duration: 400, zoom: getZoom() })
                }
            }
        } catch (error) {
            console.error('something went wrong', error)
            notification.error({
                message: 'Соединение не стабильно',
                description: 'Попробуйте еще раз',
            })
        }

    }, [nodes, projectId, createNode, pushHistory, setCenter, getZoom, notification])

    useEffect(function syncNodesState() {
        nodesRef.current = nodes
    }, [nodes])
    useEffect(function cancelNodePositionAnimations() {
        const animations = nodePositionAnimationsRef.current
        return () => {
            animations.forEach((frameId) => cancelAnimationFrame(frameId))
            animations.clear()
        }
    }, [])
    useEffect(function localNodesStateSync() {
        if (nodesData) {
            const normalizedNodesData = nodesData.map((node) => {
                return {
                    id: node.id,
                    type: 'contentFactoryPin',
                    position: { x: node.positionX, y: node.positionY },
                    data: {
                        id: node.id,
                        pinType: node.type.split(':')[0],
                        contentType: node.type.split(':')[1],
                        prompt: node?.prompt ?? null,
                        user_image_thumbnail_path: node?.data?.user_image_thumbnail_path ?? null,
                        user_image_thumbnail_url: node?.data?.url ?? null,
                        user_image_path: node?.data?.user_image_path ?? null,
                        user_image_url: node?.data?.user_image_url ?? null,
                        isNote: node?.data?.isNote ?? false,
                        // note: node?.data?.note ?? null,
                        note: node?.prompt ?? null,
                        resultUrl: node?.resultUrl ?? null,
                        status: node?.status,
                        ai_model: node?.aiModel ?? null,
                        aspect_ratio: node?.aspectRatio ?? null,
                        generation: node?.generation ?? null,
                        handleOpenGalleryModal: handleOpenGalleryModal,
                        isViewerMode: isViewerMode,
                    }

                }
            })
            setNodes([...normalizedNodesData])
        }
    }, [nodesData])
    useEffect(function localEdgesStateSync() {
        if (edgesData && nodesData) {
            const normalizedEdgesData = edgesData.map((edge) => {
                const targetNode = nodesData?.find((node) => node.id === edge.targetNodeId);
                const { status } = targetNode ?? {};
                const colors = getCustomHandleColors(edge.sourceHandle as TContentFactoryPin['contentType']);
                return ({
                    id: edge.id,
                    source: edge.sourceNodeId,
                    target: edge.targetNodeId,
                    dbId: edge.id,
                    sourceHandle: edge.sourceHandle ?? undefined,
                    targetHandle: edge.targetHandle ?? undefined,
                    status: edge.status,
                    isViewerMode: isViewerMode,
                    style: {
                        stroke: colors.backgroundColor,
                        strokeWidth: 2,
                        strokeDasharray: edge.status === 'stale' ? '5 5' : undefined,
                    },
                    data: {
                        isDeletable: status && (status === 'queued' || status === 'processing') ? false : true,
                    }
                })
            })
            setEdges([...normalizedEdgesData])
        }
    }, [edgesData, nodesData])
    useEffect(function windowFocusEffect() {
        refetchNodes()
        refetchEdges()
        const handleFocus = () => {
            refetchNodes()
            refetchEdges()
        }
        window.addEventListener('focus', handleFocus)
        return () => {
            window.removeEventListener('focus', handleFocus)
        }
    }, [])
    useEffect(function preventPinchZoom() {
        const preventBrowserZoom = (e: WheelEvent) => {
            if (e.ctrlKey) {
                e.preventDefault()
            }
        }
        document.addEventListener('wheel', preventBrowserZoom, { passive: false })
        return () => {
            document.removeEventListener('wheel', preventBrowserZoom)
        }
    }, [])
    useEffect(function restoreSavedZoomState() {
        const savedZoom = localStorage.getItem('CANVAS_ZOOM_STATE')
        if (savedZoom) {
            zoomTo(Number(savedZoom))
        }
    }, [])
    useEffect(function projectDataErrorEffect() {
        if (isProjectDataError) {
            notification.error({
                title: 'Ошибка',
                message: 'Не удалось загрузить проект',
            })
        }
    }, [isProjectDataError])
    useEffect(function duplicateContentFactoryProjectEffect() {
        console.log('duplicateContentFactoryProjectData', duplicateContentFactoryProjectData)
        if (isDuplicateContentFactoryProjectSuccess) {
            message.success('Файл скопирован')
            navigate(`/canvas/${duplicateContentFactoryProjectData?.id}`, { viewTransition: true })
            resetDuplicateContentFactoryProject()
        }
        if (isDuplicateContentFactoryProjectError) {
            message.error('Не удалось скопировать файл')
            resetDuplicateContentFactoryProject()
        }
    }, [isDuplicateContentFactoryProjectError, isDuplicateContentFactoryProjectSuccess, duplicateContentFactoryProjectData])
    return (
        <ContentFactoryCanvasProvider
            onGenerationStart={resetHistory}
            hoveredSourceContentType={hoveredSourceContentType}
            hoveredSourceNodeId={hoveredSourceNodeId}
            setHoveredSourceContentType={setHoveredSourceContentType}
            setHoveredSourceNodeId={setHoveredSourceNodeId}
        >
            <>
                <main className={styles.page}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={isViewerMode ? undefined : onConnect}
                        fitView
                        fitViewOptions={{
                            minZoom: getCanvasInitZoomState(),
                            maxZoom: getCanvasInitZoomState(),
                            interpolate: 'smooth'
                        }}
                        panOnScroll
                        panOnDrag
                        selectionOnDrag={!isViewerMode}
                        nodesDraggable={!isViewerMode}
                        nodesConnectable={!isViewerMode}
                        elementsSelectable
                        elevateEdgesOnSelect
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        connectionLineStyle={connectionLineStyle}
                        onConnectStart={isViewerMode ? undefined : onConnectStart}
                        onConnectEnd={isViewerMode ? undefined : onConnectEnd}
                        onPaneContextMenu={isViewerMode ? undefined : onPaneContextMenu}
                        onPaneClick={closeContextMenu}
                        onMoveStart={closeContextMenu}
                        proOptions={{ hideAttribution: true }}
                    >
                        <Background
                            variant={BackgroundVariant.Dots}
                            gap={20}
                            size={1.5}
                            color="var(--ant-color-border)"
                            style={{ background: 'transparent' }}
                        />
                    </ReactFlow>
                    {!isViewerMode && contextMenu && (
                        <div
                            className={styles.contextMenu}
                            style={{ left: contextMenu.x, top: contextMenu.y }}
                        >
                            <span className={styles.contextMenu__header}>Добавить новую ноду</span>
                            <button
                                className={styles.contextMenu__item}
                                onClick={() => { handleAddNode({ pinType: 'USER_CONTENT', contentType: 'TEXT' }, false, { x: contextMenu.flowX, y: contextMenu.flowY }); closeContextMenu() }}
                            >
                                {controlPanelIcons.text}
                                Текст
                            </button>
                            <button
                                className={styles.contextMenu__item}
                                onClick={() => { handleAddNode({ pinType: 'GENERATED_CONTENT', contentType: 'IMAGE' }, false, { x: contextMenu.flowX, y: contextMenu.flowY }); closeContextMenu() }}
                            >
                                {controlPanelIcons.gen_image}
                                Генерация изображения
                            </button>
                            <button
                                className={styles.contextMenu__item}
                                onClick={() => { handleAddNode({ pinType: 'GENERATED_CONTENT', contentType: 'VIDEO' }, false, { x: contextMenu.flowX, y: contextMenu.flowY }); closeContextMenu() }}
                            >
                                {controlPanelIcons.gen_video}
                                Генерация видео
                            </button>
                            <button
                                className={styles.contextMenu__item}
                                onClick={() => { handleAddNode({ pinType: 'USER_CONTENT', contentType: 'TEXT' }, true, { x: contextMenu.flowX, y: contextMenu.flowY }); closeContextMenu() }}
                            >
                                {controlPanelIcons.note}
                                Заметка
                            </button>
                            <button
                                className={styles.contextMenu__item}
                                onClick={() => { handleAddNode({ pinType: 'USER_CONTENT', contentType: 'IMAGE' }, false, { x: contextMenu.flowX, y: contextMenu.flowY }); closeContextMenu() }}
                            >
                                {controlPanelIcons.user_image}
                                Загрузить
                            </button>
                        </div>
                    )}
                </main>
                {/* viewer mode banner */}
                {isViewerMode && isViewerMode != null && (
                    <div className={styles.viewerModeBanner} style={{ top: isUserExists ? '60px' : '8px' }}>
                        <svg width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M10.4547 1.03188C8.39564 0.844718 6.77312 1.49933 5.48398 2.55793C4.42937 3.42395 3.59224 4.56623 2.93795 5.75392C2.65116 6.2745 2.40107 6.80094 2.18428 7.31226C3.25214 7.83379 4.39288 7.81379 5.51367 7.44162C6.6658 7.05904 7.77832 6.30761 8.70422 5.42035C8.61152 5.32866 8.46037 5.23628 8.21375 5.17026C7.73057 5.04092 6.91539 5.02875 5.62127 5.35228C5.35337 5.41925 5.08191 5.25637 5.01493 4.98848C4.94796 4.72058 5.11084 4.44911 5.37874 4.38214C6.75128 4.039 7.75662 4.01268 8.47235 4.20428C8.85929 4.30786 9.16743 4.47842 9.39377 4.69583C10.1734 3.79655 10.7115 2.86948 10.9122 2.14878C11.0318 1.71926 11.0103 1.44082 10.9413 1.28952C10.8923 1.18224 10.786 1.06199 10.4547 1.03188ZM1.82006 8.24671C3.14424 8.86756 4.53751 8.81946 5.82881 8.39066C7.28273 7.90787 8.62808 6.93893 9.67915 5.86187C10.7596 4.75476 11.5791 3.48149 11.8756 2.41704C12.022 1.89101 12.0624 1.3373 11.8509 0.874167C11.6194 0.367019 11.1456 0.0905537 10.5453 0.0359823C8.19507 -0.177635 6.31746 0.579549 4.84936 1.78511C3.66666 2.75631 2.75562 4.01245 2.06206 5.27139C1.6751 5.97381 1.35329 6.68175 1.08818 7.34941C0.349414 9.20999 0.0412348 11.0837 0.00020799 12.5196C-0.00767858 12.7956 0.209694 13.0258 0.485724 13.0337C0.761754 13.0416 0.991913 12.8242 0.9998 12.5482C1.03395 11.3528 1.27001 9.81191 1.82006 8.24671Z" fill="#8C8C8C" />
                        </svg>
                        <span className="text_secondary">
                            {isUserExists ? 'Чтобы редактировать файл, сохраните его к себе' : 'Чтобы редактировать файл, выполните вход'}
                        </span>
                        {isUserExists ?
                            (
                                <RadarAntdButton
                                    type="primary"
                                    onClick={() => {
                                        duplicateContentFactoryProject({ projectId: projectId ?? '' })
                                    }}
                                    loading={isDuplicateContentFactoryProjectLoading}
                                    style={{ height: 32 }}
                                >
                                    <span className="text_secondary">Дублировать в мои файлы</span>
                                </RadarAntdButton>
                            ) : (
                                <RadarAntdButton
                                    type="primary"
                                    style={{ height: 32 }}
                                    href='/signin'
                                >
                                    <span className="text_secondary">Войти</span>
                                </RadarAntdButton>
                            )
                        }
                    </div>
                )}
                {/* top-right control panel */}
                <div className={`${styles.controlPanel} ${styles.controlPanel__topRight}`} style={{ top: isUserExists ? '60px' : '8px' }}>
                    <ConfigProvider
                        theme={{
                            components: {
                                Select: {
                                    controlHeight: 36,
                                    colorBorder: 'transparent',
                                    activeBorderColor: 'transparent',
                                    hoverBorderColor: 'transparent',
                                    activeOutlineColor: 'transparent',
                                    optionFontSize: 13,
                                    optionPadding: 0,
                                    optionActiveBg: 'transparent',
                                    optionSelectedBg: 'transparent',
                                    colorBgBase: 'transparent',
                                    colorBgContainer: 'transparent',
                                }
                            }
                        }}
                    >
                        <Select
                            options={[50, 60, 70, 80, 90, 100, 200].map(pct => ({ label: `${pct}%`, value: pct }))}
                            value={Math.round(viewport.zoom * 100) + '%'}
                            style={{ width: 80 }}
                            className={styles.zoomSelect}
                            popupMatchSelectWidth={false}
                            getPopupContainer={(triggerNode) => triggerNode.parentElement as HTMLElement}
                            suffixIcon={
                                <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg" className='ant-select-arrow'>
                                    <path d="M0.75 0.75L5.75 5.75L10.75 0.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            }
                            onChange={(value) => zoomTo(Number(value) / 100, { duration: 300 })}
                            optionRender={(option) => (
                                <div className={styles.zoomSelect__option}>
                                    {option.label}
                                </div>
                            )}
                        />
                    </ConfigProvider>
                    {/* --- SHARE BUTTON */}
                    {!isViewerMode && (
                        <SharePanel
                            sharePopoverOpen={sharePopoverOpen}
                            setSharePopoverOpen={setSharePopoverOpen}
                            projectId={projectId}
                        />
                    )}
                </div>
                {/* bottom control panel */}
                {isUserExists && <div className={styles.controlPanel}>
                    <Tooltip
                        title="Текст"
                        arrow={false}
                    >
                        <button
                            className={styles.controlPanel__button}
                            onClick={() => handleAddNode({ pinType: 'USER_CONTENT', contentType: 'TEXT' })}
                            disabled={isViewerMode}
                        >
                            {controlPanelIcons.text}
                        </button>
                    </Tooltip>
                    <Tooltip
                        title="Генерация изображения"
                        arrow={false}
                    >
                        <button
                            className={styles.controlPanel__button}
                            onClick={() => handleAddNode({ pinType: 'GENERATED_CONTENT', contentType: 'IMAGE' })}
                            disabled={isViewerMode}
                        >
                            {controlPanelIcons.gen_image}
                        </button>
                    </Tooltip>
                    <Tooltip
                        title="Генерация видео"
                        arrow={false}
                    >
                        <button
                            disabled={isViewerMode}
                            className={styles.controlPanel__button}
                            onClick={() => handleAddNode({ pinType: 'GENERATED_CONTENT', contentType: 'VIDEO' })}
                        >
                            {controlPanelIcons.gen_video}
                        </button>
                    </Tooltip>
                    <Tooltip
                        title="Заметка"
                        arrow={false}
                    >
                        <button
                            className={styles.controlPanel__button}
                            onClick={() => handleAddNode({ pinType: 'USER_CONTENT', contentType: 'TEXT' }, true)}
                            disabled={isViewerMode}
                        >
                            {controlPanelIcons.note}
                        </button>
                    </Tooltip>
                    <Tooltip
                        title="Загрузка фото"
                        arrow={false}
                    >
                        <button
                            className={styles.controlPanel__button}
                            onClick={() => handleAddNode({ pinType: 'USER_CONTENT', contentType: 'IMAGE' })}
                            disabled={isViewerMode}
                        >
                            {controlPanelIcons.user_image}
                        </button>
                    </Tooltip>
                    <Divider orientation="vertical" style={{ height: 24, alignSelf: 'center' }} />
                    <Tooltip
                        title="Назад"
                        arrow={false}
                    >
                        <button
                            className={styles.controlPanel__button}
                            disabled={!canUndo || isHistoryBusy || isViewerMode}
                            onClick={undo}
                        >
                            {controlPanelIcons.undo}
                        </button>
                    </Tooltip>
                    <Tooltip
                        title="Вперед"
                        arrow={false}
                    >
                        <button
                            className={styles.controlPanel__button}
                            disabled={!canRedo || isHistoryBusy || isViewerMode}
                            onClick={redo}
                        >
                            {controlPanelIcons.redo}
                        </button>
                    </Tooltip>
                </div>}
                <GalleryModal
                    galleryModalState={isGalleryModalOpen}
                    onClose={() => setIsGalleryModalOpen({ open: false, generationId: null, contentType: 'image' })}
                    generationType={isGalleryModalOpen.contentType}
                    generationSource='content_factory'
                    hasGoLiveButton={false}
                    hasDeleteButton={false}
                    hasEnhanceButton={false}
                    hasDownloadButton={true}
                    projectId={projectId}
                    histroyRequestLimit={100}
                />
            </>
        </ContentFactoryCanvasProvider >
    )
}

interface ISharePanelProps {
    sharePopoverOpen: boolean;
    setSharePopoverOpen: (open: boolean) => void;
    projectId?: string;
}


const SharePanel: React.FC<ISharePanelProps> = ({
    sharePopoverOpen,
    setSharePopoverOpen,
    projectId,
}) => {
    const { notification, message } = AntdApp.useApp()
    const { data: projectData, isLoading: isProjectDataLoading, isSuccess: isProjectDataSuccess, isFetching: isProjectDataFetching } = CONTENT_FACTORY_API.useGetContentFactoryProjectByIdQuery(projectId ?? skipToken)
    const [publishContentFactoryProject, { isLoading: isPublishContentFactoryProjectLoading, isError: isPublishContentFactoryProjectError, isSuccess: isPublishContentFactoryProjectSuccess, reset: resetPublishContentFactoryProject }] = CONTENT_FACTORY_API.usePublishContentFactoryProjectMutation();
    const [unPublishContentFactoryProject, { isLoading: isUnPublishContentFactoryProjectLoading, isError: isUnPublishContentFactoryProjectError, isSuccess: isUnPublishContentFactoryProjectSuccess, reset: resetUnPublishContentFactoryProject }] = CONTENT_FACTORY_API.useUnPublishContentFactoryProjectMutation();
    const shareUrl = `${window.location.origin}/canvas/${projectData?.publicId ?? ''}`
    const handlePublishContentFactoryProject = () => {
        if (projectId && !projectData?.isPublic) {
            publishContentFactoryProject(projectId)
        }
    }
    const handleUnPublishContentFactoryProject = () => {
        if (projectId && projectData?.isPublic) {
            unPublishContentFactoryProject(projectId)
        }
    }

    useEffect(function requestsStatusEffect() {
        if (isPublishContentFactoryProjectError) {
            notification.error({
                title: 'Ошибка',
                message: 'Не удалось опубликовать файл',
            })
            resetPublishContentFactoryProject()
        }
        if (isUnPublishContentFactoryProjectError) {
            notification.error({
                title: 'Ошибка',
                message: 'Не удалось снять файл с публикации',
            })
            resetUnPublishContentFactoryProject()
        }
        if (isUnPublishContentFactoryProjectSuccess) {
            setSharePopoverOpen(false)
            message.success('Файл снят с публикации')
            resetUnPublishContentFactoryProject()
        }
        if (isPublishContentFactoryProjectSuccess) {
            message.success('Файл опубликован')
            resetPublishContentFactoryProject()
        }
    }, [isPublishContentFactoryProjectError, isPublishContentFactoryProjectSuccess, isUnPublishContentFactoryProjectError, isUnPublishContentFactoryProjectSuccess])

    return (
        <Popover
            open={sharePopoverOpen}
            onOpenChange={setSharePopoverOpen}
            trigger="click"
            placement="bottomRight"
            arrow={false}
            content={(isPublishContentFactoryProjectLoading || isUnPublishContentFactoryProjectLoading || isProjectDataLoading || isProjectDataFetching) ? (
                <div className={styles.sharePopover} style={{ alignItems: 'center' }}>
                    <Spinner />
                </div>
            ) : (
                <div className={styles.sharePopover}>
                    {projectData && !projectData.isPublic && isProjectDataSuccess &&
                        <>
                            <span className={`text_secondary ${styles.sharePopover__label}`}>Поделиться ссылкой</span>
                            <span className={`text_tertiary ${styles.sharePopover__disclaimer}`}>Опубликуйте проект, чтобы получить ссылку на него. <br/>Внимание! Публичные проекты будут доступны всем, у кого будет ссылка</span>
                            <button
                                className={styles.sharePopover__copy}
                                style={{ width: 'min-content'}}
                                onClick={handlePublishContentFactoryProject}
                            >
                                Опубликовать
                            </button>
                            
                        </>
                    }
                    {projectData && projectData.isPublic && isProjectDataSuccess &&
                        <>
                            {/* <span className={`text_secondary ${styles.sharePopover__label}`}>Ссылка для просмотра</span> */}
                            <div className={styles.sharePopover__row}>
                                <input
                                    readOnly
                                    value={shareUrl}
                                    className={styles.sharePopover__input}
                                    onFocus={(e) => e.target.select()}
                                />
                                <button
                                    className={styles.sharePopover__copy}
                                    onClick={() => {
                                        navigator.clipboard.writeText(shareUrl)
                                        setSharePopoverOpen(false)
                                        message.success('Ссылка скопирована')
                                    }}
                                >
                                    Скопировать
                                </button>
                            </div>
                            <span className={`text_tertiary ${styles.sharePopover__label}`}>Этот файл доступен всем, у кого есть ссылка. <button className={styles.sharePopover__unpublishButton} onClick={handleUnPublishContentFactoryProject}>Снять с публикации</button></span>
                        </>
                    }
                </div>
            )}
        >
            <button className={styles.pinControlPanel__button}>
                Поделиться
            </button>
        </Popover>
    )
}

export const ContentFactoryProjectPage = () => (
    <ReactFlowProvider>
        <ContentFactoryProjectPageInner />
    </ReactFlowProvider>
)