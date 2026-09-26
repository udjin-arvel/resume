import React, { useState, useEffect, useMemo, useRef } from 'react'
import styles from './ContentFactoryPin.module.css'
import { Handle, Position, useReactFlow, useNodeConnections, useNodes } from '@xyflow/react'
import type { HandleProps, Node, NodeProps } from '@xyflow/react'
import type { TContentFactoryPin } from '@shared/models/models'
import { RadarAntdInput, RadarAntdButton, CONTENT_FACTORY_API, useDebounce, apiAssetUrl, getCustomHandleColors, Spinner, useContentFactoryCanvas } from '@shared'
import type { IAIModelListItem } from '@shared/models/models'
import { API, Uploader, RadarModelSelectSmall, loadImageDimensions } from '@shared'
import { GenerationLoadingBlock } from '@features'
import { Input, Tooltip, Upload } from 'antd'
import { /*Tooltip,*/ message, App as AntdApp, Select, ConfigProvider, Popover } from 'antd'
import { useParams } from 'react-router'

const ASPECT_RATIO_MAP = {
    "1:1": { height: '200px', width: '100%' },
    "3:2": { height: '200px', width: '100%' },
    "2:3": { height: '100%', width: '200px' },
    "3:4": { height: '100%', width: '200px' },
    "4:3": { height: '200px', width: '100%' },
    "4:5": { height: '100%', width: '200px' },
    "5:4": { height: '200px', width: '100%' },
    "9:16": { height: '100%', width: '200px' },
    "16:9": { height: '200px', width: '100%' },
    "21:9": { height: '200px', width: '100%' },
}

const dimensionToAspectRatioResolver = ({ width, height }: { width: number, height: number }): { aspectRatio: string, height: string, width: string } => {
    if (width === height) {
        return { aspectRatio: '1 / 1', height: '200px', width: '100%' };
    }
    if (width > height) {
        return { aspectRatio: `${width} / ${height}`, height: '200px', width: '100%' };
    } else {
        return { aspectRatio: `${width} / ${height}`, height: '100%', width: '200px' };
    }
}

export const ContentFactoryPin: React.FC<NodeProps<Node<TContentFactoryPin>>> = ({
    data,
    id,
    ...rest
}) => {
    const resultRef = useRef<HTMLDivElement>(null);
    const videoResultRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const { notification } = AntdApp.useApp()
    const { projectId } = useParams()
    const { deleteElements, getNode, /* addNodes, */ setNodes, setEdges } = useReactFlow();
    // const [createContentFactoryNode] = CONTENT_FACTORY_API.useCreateContentFactoryNodeMutation();
    const { data: models } = API.useGetModelsListQuery();
    const [contentFactoryUserImageUpload] = API.useContentFactoryUserImageUploadMutation();
    const [userImageAspectRatio, setUserImageAspectRatio] = useState<{ aspectRatio: string, height: string, width: string } | null>({ aspectRatio: '1 / 1', height: '200px', width: '100%' });
    const [userImageFile, setUserImageFile] = useState<File | null>(null);
    const [userImageFileUrl, setUserImageFileUrl] = useState<string | null>(null);
    const [loadingKeys, setLoadingKeys] = useState<Record<string, boolean>>({});
    const { pinType, contentType, prompt: promptData, user_image_thumbnail_path: userImageUrl, isNote, note, resultUrl, aspect_ratio, status, ai_model, handleOpenGalleryModal, generation, isViewerMode } = data;

    const { onGenerationStart } = useContentFactoryCanvas();
    const [modelType, setModelType] = useState<IAIModelListItem | null>(null);
    const [dimensions, setDimensions] = useState<string | null>(aspect_ratio ?? null);
    const isGenerationInProgress = useMemo(
        () => status === 'processing' || status === 'queued',
        [status],
    );
    const [prompt, setPrompt] = useState<string | null>(null);
    const [updateNodeData] = CONTENT_FACTORY_API.useUpdateContentFactoryNodeDataMutation();
    const [updateNodeAiModel] = CONTENT_FACTORY_API.useUpdateContentFactoryNodeAiModelMutation();
    const [duplicateContentFactoryNode] = CONTENT_FACTORY_API.useDuplicateContentFactoryNodeMutation();
    const [updateNodeAspectRatio] = CONTENT_FACTORY_API.useUpdateContentFactoryNodeAspectRatioMutation();
    const [updateNodePrompt] = CONTENT_FACTORY_API.useUpdateContentFactoryNodePromptMutation();
    const debouncedUpdateNodePrompt = useDebounce((prompt: string) => {
        updateNodePrompt({ nodeId: id, prompt })
    }, 500)
    const [generateContentFactoryNode, { isError: isGenerationError, error: generationErrorData, reset }] = CONTENT_FACTORY_API.useGenerateContentFactoryNodeMutation();
    const connections = useNodeConnections({ id, handleType: 'target' });
    const filteredConnections = useMemo(() => {
        return connections.filter(connection => connection.sourceHandle === 'IMAGE');
    }, [connections])
    const filteredTextConnections = useMemo(() => {
        return connections.filter(connection => connection.sourceHandle === 'TEXT');
    }, [connections])
    const nodes = useNodes();
    // --- note (contentEditable)
    const noteRef = useRef<HTMLDivElement>(null)
    // --- variables
    const connectedNodes = useMemo(() => {
        return [...nodes].filter(node => filteredConnections.some(connection => connection.source === node.id));
    }, [nodes, filteredConnections])
    const connectedTextNodes = useMemo(() => {
        return [...nodes].filter(node => filteredTextConnections.some(connection => connection.source === node.id));
    }, [nodes, filteredTextConnections])
    const pinTitle = useMemo(() => {
        let title = '';
        if (pinType === 'USER_CONTENT') {
            title = contentType === 'IMAGE' ? 'Загруженное изображение' : 'Промпт';
            if (isNote) {
                title = 'Заметка';
            }
            return title;
        }
        if (pinType === 'GENERATED_CONTENT') {
            title = contentType === 'IMAGE' ? 'Изображение' : 'Видео';
            return title;
        }
        return '';
    }, [contentType, isNote, pinType])
    const modelSelectOptions = useMemo(() => {
        if (contentType === 'IMAGE') {
            return models?.images?.filter(model => model.task_type !== 'improve_quality').map(model => ({ label: model.name, value: model.id, price: model.tokens_per_request, icon: model.icon_path }))
        }
        if (contentType === 'VIDEO') {
            // return models?.videos?.filter(model => model.task_type === 'video_preview').map(model => ({ label: model.name, value: model.id, price: model.tokens_per_request, icon: model.icon_path }))
            return models?.videos?.map(model => ({ label: model.name, value: model.id, price: model.tokens_per_request, icon: model.icon_path }))
        }
        return [];
    }, [models, contentType])
    const dimensionOptions = useMemo(() => {
        if (modelType?.aspect_ratio_options) {
            return modelType?.aspect_ratio_options.map(option => ({ label: option, value: option }))
        }
        return null;
    }, [modelType, contentType])
    const isImageHandleConnectable = useMemo(() => {
        const basicLimitForImageGeneration = 5;
        const basicLimitForVideoGeneration = 1;
        if (contentType === 'IMAGE') {
            const modelLimit = modelType?.max_input_images ?? basicLimitForImageGeneration;
            const generalLimit = Math.min(modelLimit, basicLimitForImageGeneration);
            return connectedNodes?.length < generalLimit;
        };
        if (contentType === 'VIDEO') {
            const modelLimit = modelType?.max_input_images ?? basicLimitForVideoGeneration;
            const generalLimit = Math.min(modelLimit, basicLimitForVideoGeneration);
            return connectedNodes?.length < generalLimit;
        }
    }, [contentType, connectedNodes, modelType])
    const isGenerateButtonDisabled = useMemo(() => {
        const hasImageNodesWithImages = connectedNodes.some(node => node?.data?.user_image_thumbnail_path || node?.data?.resultUrl);
        const hasTextNodesWithPrompt = connectedTextNodes.some(node => node?.data?.prompt);
        const hasPrompt = prompt || hasTextNodesWithPrompt;
        if (contentType === 'IMAGE' && modelType?.task_type?.toLowerCase() === 'text_image') {
            return !hasPrompt;
        } else {
            return !hasImageNodesWithImages || !hasPrompt;
        }
    }, [connectedNodes, connectedTextNodes, prompt, modelType])
    // --- handlers
    const imageUploadHandler = async (file: File) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const imgUploadResponse = await contentFactoryUserImageUpload({ formData, nodeId: id }).unwrap();
            const uploadedImageData = {
                user_image_path: imgUploadResponse?.path ?? null,
                user_image_thumbnail_path: imgUploadResponse?.path_thumbnail ?? null,
                user_image_thumbnail_url: imgUploadResponse?.url_thumbnail ?? null,
                user_image_url: imgUploadResponse?.url ?? null,
            };
            updateNodeData({
                nodeId: id, data: {
                    ...uploadedImageData,
                }
            });
            // Keep shared React Flow nodes state in sync immediately so connected generation nodes
            // can use the uploaded image as reference without waiting for refetch/socket updates.
            setNodes((prevNodes) => prevNodes.map((node) => (
                node.id === id
                    ? { ...node, data: { ...node.data, ...uploadedImageData } }
                    : node
            )));
            CONTENT_FACTORY_API.util.invalidateTags(['ContentFactoryEdges']);
            setUserImageFile(null);
        } catch (err) {
            console.error('imageUploadHanler err', err)
            notification.error({
                message: 'Не удалось загрузить изображение',
                description: 'Попробуйте позже'
            });
        }
    }
    const handlePromptChange = (value: string) => {
        setPrompt(value)
        // Keep shared React Flow nodes state in sync immediately so connected nodes
        // can react to prompt changes without waiting for refetch/socket updates.
        setNodes((prevNodes) => prevNodes.map((node) => (
            node.id === id
                ? { ...node, data: { ...node.data, prompt: value } }
                : node
        )))
        debouncedUpdateNodePrompt(value)
    }
    const generationStartHandler = async () => {
        onGenerationStart()
        setNodes((prev) => prev.map((node) =>
            node.id === id ? { ...node, data: { ...node.data, status: 'queued' } } : node
        ))
        setEdges((prev) => prev.map((edge) =>
            edge.target === id ? { ...edge, data: { ...edge.data, isDeletable: false } } : edge
        ))
        generateContentFactoryNode({ nodeId: id })
    }
    const duplicateHandler = async (nodeId: string) => {
        if (!projectId) return;
        const sourceNode = getNode(nodeId);
        if (!sourceNode) return;
        const OFFSET = 400;
        const positionX = (sourceNode.position?.x ?? 0) + OFFSET;
        const positionY = (sourceNode.position?.y ?? 0) + OFFSET;
        try {
            duplicateContentFactoryNode({
                nodeId,
                positionX,
                positionY,
            })
            // const newNodeId = res?.id;
            // const nodeData: Partial<TContentFactoryPin> = {};
            // if (prompt) nodeData.prompt = prompt;
            // if (isNote && note) nodeData.note = note;
            // if (Object.keys(nodeData).length > 0) {
            //     updateNodeData({ nodeId: newNodeId, data: nodeData });
            // }
            // addNodes([{
            //     id: newNodeId,
            //     type: 'contentFactoryPin',
            //     position: { x: positionX, y: positionY },
            //     zIndex: sourceNode.zIndex ?? 0,
            //     data: sourceNode.data,
            // }]);
        } catch (err) {
            console.error('handleDuplicate err', err);
            notification.error({
                message: 'Не удалось дублировать ноду',
                description: 'Попробуйте позже',
            });
        }
    };
    const handleMediaLoadStart = (key: string) => setLoadingKeys((prev) => ({ ...prev, [key]: true }));
    const handleMediaLoad = (key: string) => setLoadingKeys((prev) => ({ ...prev, [key]: false }));
    const generationStartErrorHandler = (errorData: string, reset: () => void) => {
        let description = 'Попробуйте позже';
        try {
            const jsonStart = errorData.indexOf('{');
            if (jsonStart !== -1) {
                const parsed = JSON.parse(errorData.slice(jsonStart));
                description =
                    parsed?.response?.errors?.[0]?.detail ??
                    parsed?.response?.errors?.[0]?.message ??
                    description;
            }
        } catch {
            const match = errorData.match(/"detail":"([^"]+)"/);
            if (match?.[1]) description = match[1];
        }
        notification.error({
            title: 'Не удалось запустить генерацию',
            description,
        });
        reset();
    };


    useEffect(function syncInternalPromotState() {
        setPrompt(promptData ?? '')
    }, [promptData])
    useEffect(function imageUploadEffect() {
        if (userImageFile) {
            imageUploadHandler(userImageFile);
        }
    }, [userImageFile])
    useEffect(function syncInternalUserFile() {
        setUserImageFileUrl(userImageUrl ?? null)
    }, [userImageUrl])
    useEffect(function syncNoteFromBackend() {
        if (noteRef.current) {
            const backendValue = note ?? ''
            if (noteRef.current.innerText !== backendValue) {
                noteRef.current.innerText = backendValue
            }
        }
    }, [note])
    useEffect(function generationErrorHandler() {
        if (isGenerationError) {
            setNodes((prev) => prev.map((node) =>
                node.id === id ? { ...node, data: { ...node.data, status: 'failed' } } : node
            ))
            generationStartErrorHandler((generationErrorData as Record<string, unknown>).error as string, reset)
        }
    }, [isGenerationError, generationErrorData, id, setNodes])
    useEffect(function syncInternalModelState() {
        if (ai_model) {
            const modelsList = contentType === 'IMAGE' ? models?.images : models?.videos;
            const model = modelsList?.find(model => model.id === ai_model) ?? null;
            setModelType(model);
        } else {

        }
    }, [ai_model, models, contentType])


    if (pinType === 'USER_CONTENT') {
        if (contentType === 'IMAGE') {
            return (
                <div className={styles.pin}>
                    <p className={styles.pin__title}>
                        {pinTitle}
                    </p>
                    {isViewerMode as boolean &&
                        <div className={styles.pin__lockedIcon}>
                            <svg width="11" height="13" viewBox="0 0 11 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5.6875 7.82335C5.77826 7.72052 5.83333 7.58544 5.83333 7.4375C5.83333 7.11533 5.57217 6.85417 5.25 6.85417C4.92783 6.85417 4.66667 7.11533 4.66667 7.4375C4.66667 7.58544 4.72174 7.72052 4.8125 7.82335V9.77083C4.8125 10.0125 5.00838 10.2083 5.25 10.2083C5.49162 10.2083 5.6875 10.0125 5.6875 9.77083V7.82335Z" fill="currentColor" />
                                <path fillRule="evenodd" clipRule="evenodd" d="M2.47917 3.9375V2.77083C2.47917 1.24054 3.71971 0 5.25 0C6.78029 0 8.02083 1.24054 8.02083 2.77083V3.9375H8.16667C9.45533 3.9375 10.5 4.98217 10.5 6.27083V9.77083C10.5 11.0595 9.45533 12.1042 8.16667 12.1042H2.33333C1.04467 12.1042 0 11.0595 0 9.77083V6.27083C0 4.98217 1.04467 3.9375 2.33333 3.9375H2.47917ZM3.35417 2.77083C3.35417 1.72379 4.20296 0.875 5.25 0.875C6.29704 0.875 7.14583 1.72379 7.14583 2.77083V3.9375H3.35417V2.77083ZM0.875 6.27083C0.875 5.46542 1.52792 4.8125 2.33333 4.8125H8.16667C8.97208 4.8125 9.625 5.46542 9.625 6.27083V9.77083C9.625 10.5762 8.97208 11.2292 8.16667 11.2292H2.33333C1.52792 11.2292 0.875 10.5762 0.875 9.77083V6.27083Z" fill="currentColor" />
                            </svg>
                        </div>
                    }
                    {userImageFileUrl &&
                        <div className={styles.pin__mediaWrapper} style={{ ...userImageAspectRatio }}>
                            {loadingKeys[userImageFileUrl] !== false && (
                                <div className={styles.pin__mediaSpinner}>
                                    <Spinner />
                                </div>
                            )}
                            <img
                                src={apiAssetUrl(userImageFileUrl)}
                                alt={`${id}`}
                                onLoadStart={() => { handleMediaLoadStart(userImageFileUrl) }}
                                onLoad={(e) => {
                                    if (!userImageFileUrl.startsWith('blob:')) {
                                        const aspectRatioParams = dimensionToAspectRatioResolver({ width: (e.target as HTMLImageElement).naturalWidth, height: (e.target as HTMLImageElement).naturalHeight });
                                        setUserImageAspectRatio(aspectRatioParams);
                                    }
                                    handleMediaLoad(userImageFileUrl)
                                }}
                            />
                        </div>
                    }
                    {!userImageFileUrl &&
                        <div className={styles.pin__mediaWrapper}>
                            <div className={styles.pin__mediaPlaceholder}>
                                <svg width="17" height="14" viewBox="0 0 17 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M4.58333 5C5.27369 5 5.83333 4.44036 5.83333 3.75C5.83333 3.05964 5.27369 2.5 4.58333 2.5C3.89298 2.5 3.33333 3.05964 3.33333 3.75C3.33333 4.44036 3.89298 5 4.58333 5Z" fill="currentColor" />
                                    <path fillRule="evenodd" clipRule="evenodd" d="M3.33333 0H13.3333C15.1743 0 16.6667 1.49238 16.6667 3.33333V10C16.6667 11.8409 15.1743 13.3333 13.3333 13.3333H3.33333C1.49238 13.3333 0 11.8409 0 10V3.33333C0 1.49238 1.49238 0 3.33333 0ZM13.3333 1.25H3.33333C2.18274 1.25 1.25 2.18274 1.25 3.33333V10C1.25 10.3215 1.32284 10.626 1.45292 10.898L3.27859 8.38765C4.11853 7.23274 5.86484 7.30996 6.59957 8.5345C6.91745 9.06429 7.70543 8.99734 7.92937 8.42151L8.84901 6.05672C9.43591 4.54754 11.5081 4.38777 12.3194 5.78914L15.2418 10.8369C15.3542 10.5807 15.4167 10.2977 15.4167 10V3.33333C15.4167 2.18274 14.4839 1.25 13.3333 1.25ZM3.33333 12.0833C2.96767 12.0833 2.62401 11.9891 2.3253 11.8237L4.28951 9.12287C4.60267 8.69227 5.25377 8.72106 5.52771 9.17762C6.38029 10.5986 8.49376 10.419 9.09437 8.87457L10.014 6.50978C10.2209 5.97767 10.9516 5.92133 11.2376 6.41544L14.362 11.8121C14.0585 11.9847 13.7074 12.0833 13.3333 12.0833H3.33333Z" fill="currentColor" />
                                </svg>
                                <span>Загруженное изображение <br />появится здесь</span>
                            </div>
                        </div>
                    }
                    {/* --------------------------------------------------------------dev info -------------------------------------------------------------- */}
                    {import.meta.env.DEV && <DevInfoComponent status={status} id={id} pinType={pinType} contentType={contentType} rest={rest} />}
                    {/* -------------------------------------------------------------------------------------------------------------------------------------- */}
                    <CustomHandle
                        type="source"
                        position={Position.Right}
                        id={contentType}
                        nodeId={id}
                        contentType={contentType}
                        style={{
                            background: 'none',
                            border: 'none',
                            width: '28px', // width & height same as customHandle inside
                            height: '28px',
                            top: 0,
                            left: `calc(100% + 4px)`,
                        }}
                    />
                    {!isViewerMode &&
                        <PinControlPanel
                            id={id}
                            pinType={pinType}
                            contentType={contentType}
                            isNote={isNote}
                            placement='bottom'
                            hasUploader
                            onDelete={(id) => deleteElements({ nodes: [{ id }] })}
                            hasDropdownMenu
                            hasDownLoadButton
                            downloadLink={apiAssetUrl(userImageFileUrl)}
                            uploadSettings={{
                                onUpload: async (file) => {
                                    setUserImageFile(file);
                                    const { width, height } = await loadImageDimensions(file);
                                    const aspectRatioParams = dimensionToAspectRatioResolver({ width, height });
                                    setUserImageAspectRatio(aspectRatioParams);
                                    const url = URL.createObjectURL(file);
                                    setUserImageFileUrl(url);
                                },
                                hasCurrentImage: !!userImageFileUrl,
                            }}
                        />
                    }
                </div>
            )
        }
        if (contentType === 'TEXT' && !isNote) {
            return (
                <div className={styles.pin}>
                    <p className={styles.pin__title}>
                        {pinTitle}
                    </p>
                    {isViewerMode as boolean &&
                        <div className={styles.pin__lockedIcon}>
                            <svg width="11" height="13" viewBox="0 0 11 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5.6875 7.82335C5.77826 7.72052 5.83333 7.58544 5.83333 7.4375C5.83333 7.11533 5.57217 6.85417 5.25 6.85417C4.92783 6.85417 4.66667 7.11533 4.66667 7.4375C4.66667 7.58544 4.72174 7.72052 4.8125 7.82335V9.77083C4.8125 10.0125 5.00838 10.2083 5.25 10.2083C5.49162 10.2083 5.6875 10.0125 5.6875 9.77083V7.82335Z" fill="currentColor" />
                                <path fillRule="evenodd" clipRule="evenodd" d="M2.47917 3.9375V2.77083C2.47917 1.24054 3.71971 0 5.25 0C6.78029 0 8.02083 1.24054 8.02083 2.77083V3.9375H8.16667C9.45533 3.9375 10.5 4.98217 10.5 6.27083V9.77083C10.5 11.0595 9.45533 12.1042 8.16667 12.1042H2.33333C1.04467 12.1042 0 11.0595 0 9.77083V6.27083C0 4.98217 1.04467 3.9375 2.33333 3.9375H2.47917ZM3.35417 2.77083C3.35417 1.72379 4.20296 0.875 5.25 0.875C6.29704 0.875 7.14583 1.72379 7.14583 2.77083V3.9375H3.35417V2.77083ZM0.875 6.27083C0.875 5.46542 1.52792 4.8125 2.33333 4.8125H8.16667C8.97208 4.8125 9.625 5.46542 9.625 6.27083V9.77083C9.625 10.5762 8.97208 11.2292 8.16667 11.2292H2.33333C1.52792 11.2292 0.875 10.5762 0.875 9.77083V6.27083Z" fill="currentColor" />
                            </svg>
                        </div>
                    }
                    <RadarAntdInput.Textarea
                        autoSize={{ minRows: 3, maxRows: 6 }}
                        name="prompt"
                        placeholder="Введите ваш промпт..."
                        id='promptTextArea'
                        allowClear={true}
                        disabled={isViewerMode as boolean}
                        value={prompt ?? ''}
                        style={{ fontSize: 12 }}
                        // className='nowheel nodrag nopan'
                        className='nowheel nodrag nopan'
                        onChange={(e) => {
                            handlePromptChange(e.target.value)
                        }}
                    />
                    {/* dev info */}
                    {/* --------------------------------------------------------------dev info -------------------------------------------------------------- */}
                    {import.meta.env.DEV && <DevInfoComponent status={status} id={id} pinType={pinType} contentType={contentType} rest={rest} />}
                    {/* -------------------------------------------------------------------------------------------------------------------------------------- */}
                    <CustomHandle
                        type="source"
                        position={Position.Right}
                        id={contentType}
                        nodeId={id}
                        contentType={contentType}
                        style={{
                            background: 'none',
                            border: 'none',
                            width: '28px', // width & height same as customHandle inside
                            height: '28px',
                            top: 0,
                            left: `calc(100% + 4px)`,
                        }}
                    />
                    {!isViewerMode &&
                        <PinControlPanel
                            id={id}
                            pinType={pinType}
                            contentType={contentType}
                            isNote={isNote}
                            placement='bottom'
                            onDelete={(id) => deleteElements({ nodes: [{ id }] })}
                            hasDeleteButton
                        />
                    }
                </div>
            )
        }
        if (contentType === 'TEXT' && isNote) {
            return (
                <div className={`${styles.pin} ${styles.pin__note}`}>
                    <p className={styles.pin__title}>
                        {pinTitle}
                    </p>
                    {isViewerMode as boolean &&
                        <div className={styles.pin__lockedIcon}>
                            <svg width="11" height="13" viewBox="0 0 11 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5.6875 7.82335C5.77826 7.72052 5.83333 7.58544 5.83333 7.4375C5.83333 7.11533 5.57217 6.85417 5.25 6.85417C4.92783 6.85417 4.66667 7.11533 4.66667 7.4375C4.66667 7.58544 4.72174 7.72052 4.8125 7.82335V9.77083C4.8125 10.0125 5.00838 10.2083 5.25 10.2083C5.49162 10.2083 5.6875 10.0125 5.6875 9.77083V7.82335Z" fill="currentColor" />
                                <path fillRule="evenodd" clipRule="evenodd" d="M2.47917 3.9375V2.77083C2.47917 1.24054 3.71971 0 5.25 0C6.78029 0 8.02083 1.24054 8.02083 2.77083V3.9375H8.16667C9.45533 3.9375 10.5 4.98217 10.5 6.27083V9.77083C10.5 11.0595 9.45533 12.1042 8.16667 12.1042H2.33333C1.04467 12.1042 0 11.0595 0 9.77083V6.27083C0 4.98217 1.04467 3.9375 2.33333 3.9375H2.47917ZM3.35417 2.77083C3.35417 1.72379 4.20296 0.875 5.25 0.875C6.29704 0.875 7.14583 1.72379 7.14583 2.77083V3.9375H3.35417V2.77083ZM0.875 6.27083C0.875 5.46542 1.52792 4.8125 2.33333 4.8125H8.16667C8.97208 4.8125 9.625 5.46542 9.625 6.27083V9.77083C9.625 10.5762 8.97208 11.2292 8.16667 11.2292H2.33333C1.52792 11.2292 0.875 10.5762 0.875 9.77083V6.27083Z" fill="currentColor" />
                            </svg>
                        </div>
                    }
                    <div className={styles.pin__noteWrapper}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: '10px 0 0 10px' }}>
                            <path d="M1.70257 0.972896C1.30837 0.972896 0.972896 1.30129 0.972896 1.72621V7.30152C0.972896 7.62873 1.1074 7.74199 1.16477 7.76789C1.20939 7.78802 1.35468 7.82063 1.56829 7.59925C1.74901 7.41196 1.95234 7.19872 2.18094 6.95599C2.60229 6.50858 3.16586 6.28488 3.72943 6.28488V7.25777C3.42396 7.25777 3.1185 7.37951 2.88919 7.623C2.65819 7.86828 2.45213 8.08439 2.2684 8.27481C1.84803 8.71046 1.27738 8.88611 0.764536 8.65464C0.264454 8.42893 0 7.89593 0 7.30152V1.72621C0 0.781727 0.753476 0 1.70257 0H5.7563C6.70539 0 7.45887 0.781727 7.45887 1.72621V2.43224H6.48597V1.72621C6.48597 1.30129 6.1505 0.972896 5.7563 0.972896H1.70257Z" fill="#F0AD00" />
                            <path fillRule="evenodd" clipRule="evenodd" d="M6.24275 3.24299C5.29366 3.24299 4.54018 4.02471 4.54018 4.9692V10.5445C4.54018 11.1389 4.80463 11.6719 5.30472 11.8976C5.81756 12.1291 6.38821 11.9534 6.80858 11.5178C6.99231 11.3274 7.19837 11.1113 7.42937 10.866C7.88798 10.379 8.65124 10.379 9.10986 10.866C9.34086 11.1113 9.54691 11.3274 9.73065 11.5178C10.151 11.9534 10.7217 12.1291 11.2345 11.8976C11.7346 11.6719 11.999 11.1389 11.999 10.5445V4.9692C11.999 4.02471 11.2456 3.24299 10.2965 3.24299H6.24275ZM5.51307 4.9692C5.51307 4.54428 5.84855 4.21588 6.24275 4.21588H10.2965C10.6907 4.21588 11.0261 4.54428 11.0261 4.9692V10.5445C11.0261 10.8717 10.8916 10.985 10.8343 11.0109C10.7897 11.031 10.6444 11.0636 10.4308 10.8422C10.25 10.6549 10.0467 10.4417 9.81811 10.199C8.9754 9.30416 7.56383 9.30416 6.72112 10.199C6.49252 10.4417 6.28919 10.6549 6.10847 10.8422C5.89486 11.0636 5.74956 11.031 5.70495 11.0109C5.64758 10.985 5.51307 10.8717 5.51307 10.5445V4.9692Z" fill="#F0AD00" />
                        </svg>
                        <ConfigProvider
                            theme={{
                                components: {
                                    Input: {
                                        activeBg: 'transparent',
                                        hoverBg: 'transparent',
                                        activeBorderColor: 'transparent',
                                        hoverBorderColor: 'transparent',
                                        colorBgBase: 'transparent',
                                        colorBorder: 'transparent',
                                        colorFill: 'transparent',
                                        colorTextPlaceholder: 'var(--color-text-muted)',
                                        colorText: 'var(--color-text-lt-primary)',
                                        activeShadow: 'none',
                                        errorActiveShadow: 'none',
                                    }
                                }
                            }}
                        >
                            <Input.TextArea
                                autoSize={{ minRows: 3, maxRows: 6 }}
                                name="prompt"
                                placeholder="Напишите заметку..."
                                id='noteTextArea'
                                disabled={isViewerMode as boolean}
                                value={prompt ?? ''}
                                style={{ fontSize: 12, background: 'transparent', outline: 'none', boxShadow: 'none', color: 'var(--color-text-lt-primary)' }}
                                className='nowheel nodrag nopan'
                                onChange={(e) => {
                                    handlePromptChange(e.target.value)
                                }}
                            />
                        </ConfigProvider>
                    </div>
                    {/* dev info */}
                    {/* --------------------------------------------------------------dev info -------------------------------------------------------------- */}
                    {import.meta.env.DEV && <DevInfoComponent status={status} id={id} pinType={pinType} contentType={contentType} rest={rest} />}
                    {/* -------------------------------------------------------------------------------------------------------------------------------------- */}
                    {!isViewerMode &&
                        <PinControlPanel
                            id={id}
                            pinType={pinType}
                            contentType={contentType}
                            isNote={isNote}
                            placement='right'
                            onDelete={(id) => deleteElements({ nodes: [{ id }] })}
                            hasDeleteButton
                        />
                    }
                </div>
            )
        }
    }

    if (pinType === 'GENERATED_CONTENT') {
        const mediaWrapperSizeParams = dimensions ? { ...ASPECT_RATIO_MAP?.[dimensions as keyof typeof ASPECT_RATIO_MAP], aspectRatio: dimensions.replace(':', '/') } : { height: '200px', width: '100%', aspectRatio: '1 / 1' };
        return (
            <div className={styles.pin}>
                <p className={styles.pin__title}>
                    {pinTitle}
                </p>
                {isViewerMode as boolean &&
                        <div className={styles.pin__lockedIcon}>
                            <svg width="11" height="13" viewBox="0 0 11 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5.6875 7.82335C5.77826 7.72052 5.83333 7.58544 5.83333 7.4375C5.83333 7.11533 5.57217 6.85417 5.25 6.85417C4.92783 6.85417 4.66667 7.11533 4.66667 7.4375C4.66667 7.58544 4.72174 7.72052 4.8125 7.82335V9.77083C4.8125 10.0125 5.00838 10.2083 5.25 10.2083C5.49162 10.2083 5.6875 10.0125 5.6875 9.77083V7.82335Z" fill="currentColor" />
                                <path fillRule="evenodd" clipRule="evenodd" d="M2.47917 3.9375V2.77083C2.47917 1.24054 3.71971 0 5.25 0C6.78029 0 8.02083 1.24054 8.02083 2.77083V3.9375H8.16667C9.45533 3.9375 10.5 4.98217 10.5 6.27083V9.77083C10.5 11.0595 9.45533 12.1042 8.16667 12.1042H2.33333C1.04467 12.1042 0 11.0595 0 9.77083V6.27083C0 4.98217 1.04467 3.9375 2.33333 3.9375H2.47917ZM3.35417 2.77083C3.35417 1.72379 4.20296 0.875 5.25 0.875C6.29704 0.875 7.14583 1.72379 7.14583 2.77083V3.9375H3.35417V2.77083ZM0.875 6.27083C0.875 5.46542 1.52792 4.8125 2.33333 4.8125H8.16667C8.97208 4.8125 9.625 5.46542 9.625 6.27083V9.77083C9.625 10.5762 8.97208 11.2292 8.16667 11.2292H2.33333C1.52792 11.2292 0.875 10.5762 0.875 9.77083V6.27083Z" fill="currentColor" />
                            </svg>
                        </div>
                    }
                {contentType === 'IMAGE' && resultUrl && !isGenerationInProgress && (
                    <div className={styles.pin__mediaWrapper} style={mediaWrapperSizeParams} ref={resultRef}>
                        {loadingKeys[resultUrl] !== false && (
                            <div className={styles.pin__mediaSpinner}>
                                <Spinner />
                            </div>
                        )}
                        <img
                            src={apiAssetUrl(resultUrl)}
                            alt={`generation result for pin_id: ${id}`}
                            onLoadStart={() => handleMediaLoadStart(resultUrl)}
                            onLoad={(e) => {
                                if (!dimensions && resultRef?.current) {
                                    const container = resultRef.current;
                                    const { width, height, aspectRatio } = dimensionToAspectRatioResolver({ width: (e.target as HTMLImageElement).naturalWidth, height: (e.target as HTMLImageElement).naturalHeight });
                                    container.style.height = height;
                                    container.style.width = width;
                                    container.style.aspectRatio = aspectRatio;
                                }
                                handleMediaLoad(resultUrl)
                            }}
                        />
                        {generation && (generation as any)?.id &&
                            <button
                                className={styles.pin__modalButton}
                                onClick={() => {
                                    const genId = parseInt((generation as any)?.id)
                                    // @ts-ignore
                                    handleOpenGalleryModal?.(genId, (contentType.toLowerCase() as 'image' | 'video'))
                                }}
                            >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1.75 8.33203C1.74979 8.26317 1.69391 8.20703 1.625 8.20703C1.55609 8.20703 1.50021 8.26317 1.5 8.33203V10.4541C1.50005 10.4707 1.50332 10.4862 1.50879 10.5C1.5147 10.5149 1.52352 10.5293 1.53613 10.542C1.5498 10.5557 1.56574 10.5654 1.58203 10.5713C1.59498 10.576 1.60963 10.5791 1.625 10.5791H3.74609C3.81501 10.5791 3.8709 10.523 3.87109 10.4541C3.87109 10.3851 3.81513 10.3291 3.74609 10.3291H2.53027C2.42935 10.3291 2.33862 10.2679 2.2998 10.1748C2.26114 10.0815 2.28217 9.97384 2.35352 9.90234L4.87793 7.37793C4.92654 7.32921 4.92641 7.24998 4.87793 7.20117C4.82915 7.15239 4.74999 7.15246 4.70117 7.20117L2.17676 9.72559C2.10526 9.7969 1.99761 9.81795 1.9043 9.7793C1.81104 9.74065 1.75019 9.64974 1.75 9.54883V8.33203ZM10.5781 1.6123C10.5754 1.5855 10.5633 1.55995 10.5449 1.54004L10.542 1.53613L10.5381 1.5332C10.5168 1.51359 10.4901 1.50213 10.4629 1.5H8.33203C8.263 1.50001 8.20703 1.55597 8.20703 1.625L8.2168 1.67383C8.2358 1.71862 8.28031 1.74999 8.33203 1.75H9.54785C9.64897 1.75 9.7406 1.81088 9.7793 1.9043C9.81796 1.9977 9.79609 2.10527 9.72461 2.17676L7.20117 4.70117C7.15236 4.74999 7.15235 4.82911 7.20117 4.87793C7.25001 4.92644 7.32922 4.92665 7.37793 4.87793L9.90137 2.35352C9.97286 2.28202 10.0804 2.26113 10.1738 2.2998C10.2672 2.33849 10.3281 2.42919 10.3281 2.53027V3.74609C10.3281 3.81505 10.3842 3.87096 10.4531 3.87109C10.5222 3.87109 10.5781 3.81513 10.5781 3.74609V1.6123ZM2.25 8.94531L4.34766 6.84766C4.59173 6.60369 4.9874 6.60363 5.23145 6.84766C5.47518 7.09172 5.47532 7.48746 5.23145 7.73145L3.13379 9.8291H3.74609C4.09127 9.8291 4.37109 10.1089 4.37109 10.4541C4.3709 10.7991 4.09115 11.0791 3.74609 11.0791H1.625C1.5508 11.0791 1.47879 11.0661 1.41211 11.042C1.32817 11.0117 1.2493 10.9622 1.18262 10.8955C1.1207 10.8335 1.07453 10.761 1.04395 10.6836C1.01569 10.6122 1.00005 10.5347 1 10.4541V8.33203C1.00021 7.98703 1.27995 7.70703 1.625 7.70703L1.75098 7.71973C2.03569 7.77796 2.24982 8.03015 2.25 8.33203V8.94531ZM11.0781 3.74609C11.0781 4.09127 10.7983 4.37109 10.4531 4.37109C10.1081 4.37096 9.82812 4.09119 9.82812 3.74609V3.13379L7.73145 5.23145C7.48747 5.47543 7.09176 5.47522 6.84766 5.23145C6.60358 4.98737 6.60358 4.59174 6.84766 4.34766L8.94434 2.25H8.33203C7.98686 2.24999 7.70703 1.97017 7.70703 1.625C7.70703 1.27983 7.98686 1.00001 8.33203 1H10.4531C10.4696 1 10.4867 1.00067 10.5029 1.00195L10.502 1.00293C10.637 1.0135 10.7703 1.06677 10.877 1.16504C10.883 1.17062 10.8894 1.17652 10.8955 1.18262L10.9131 1.20117L10.9756 1.28125C11.031 1.36547 11.0652 1.46251 11.0752 1.56348C11.0772 1.58385 11.0781 1.60437 11.0781 1.625V3.74609Z" fill="white" />
                                    <path d="M1.75 8.33203C1.74979 8.26317 1.69391 8.20703 1.625 8.20703C1.55609 8.20703 1.50021 8.26317 1.5 8.33203V10.4541C1.50005 10.4707 1.50332 10.4862 1.50879 10.5C1.5147 10.5149 1.52352 10.5293 1.53613 10.542C1.5498 10.5557 1.56574 10.5654 1.58203 10.5713C1.59498 10.576 1.60963 10.5791 1.625 10.5791H3.74609C3.81501 10.5791 3.8709 10.523 3.87109 10.4541C3.87109 10.3851 3.81513 10.3291 3.74609 10.3291H2.53027C2.42935 10.3291 2.33862 10.2679 2.2998 10.1748C2.26114 10.0815 2.28217 9.97384 2.35352 9.90234L4.87793 7.37793C4.92654 7.32921 4.92641 7.24998 4.87793 7.20117C4.82915 7.15239 4.74999 7.15246 4.70117 7.20117L2.17676 9.72559C2.10526 9.7969 1.99761 9.81795 1.9043 9.7793C1.81104 9.74065 1.75019 9.64974 1.75 9.54883V8.33203Z" fill="white" />
                                    <path d="M10.5781 1.6123C10.5754 1.5855 10.5633 1.55995 10.5449 1.54004L10.542 1.53613L10.5381 1.5332C10.5168 1.51359 10.4901 1.50213 10.4629 1.5H8.33203C8.263 1.50001 8.20703 1.55597 8.20703 1.625L8.2168 1.67383C8.2358 1.71862 8.28031 1.74999 8.33203 1.75H9.54785C9.64897 1.75 9.7406 1.81088 9.7793 1.9043C9.81796 1.9977 9.79609 2.10527 9.72461 2.17676L7.20117 4.70117C7.15236 4.74999 7.15235 4.82911 7.20117 4.87793C7.25001 4.92644 7.32922 4.92665 7.37793 4.87793L9.90137 2.35352C9.97286 2.28202 10.0804 2.26113 10.1738 2.2998C10.2672 2.33849 10.3281 2.42919 10.3281 2.53027V3.74609C10.3281 3.81505 10.3842 3.87096 10.4531 3.87109C10.5222 3.87109 10.5781 3.81513 10.5781 3.74609V1.6123Z" fill="white" />
                                </svg>
                            </button>}
                    </div>
                )}
                {contentType === 'IMAGE' && !resultUrl && !isGenerationInProgress && (
                    <div className={styles.pin__mediaWrapper} style={mediaWrapperSizeParams}>
                        <div className={styles.pin__mediaPlaceholder}>
                            <svg width="17" height="15" viewBox="0 0 17 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11.3431 0.354926C11.168 -0.118308 10.4987 -0.118309 10.3236 0.354926L10.0812 1.01001C10.0261 1.15879 9.90879 1.2761 9.76001 1.33115L9.10493 1.57355C8.63169 1.74867 8.63169 2.418 9.10493 2.59311L9.76001 2.83552C9.90879 2.89057 10.0261 3.00788 10.0812 3.15666L10.3236 3.81174C10.4987 4.28497 11.168 4.28498 11.3431 3.81174L11.5855 3.15666C11.6406 3.00788 11.7579 2.89057 11.9067 2.83552L12.5617 2.59311C13.035 2.418 13.035 1.74867 12.5617 1.57355L11.9067 1.33115C11.7579 1.2761 11.6406 1.15879 11.5855 1.01001L11.3431 0.354926Z" fill="currentColor" />
                                <path fillRule="evenodd" clipRule="evenodd" d="M6.875 1.66667C7.22018 1.66667 7.5 1.94649 7.5 2.29167C7.5 2.63684 7.22018 2.91667 6.875 2.91667H3.33333C2.18274 2.91667 1.25 3.84941 1.25 5V11.6667C1.25 11.9882 1.32284 12.2927 1.45291 12.5646L3.27859 10.0543C4.11853 8.89939 5.86484 8.97661 6.59957 10.2012C6.91745 10.7309 7.70543 10.664 7.92937 10.0882L8.84901 7.72338C9.43591 6.2142 11.5081 6.05443 12.3194 7.4558L15.2418 12.5035C15.3542 12.2474 15.4167 11.9643 15.4167 11.6667V8.125C15.4167 7.77982 15.6965 7.5 16.0417 7.5C16.3868 7.5 16.6667 7.77982 16.6667 8.125V11.6667C16.6667 13.5076 15.1743 15 13.3333 15H3.33333C1.49238 15 0 13.5076 0 11.6667V5C0 3.15905 1.49238 1.66667 3.33333 1.66667H6.875ZM14.362 13.4787L11.2376 8.08209C10.9516 7.58799 10.2209 7.64432 10.014 8.17644L9.09437 10.5412C8.49376 12.0857 6.38029 12.2652 5.52771 10.8443C5.25377 10.3877 4.60267 10.3589 4.28951 10.7895L2.32529 13.4903C2.624 13.6558 2.96767 13.75 3.33333 13.75H13.3333C13.7074 13.75 14.0585 13.6514 14.362 13.4787Z" fill="currentColor" />
                                <path d="M5.83333 5.41667C5.83333 6.10702 5.27369 6.66667 4.58333 6.66667C3.89298 6.66667 3.33333 6.10702 3.33333 5.41667C3.33333 4.72631 3.89298 4.16667 4.58333 4.16667C5.27369 4.16667 5.83333 4.72631 5.83333 5.41667Z" fill="currentColor" />
                                <path fillRule="evenodd" clipRule="evenodd" d="M13.5549 2.92591C13.7651 2.35803 14.5683 2.35803 14.7784 2.92591L15.0693 3.71201C15.1354 3.89055 15.2761 4.03132 15.4547 4.09738L16.2408 4.38826C16.8086 4.5984 16.8086 5.4016 16.2408 5.61174L15.4547 5.90262C15.2761 5.96868 15.1354 6.10945 15.0693 6.28799L14.7784 7.07409C14.5683 7.64197 13.7651 7.64197 13.5549 7.07409L13.264 6.28799C13.198 6.10945 13.0572 5.96868 12.8787 5.90262L12.0926 5.61174C11.5247 5.4016 11.5247 4.5984 12.0926 4.38826L12.8787 4.09738C13.0572 4.03132 13.198 3.89055 13.264 3.71201L13.5549 2.92591ZM13.8036 5C13.9404 4.89594 14.0626 4.77377 14.1667 4.63691C14.2707 4.77377 14.3929 4.89594 14.5298 5C14.3929 5.10406 14.2707 5.22623 14.1667 5.36309C14.0626 5.22623 13.9404 5.10406 13.8036 5Z" fill="currentColor" />
                            </svg>
                            <span>Ваша генерация <br />появится здесь</span>
                        </div>
                    </div>
                )}
                {contentType === 'VIDEO' && resultUrl && !isGenerationInProgress && (
                    <div className={styles.pin__mediaWrapper} style={mediaWrapperSizeParams} ref={videoResultRef}>
                        {loadingKeys[resultUrl] !== false && (
                            <div className={styles.pin__mediaSpinner}>
                                <Spinner />
                            </div>
                        )}
                        <video
                            ref={videoRef}
                            src={apiAssetUrl(resultUrl)}
                            loop
                            muted
                            playsInline
                            onLoadStart={() => handleMediaLoadStart(resultUrl)}
                            onLoadedMetadata={(e) => {
                                if (!dimensions && videoResultRef?.current) {
                                    const container = videoResultRef.current;
                                    const videoElement = e.currentTarget;
                                    const { width, height, aspectRatio } = dimensionToAspectRatioResolver({
                                        width: videoElement.videoWidth,
                                        height: videoElement.videoHeight,
                                    });
                                    container.style.height = height;
                                    container.style.width = width;
                                    container.style.aspectRatio = aspectRatio;
                                }
                            }}
                            onCanPlay={() => handleMediaLoad(resultUrl)}
                            onClick={() => {
                                if (!videoRef.current) return;
                                if (videoRef.current.paused) {
                                    videoRef.current.play();
                                    setIsVideoPlaying(true);
                                } else {
                                    videoRef.current.pause();
                                    setIsVideoPlaying(false);
                                }
                            }}
                        />
                        <button
                            className={`${styles.pin__videoPlayButton} ${isVideoPlaying ? styles.pin__videoPlayButton_hidden : ''}`}
                            onClick={() => {
                                if (!videoRef.current) return;
                                videoRef.current.play();
                                setIsVideoPlaying(true);
                            }}
                        >
                            <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 1.5L15 9L1 16.5V1.5Z" fill="white" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                            </svg>
                        </button>
                        {generation && (generation as any)?.id &&
                            <button
                                className={styles.pin__modalButton}
                                onClick={() => {
                                    const genId = parseInt((generation as any)?.id)
                                    // @ts-ignore
                                    handleOpenGalleryModal?.(genId, (contentType.toLowerCase() as 'image' | 'video'))
                                }}
                            >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1.75 8.33203C1.74979 8.26317 1.69391 8.20703 1.625 8.20703C1.55609 8.20703 1.50021 8.26317 1.5 8.33203V10.4541C1.50005 10.4707 1.50332 10.4862 1.50879 10.5C1.5147 10.5149 1.52352 10.5293 1.53613 10.542C1.5498 10.5557 1.56574 10.5654 1.58203 10.5713C1.59498 10.576 1.60963 10.5791 1.625 10.5791H3.74609C3.81501 10.5791 3.8709 10.523 3.87109 10.4541C3.87109 10.3851 3.81513 10.3291 3.74609 10.3291H2.53027C2.42935 10.3291 2.33862 10.2679 2.2998 10.1748C2.26114 10.0815 2.28217 9.97384 2.35352 9.90234L4.87793 7.37793C4.92654 7.32921 4.92641 7.24998 4.87793 7.20117C4.82915 7.15239 4.74999 7.15246 4.70117 7.20117L2.17676 9.72559C2.10526 9.7969 1.99761 9.81795 1.9043 9.7793C1.81104 9.74065 1.75019 9.64974 1.75 9.54883V8.33203ZM10.5781 1.6123C10.5754 1.5855 10.5633 1.55995 10.5449 1.54004L10.542 1.53613L10.5381 1.5332C10.5168 1.51359 10.4901 1.50213 10.4629 1.5H8.33203C8.263 1.50001 8.20703 1.55597 8.20703 1.625L8.2168 1.67383C8.2358 1.71862 8.28031 1.74999 8.33203 1.75H9.54785C9.64897 1.75 9.7406 1.81088 9.7793 1.9043C9.81796 1.9977 9.79609 2.10527 9.72461 2.17676L7.20117 4.70117C7.15236 4.74999 7.15235 4.82911 7.20117 4.87793C7.25001 4.92644 7.32922 4.92665 7.37793 4.87793L9.90137 2.35352C9.97286 2.28202 10.0804 2.26113 10.1738 2.2998C10.2672 2.33849 10.3281 2.42919 10.3281 2.53027V3.74609C10.3281 3.81505 10.3842 3.87096 10.4531 3.87109C10.5222 3.87109 10.5781 3.81513 10.5781 3.74609V1.6123ZM2.25 8.94531L4.34766 6.84766C4.59173 6.60369 4.9874 6.60363 5.23145 6.84766C5.47518 7.09172 5.47532 7.48746 5.23145 7.73145L3.13379 9.8291H3.74609C4.09127 9.8291 4.37109 10.1089 4.37109 10.4541C4.3709 10.7991 4.09115 11.0791 3.74609 11.0791H1.625C1.5508 11.0791 1.47879 11.0661 1.41211 11.042C1.32817 11.0117 1.2493 10.9622 1.18262 10.8955C1.1207 10.8335 1.07453 10.761 1.04395 10.6836C1.01569 10.6122 1.00005 10.5347 1 10.4541V8.33203C1.00021 7.98703 1.27995 7.70703 1.625 7.70703L1.75098 7.71973C2.03569 7.77796 2.24982 8.03015 2.25 8.33203V8.94531ZM11.0781 3.74609C11.0781 4.09127 10.7983 4.37109 10.4531 4.37109C10.1081 4.37096 9.82812 4.09119 9.82812 3.74609V3.13379L7.73145 5.23145C7.48747 5.47543 7.09176 5.47522 6.84766 5.23145C6.60358 4.98737 6.60358 4.59174 6.84766 4.34766L8.94434 2.25H8.33203C7.98686 2.24999 7.70703 1.97017 7.70703 1.625C7.70703 1.27983 7.98686 1.00001 8.33203 1H10.4531C10.4696 1 10.4867 1.00067 10.5029 1.00195L10.502 1.00293C10.637 1.0135 10.7703 1.06677 10.877 1.16504C10.883 1.17062 10.8894 1.17652 10.8955 1.18262L10.9131 1.20117L10.9756 1.28125C11.031 1.36547 11.0652 1.46251 11.0752 1.56348C11.0772 1.58385 11.0781 1.60437 11.0781 1.625V3.74609Z" fill="white" />
                                    <path d="M1.75 8.33203C1.74979 8.26317 1.69391 8.20703 1.625 8.20703C1.55609 8.20703 1.50021 8.26317 1.5 8.33203V10.4541C1.50005 10.4707 1.50332 10.4862 1.50879 10.5C1.5147 10.5149 1.52352 10.5293 1.53613 10.542C1.5498 10.5557 1.56574 10.5654 1.58203 10.5713C1.59498 10.576 1.60963 10.5791 1.625 10.5791H3.74609C3.81501 10.5791 3.8709 10.523 3.87109 10.4541C3.87109 10.3851 3.81513 10.3291 3.74609 10.3291H2.53027C2.42935 10.3291 2.33862 10.2679 2.2998 10.1748C2.26114 10.0815 2.28217 9.97384 2.35352 9.90234L4.87793 7.37793C4.92654 7.32921 4.92641 7.24998 4.87793 7.20117C4.82915 7.15239 4.74999 7.15246 4.70117 7.20117L2.17676 9.72559C2.10526 9.7969 1.99761 9.81795 1.9043 9.7793C1.81104 9.74065 1.75019 9.64974 1.75 9.54883V8.33203Z" fill="white" />
                                    <path d="M10.5781 1.6123C10.5754 1.5855 10.5633 1.55995 10.5449 1.54004L10.542 1.53613L10.5381 1.5332C10.5168 1.51359 10.4901 1.50213 10.4629 1.5H8.33203C8.263 1.50001 8.20703 1.55597 8.20703 1.625L8.2168 1.67383C8.2358 1.71862 8.28031 1.74999 8.33203 1.75H9.54785C9.64897 1.75 9.7406 1.81088 9.7793 1.9043C9.81796 1.9977 9.79609 2.10527 9.72461 2.17676L7.20117 4.70117C7.15236 4.74999 7.15235 4.82911 7.20117 4.87793C7.25001 4.92644 7.32922 4.92665 7.37793 4.87793L9.90137 2.35352C9.97286 2.28202 10.0804 2.26113 10.1738 2.2998C10.2672 2.33849 10.3281 2.42919 10.3281 2.53027V3.74609C10.3281 3.81505 10.3842 3.87096 10.4531 3.87109C10.5222 3.87109 10.5781 3.81513 10.5781 3.74609V1.6123Z" fill="white" />
                                </svg>
                            </button>}
                    </div>
                )}
                {contentType === 'VIDEO' && !resultUrl && !isGenerationInProgress && (
                    <div className={styles.pin__mediaWrapper} style={mediaWrapperSizeParams}>
                        <div className={styles.pin__mediaPlaceholder}>
                            <svg width="17" height="15" viewBox="0 0 17 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11.3431 0.354926C11.168 -0.118308 10.4987 -0.118309 10.3236 0.354926L10.0812 1.01001C10.0261 1.15879 9.90879 1.2761 9.76001 1.33115L9.10493 1.57355C8.63169 1.74867 8.63169 2.418 9.10493 2.59311L9.76001 2.83552C9.90879 2.89057 10.0261 3.00788 10.0812 3.15666L10.3236 3.81174C10.4987 4.28498 11.168 4.28498 11.3431 3.81174L11.5855 3.15666C11.6406 3.00788 11.7579 2.89057 11.9067 2.83552L12.5617 2.59311C13.035 2.418 13.035 1.74867 12.5617 1.57355L11.9067 1.33115C11.7579 1.2761 11.6406 1.15879 11.5855 1.01001L11.3431 0.354926Z" fill="currentColor" />
                                <path fillRule="evenodd" clipRule="evenodd" d="M13.5549 2.92591C13.7651 2.35803 14.5683 2.35803 14.7784 2.92591L15.0693 3.71201C15.1354 3.89055 15.2761 4.03132 15.4547 4.09738L16.2408 4.38826C16.8086 4.5984 16.8086 5.4016 16.2408 5.61174L15.4547 5.90262C15.2761 5.96868 15.1354 6.10945 15.0693 6.28799L14.7784 7.07409C14.5683 7.64197 13.7651 7.64197 13.5549 7.07409L13.264 6.28799C13.198 6.10945 13.0572 5.96868 12.8787 5.90262L12.0926 5.61174C11.5247 5.4016 11.5247 4.5984 12.0926 4.38826L12.8787 4.09738C13.0572 4.03132 13.198 3.89055 13.264 3.71201L13.5549 2.92591ZM13.8036 5C13.9404 4.89594 14.0626 4.77377 14.1667 4.63691C14.2707 4.77377 14.3929 4.89594 14.5298 5C14.3929 5.10406 14.2707 5.22623 14.1667 5.36309C14.0626 5.22623 13.9404 5.10406 13.8036 5Z" fill="currentColor" />
                                <path d="M7.5 2.29167C7.5 1.94649 7.22018 1.66667 6.875 1.66667H3.33333C1.49238 1.66667 0 3.15905 0 5V11.6667C0 13.5076 1.49238 15 3.33333 15H13.3333C15.1743 15 16.6667 13.5076 16.6667 11.6667V8.125C16.6667 7.77982 16.3868 7.5 16.0417 7.5C15.6965 7.5 15.4167 7.77982 15.4167 8.125V11.6667C15.4167 11.9643 15.3542 12.2474 15.2418 12.5035C15.1293 12.7596 14.6655 13.3061 14.362 13.4787C14.0585 13.6514 13.7074 13.75 13.3333 13.75H3.33333C2.96767 13.75 2.624 13.6558 2.32529 13.4903C2.02658 13.3249 1.58299 12.8365 1.45291 12.5646C1.32284 12.2927 1.25 11.9882 1.25 11.6667V5C1.25 3.84941 2.18274 2.91667 3.33333 2.91667H6.875C7.22018 2.91667 7.5 2.63684 7.5 2.29167Z" fill="currentColor" />
                                <path fillRule="evenodd" clipRule="evenodd" d="M5.41667 10.2391C5.41667 11.6432 7.02174 12.4806 8.22003 11.7018L11.2804 9.7127C12.351 9.01687 12.351 7.48313 11.2804 6.78729L8.22003 4.7982C7.02174 4.01936 5.41667 4.85684 5.41667 6.2609V10.2391ZM6.66667 10.2391V6.2609C6.66667 6.07298 6.76429 5.91463 6.94722 5.81918C7.1319 5.72282 7.34858 5.72262 7.53883 5.84628L10.5992 7.83537C10.9114 8.03828 10.9114 8.46171 10.5992 8.66463L7.53883 10.6537C7.34858 10.7774 7.1319 10.7772 6.94722 10.6808C6.76429 10.5854 6.66667 10.427 6.66667 10.2391Z" fill="currentColor" />
                            </svg>
                            <span>Ваша генерация <br />появится здесь</span>
                        </div>
                    </div>
                )}
                {isGenerationInProgress && (
                    <GenerationLoadingBlock
                        title='Генерация'
                        style={{ ...mediaWrapperSizeParams, maxWidth: '100%', border: 'none', borderRadius: 8 }}
                    />
                )}
                {connectedNodes && connectedNodes.length > 0 &&
                    <div className={`${styles.pin__references} nodrag nopan nowheel`}>
                        {connectedNodes.map((node, idx) => {
                            const source = node?.data?.user_image_thumbnail_path ?? node?.data?.resultUrl ?? null
                            return source && (
                                <div className={styles.pin__referenceWrapper} key={idx}>
                                    <img src={apiAssetUrl(source?.toString())} alt={`reference ${idx + 1}`} width={32} height={32} loading='lazy' decoding='async' />
                                </div>
                            )
                        })}
                    </div>
                }
                <span></span>
                <RadarAntdInput.Textarea
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    name="prompt"
                    placeholder="Введите ваш промпт..."
                    id='promptTextArea'
                    allowClear={true}
                    disabled={isGenerationInProgress}
                    className='nowheel nodrag nopan'
                    value={prompt ?? ''}
                    style={{ fontSize: 12 }}
                    onChange={(e) => {
                        !isViewerMode && handlePromptChange(e.target.value)
                    }}
                />
                {!isViewerMode &&
                    <RadarAntdButton
                        style={{ width: '100%', fontWeight: 600, height: 36, fontSize: 12 }}
                        onClick={() => generationStartHandler()}
                        shineAnimation={!isGenerateButtonDisabled && !isGenerationInProgress}
                        loading={isGenerationInProgress}
                        disabled={isGenerateButtonDisabled}
                    >
                        Сгенерировать
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M4.48939 5.67406C4.32128 5.21976 3.67872 5.21976 3.51061 5.67406L3.27791 6.30294C3.22505 6.44577 3.11244 6.55839 2.96961 6.61124L2.34073 6.84394C1.88642 7.01205 1.88642 7.65461 2.34073 7.82272L2.96961 8.05543C3.11244 8.10828 3.22505 8.2209 3.27791 8.36373L3.51061 8.9926C3.67872 9.44691 4.32128 9.44691 4.48939 8.99261L4.7221 8.36373C4.77495 8.2209 4.88756 8.10828 5.03039 8.05543L5.65927 7.82272C6.11358 7.65461 6.11358 7.01205 5.65927 6.84394L5.03039 6.61124C4.88756 6.55839 4.77495 6.44577 4.7221 6.30294L4.48939 5.67406ZM4 7.04286C3.91675 7.15235 3.81902 7.25009 3.70953 7.33333C3.81902 7.41658 3.91675 7.51431 4 7.62381C4.08325 7.51431 4.18098 7.41658 4.29047 7.33333C4.18098 7.25009 4.08325 7.15235 4 7.04286Z" fill="currentColor" />
                            <path fillRule="evenodd" clipRule="evenodd" d="M7.94471 7.99991C7.95386 7.99997 7.96302 8 7.97219 8C10.1967 8 12 6.20914 12 4C12 1.79086 10.1967 0 7.97219 0C5.97641 0 4.31966 1.44152 4.00006 3.33333C4.00004 3.33333 4.00008 3.33333 4.00006 3.33333C1.79092 3.33333 0 5.12419 0 7.33333C0 9.54247 1.79086 11.3333 4 11.3333C5.98203 11.3333 7.62736 9.89176 7.94471 7.99991ZM7.98631 6.99997C9.64819 6.99242 10.993 5.65218 10.993 4C10.993 2.34315 9.64056 1 7.97219 1C6.48966 1 5.25656 2.06058 5.00024 3.45941C6.62143 3.87679 7.84481 5.28499 7.98631 6.99997ZM4 10.3333C5.65685 10.3333 7 8.99019 7 7.33333C7 5.67648 5.65685 4.33333 4 4.33333C2.34315 4.33333 1 5.67648 1 7.33333C1 8.99019 2.34315 10.3333 4 10.3333Z" fill="currentColor" />
                        </svg>
                        {modelType?.tokens_per_request}
                    </RadarAntdButton>
                }
                {/* dev info */}
                {/* --------------------------------------------------------------dev info -------------------------------------------------------------- */}
                {import.meta.env.DEV && <DevInfoComponent status={status} id={id} pinType={pinType} contentType={contentType} rest={rest} />}
                {/* -------------------------------------------------------------------------------------------------------------------------------------- */}
                <CustomHandle
                    type="target"
                    position={Position.Left}
                    id={'IMAGE'}
                    nodeId={id}
                    contentType={'IMAGE'}
                    isConnectable={isImageHandleConnectable && !isGenerationInProgress}
                    blockMessage={isGenerationInProgress ? 'Генерация в процессе' : !isImageHandleConnectable ? 'Достигнуто максимальное значение референсов' : undefined}
                    style={{
                        background: 'none',
                        border: 'none',
                        width: '28px', // width & height same as customHandle inside
                        height: '28px',
                        top: 'calc(50% - 28px)',
                        left: '-32px',
                    }}
                />
                <CustomHandle
                    type="target"
                    position={Position.Left}
                    id={'TEXT'}
                    nodeId={id}
                    contentType={'TEXT'}
                    isConnectable={!isGenerationInProgress}
                    blockMessage={isGenerationInProgress ? 'Генерация в процессе' : undefined}
                    style={{
                        background: 'none',
                        border: 'none',
                        width: '28px', // width & height same as customHandle inside
                        height: '28px',
                        top: 'calc(50% + 4px)',
                        left: '-32px',
                    }}
                />
                {contentType !== 'VIDEO' && <CustomHandle
                    type="source"
                    position={Position.Right}
                    id={contentType}
                    nodeId={id}
                    isConnectable={!isGenerationInProgress}
                    blockMessage={isGenerationInProgress ? 'Генерация в процессе' : undefined}
                    contentType={contentType}
                    style={{
                        background: 'none',
                        border: 'none',
                        width: '28px', // width & height same as customHandle inside
                        height: '28px',
                        top: 0,
                        left: `calc(100% + 4px)`,
                    }}
                />}
                {!isViewerMode &&
                    <PinControlPanel
                        id={id}
                        pinType={pinType}
                        contentType={contentType}
                        isNote={isNote}
                        placement='bottom'
                        onDelete={(id) => deleteElements({ nodes: [{ id }] })}
                        hasModelSelect
                        hasDimensionsSelect={dimensionOptions != null}
                        generalDisabledState={isGenerationInProgress}
                        dimensionOptions={{
                            value: dimensions,
                            options: dimensionOptions,
                            onChange: (value) => { setDimensions(value); updateNodeAspectRatio({ nodeId: id, aspectRatio: value }) }
                        }}
                        aiModelSettings={{
                            value: modelType?.id,
                            onChange: (value) => {
                                const modelKey = contentType === 'IMAGE' ? 'images' : 'videos';
                                const newModelType = models?.[modelKey]?.find(model => model.id === value) ?? null;
                                const modelDimensions = newModelType?.aspect_ratio_options;
                                let newCurrentDimensions = dimensions
                                if (!modelDimensions) {
                                    newCurrentDimensions = null
                                } else {
                                    if (!newCurrentDimensions || !modelDimensions?.includes(newCurrentDimensions)) {
                                        newCurrentDimensions = modelDimensions[0];
                                    }
                                }
                                setModelType(newModelType);
                                setDimensions(newCurrentDimensions);
                                updateNodeAiModel({ nodeId: id, aiModel: value });
                                updateNodeAspectRatio({ nodeId: id, aspectRatio: newCurrentDimensions ?? '' });
                            },
                            options: modelSelectOptions
                        }}
                        hasDownLoadButton
                        downloadLink={apiAssetUrl(resultUrl)}
                        hasDropdownMenu
                        hasDuplicateButton
                        onDuplicate={duplicateHandler}
                    />
                }
            </div>
        )

    }
}


interface IPinControlPanelProps {
    id: string;
    pinType: TContentFactoryPin['pinType'];
    contentType: TContentFactoryPin['contentType'];
    isNote?: boolean;
    placement?: 'bottom' | 'right';
    onDelete?: (id: string) => void;
    onDuplicate?: (id: string) => void;
    uploadSettings?: {
        onUpload: (file: File) => void;
        hasCurrentImage?: boolean;
    }
    aiModelSettings?: {
        value?: string | null;
        onChange?: (value: string) => void;
        options?: { label: string, value: string, image?: string, price?: number | null, icon: string | null }[] | undefined;
    }
    hasDeleteButton?: boolean;
    hasDropdownMenu?: boolean;
    hasUploader?: boolean;
    hasModelSelect?: boolean;
    hasDownLoadButton?: boolean;
    downloadLink?: string | null;
    hasDimensionsSelect?: boolean;
    dimensionOptions?: {
        value: string | null;
        options?: { label: string, value: string }[] | null;
        onChange?: (value: string) => void;
    }
    hasDuplicateButton?: boolean;
    generalDisabledState?: boolean;
}

const PinControlPanel: React.FC<IPinControlPanelProps> = ({
    id,
    placement = 'bottom',
    hasDeleteButton = true,
    hasDropdownMenu = false,
    hasUploader = false,
    hasModelSelect = false,
    hasDownLoadButton = false,
    downloadLink,
    hasDimensionsSelect = false,
    onDelete,
    onDuplicate,
    uploadSettings,
    aiModelSettings,
    dimensionOptions,
    hasDuplicateButton = false,
    generalDisabledState = false,
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)

    const closeDropdown = () => {
        setIsDropdownOpen(false)
    }

    return (
        <div className={`${styles.pinControlPanel} ${placement === 'bottom' ? styles.pinControlPanel__bottom : styles.pinControlPanel__right} nodrag`}>
            {hasModelSelect &&
                <RadarModelSelectSmall
                    disabled={generalDisabledState}
                    options={aiModelSettings?.options}
                    value={aiModelSettings?.value}
                    onChange={aiModelSettings?.onChange}
                />
            }
            {hasUploader &&
                <Uploader
                    radarSize="small"
                    accept={'.jpg,.jpeg,.JPEG,.JPG,.png'}
                    fileList={[]}
                    limit={1}
                    filesCount={0}
                    beforeUpload={async (file) => {
                        try {
                            uploadSettings?.onUpload?.(file);
                            return false;
                        } catch (err) {
                            message.error(err instanceof Error ? err.message : 'Ошибка валидации файла');
                            return Upload.LIST_IGNORE;
                        }
                    }}
                    customRequest={({ onSuccess }) => onSuccess?.('ok')}
                >
                    <button className={`${styles.pinControlPanel__button}`} style={{ padding: '0 8px' }}>
                        {uploadSettings?.hasCurrentImage ? 'Заменить' : 'Загрузить'}
                    </button>
                </Uploader>
            }
            {hasDimensionsSelect &&
                <ConfigProvider
                    theme={{
                        components: {
                            Select: {
                                controlHeight: 24,
                                colorBorder: 'transparent',
                                activeBorderColor: 'transparent',
                                hoverBorderColor: 'transparent',
                                activeOutlineColor: 'transparent',
                                optionFontSize: 12,
                                optionPadding: 0,
                                // optionHeight: 40,
                                optionActiveBg: 'transparent',
                                optionSelectedBg: 'transparent',
                            }
                        }
                    }}
                >
                    <Select
                        options={dimensionOptions?.options ?? []}
                        value={dimensionOptions?.value ?? null}
                        placeholder='Выберите модель'
                        style={{ maxWidth: 100, padding: '0 8px' }}
                        className={styles.dimensionsSelect}
                        popupMatchSelectWidth={false}
                        getPopupContainer={(triggerNode) => triggerNode.parentElement as HTMLElement}
                        disabled={generalDisabledState}
                        suffixIcon={
                            <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg" className='ant-select-arrow'>
                                <path d="M0.75 0.75L5.75 5.75L10.75 0.75" stroke="#8C8C8C" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        }
                        onChange={dimensionOptions?.onChange}
                        optionRender={(option) => {
                            return (
                                <div className={styles.dimensionsSelect__option}>
                                    {option.label}
                                </div>
                            )
                        }}
                    />
                </ConfigProvider>
            }
            {hasDownLoadButton && downloadLink && !hasDropdownMenu &&
                <button
                    className={`${styles.pinControlPanel__button}`}
                    disabled={!downloadLink || generalDisabledState}
                    onClick={() => {
                        if (!downloadLink) return;
                        const a = document.createElement('a');
                        a.href = downloadLink;
                        a.download = downloadLink.split('/').pop() ?? 'download';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    }}
                >
                    <svg width="13" height="12" viewBox="0 0 13 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.67083 5.44246C2.34858 4.2462 2.57446 3.26577 3.07184 2.5367C3.57655 1.79687 4.38179 1.28635 5.25687 1.08948C6.13134 0.892735 7.04105 1.01616 7.76228 1.49526C8.47343 1.96767 9.05889 2.82424 9.22374 4.21128C9.25363 4.46283 9.46692 4.65227 9.72024 4.65227C11.1433 4.65227 11.9274 5.63569 11.9952 6.70967C12.0626 7.77454 11.4168 8.94819 9.80611 9.2678C9.53524 9.32155 9.35924 9.5847 9.41298 9.85556C9.46673 10.1264 9.72988 10.3024 10.0007 10.2487C12.1144 9.82928 13.0914 8.19994 12.9933 6.64658C12.9029 5.21724 11.894 3.86858 10.154 3.6758C9.89552 2.26609 9.2212 1.26387 8.31561 0.6623C7.33313 0.00964773 6.13561 -0.133222 5.03737 0.113862C3.93973 0.360811 2.90675 1.00424 2.24576 1.97314C1.64275 2.85706 1.36622 3.98801 1.60815 5.27797C1.05193 5.55218 0.633332 5.9195 0.360884 6.3516C0.0243949 6.88528 -0.0689364 7.48729 0.0482309 8.05732C0.282033 9.19479 1.32435 10.1335 2.77464 10.3049C3.04888 10.3373 3.29746 10.1412 3.32986 9.86698C3.36227 9.59274 3.16622 9.34416 2.89199 9.31176C1.80276 9.18305 1.16195 8.50888 1.02775 7.85599C0.960919 7.53084 1.01237 7.19329 1.20678 6.88495C1.40252 6.57451 1.7632 6.26356 2.36204 6.04126C2.60418 5.95137 2.73801 5.69185 2.67083 5.44246Z" fill="currentColor" />
                        <path d="M4.8131 10.0231L6.14643 11.3565C6.34169 11.5517 6.65827 11.5517 6.85354 11.3565L8.18687 10.0231C8.38213 9.82787 8.38213 9.51129 8.18687 9.31603C7.99161 9.12077 7.67502 9.12077 7.47976 9.31603L6.99998 9.79581V7.66958C6.99998 7.39344 6.77612 7.16958 6.49998 7.16958C6.22384 7.16958 5.99998 7.39344 5.99998 7.66958V9.79581L5.5202 9.31603C5.32494 9.12077 5.00836 9.12077 4.8131 9.31603C4.61783 9.51129 4.61783 9.82787 4.8131 10.0231Z" fill="currentColor" />
                    </svg>
                </button>
            }
            {hasDeleteButton && !hasDropdownMenu &&
                <button className={`${styles.pinControlPanel__button}`} disabled={generalDisabledState} onClick={() => onDelete?.(id)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="13" fill="none">
                        <path fill="currentColor" fillRule="evenodd" d="M2.4346 2.1376a.5.5 0 0 0-.1252.0334 92 92 0 0 0-1.7146.1504l-.1078.0107-.0373.0038H.449a.5.5 0 1 0 .1021.9948L.5506 3.326l.0005.0048.036-.0036.1054-.0105a91 91 0 0 1 1.7304-.1515C3.4929 3.0822 4.8103 3 5.8334 3s2.3404.082 3.4105.1652a91 91 0 0 1 1.7304.1514l.1054.0105.0355.0036a.5.5 0 1 0 .1026-.9947l-.0381-.0039-.1077-.0107a92 92 0 0 0-1.7147-.1504.5.5 0 0 0-.1092-.031.959.959 0 0 1-.7327-.5867l-.0603-.1492A2.245 2.245 0 0 0 6.3734 0h-.8981a2.2155 2.2155 0 0 0-2.0541 1.3855 1.216 1.216 0 0 1-.9679.7497zM5.4753 1c-.4955 0-.9413.3007-1.127.7601a2.2 2.2 0 0 1-.1406.2868C4.7739 2.0186 5.335 2 5.8334 2c.5531 0 1.1834.0229 1.8123.0566a2 2 0 0 1-.0575-.1287l-.0603-.1492A1.245 1.245 0 0 0 6.3734 1z" clipRule="evenodd" />
                        <path fill="currentColor" d="M10.3315 4.5433a.5.5 0 0 0-.9962-.0866l-.5368 6.1732C8.731 11.4051 8.082 12 7.304 12H4.096c-.803 0-1.4637-.6325-1.4985-1.4348l-.2647-6.087a.5.5 0 1 0-.999.0435l.2646 6.0869C1.6566 11.9458 2.7576 13 4.096 13h3.208c1.2967 0 2.3782-.9915 2.4906-2.2834z" />
                        <path fill="currentColor" d="M3.8334 10a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1z" />
                    </svg>
                </button>
            }
            {hasDropdownMenu &&
                <Popover
                    trigger="click"
                    open={isDropdownOpen}
                    onOpenChange={setIsDropdownOpen}
                    placement="bottomLeft"
                    arrow={false}
                    styles={{
                        container: {
                            padding: 4,
                        }
                    }}
                    getPopupContainer={(triggerNode) => triggerNode.parentElement as HTMLElement}
                    content={
                        <div className={styles.pinDropdownMenu}>
                            {hasDuplicateButton &&
                                <button
                                    className={`${styles.pinDropdownMenu__item}`}
                                    disabled={generalDisabledState}
                                    onClick={() => {
                                        closeDropdown()
                                        onDuplicate?.(id)
                                    }}
                                >
                                    <span className={styles.pinDropdownMenu__itemIcon}>
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M0 2.5C0 1.11929 1.11929 0 2.5 0H4.34203C5.07185 0 5.76522 0.318907 6.24018 0.873022L7.0633 1.83333H5.74622L5.48092 1.52381C5.19595 1.19134 4.77992 1 4.34203 1H2.5C1.67157 1 1 1.67157 1 2.5V6.5C1 7.32843 1.67157 8 2.5 8H3.16667V9H2.5C1.11929 9 0 7.88071 0 6.5V2.5Z" fill="currentColor" />
                                            <path fillRule="evenodd" clipRule="evenodd" d="M6.5 2.66667C5.11929 2.66667 4 3.78595 4 5.16667V9.16667C4 10.5474 5.11929 11.6667 6.5 11.6667H9.16667C10.5474 11.6667 11.6667 10.5474 11.6667 9.16667V6.12874C11.6667 5.53196 11.4532 4.95487 11.0648 4.50176L10.2402 3.53969C9.76522 2.98557 9.07185 2.66667 8.34204 2.66667H6.5ZM5 5.16667C5 4.33824 5.67157 3.66667 6.5 3.66667H8.34204C8.77992 3.66667 9.19595 3.85801 9.48092 4.19048L10.3056 5.15255C10.5386 5.42441 10.6667 5.77067 10.6667 6.12874V9.16667C10.6667 9.99509 9.99509 10.6667 9.16667 10.6667H6.5C5.67157 10.6667 5 9.99509 5 9.16667V5.16667Z" fill="currentColor" />
                                        </svg>
                                    </span>
                                    Дублировать
                                </button>
                            }
                            {hasDownLoadButton &&
                                <button
                                    className={`${styles.pinDropdownMenu__item}`}
                                    disabled={!downloadLink || generalDisabledState}
                                    onClick={() => {
                                        closeDropdown()
                                        if (!downloadLink) return;
                                        const a = document.createElement('a');
                                        a.href = downloadLink;
                                        a.download = downloadLink.split('/').pop() ?? 'download';
                                        a.target = '_blank';
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                    }}
                                >
                                    <span className={styles.pinDropdownMenu__itemIcon}>
                                        <svg width="13" height="12" viewBox="0 0 13 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M2.67083 5.44246C2.34858 4.2462 2.57446 3.26577 3.07184 2.5367C3.57655 1.79687 4.38179 1.28635 5.25687 1.08948C6.13134 0.892735 7.04105 1.01616 7.76228 1.49526C8.47343 1.96767 9.05889 2.82424 9.22374 4.21128C9.25363 4.46283 9.46692 4.65227 9.72024 4.65227C11.1433 4.65227 11.9274 5.63569 11.9952 6.70967C12.0626 7.77454 11.4168 8.94819 9.80611 9.2678C9.53524 9.32155 9.35924 9.5847 9.41298 9.85556C9.46673 10.1264 9.72988 10.3024 10.0007 10.2487C12.1144 9.82928 13.0914 8.19994 12.9933 6.64658C12.9029 5.21724 11.894 3.86858 10.154 3.6758C9.89552 2.26609 9.2212 1.26387 8.31561 0.6623C7.33313 0.00964773 6.13561 -0.133222 5.03737 0.113862C3.93973 0.360811 2.90675 1.00424 2.24576 1.97314C1.64275 2.85706 1.36622 3.98801 1.60815 5.27797C1.05193 5.55218 0.633332 5.9195 0.360884 6.3516C0.0243949 6.88528 -0.0689364 7.48729 0.0482309 8.05732C0.282033 9.19479 1.32435 10.1335 2.77464 10.3049C3.04888 10.3373 3.29746 10.1412 3.32986 9.86698C3.36227 9.59274 3.16622 9.34416 2.89199 9.31176C1.80276 9.18305 1.16195 8.50888 1.02775 7.85599C0.960919 7.53084 1.01237 7.19329 1.20678 6.88495C1.40252 6.57451 1.7632 6.26356 2.36204 6.04126C2.60418 5.95137 2.73801 5.69185 2.67083 5.44246Z" fill="currentColor" />
                                            <path d="M4.8131 10.0231L6.14643 11.3565C6.34169 11.5517 6.65827 11.5517 6.85354 11.3565L8.18687 10.0231C8.38213 9.82787 8.38213 9.51129 8.18687 9.31603C7.99161 9.12077 7.67502 9.12077 7.47976 9.31603L6.99998 9.79581V7.66958C6.99998 7.39344 6.77612 7.16958 6.49998 7.16958C6.22384 7.16958 5.99998 7.39344 5.99998 7.66958V9.79581L5.5202 9.31603C5.32494 9.12077 5.00836 9.12077 4.8131 9.31603C4.61783 9.51129 4.61783 9.82787 4.8131 10.0231Z" fill="currentColor" />
                                        </svg>
                                    </span>
                                    Скачать
                                </button>
                            }
                            {hasDeleteButton &&
                                <button
                                    className={`${styles.pinDropdownMenu__item} ${styles['pinDropdownMenu__item--danger']}`}
                                    disabled={generalDisabledState}
                                    onClick={() => {
                                        closeDropdown()
                                        onDelete?.(id)
                                    }}
                                >
                                    <span className={styles.pinDropdownMenu__itemIcon}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="13" fill="none">
                                            <path fill="currentColor" fillRule="evenodd" d="M2.4346 2.1376a.5.5 0 0 0-.1252.0334 92 92 0 0 0-1.7146.1504l-.1078.0107-.0373.0038H.449a.5.5 0 1 0 .1021.9948L.5506 3.326l.0005.0048.036-.0036.1054-.0105a91 91 0 0 1 1.7304-.1515C3.4929 3.0822 4.8103 3 5.8334 3s2.3404.082 3.4105.1652a91 91 0 0 1 1.7304.1514l.1054.0105.0355.0036a.5.5 0 1 0 .1026-.9947l-.0381-.0039-.1077-.0107a92 92 0 0 0-1.7147-.1504.5.5 0 0 0-.1092-.031.959.959 0 0 1-.7327-.5867l-.0603-.1492A2.245 2.245 0 0 0 6.3734 0h-.8981a2.2155 2.2155 0 0 0-2.0541 1.3855 1.216 1.216 0 0 1-.9679.7497zM5.4753 1c-.4955 0-.9413.3007-1.127.7601a2.2 2.2 0 0 1-.1406.2868C4.7739 2.0186 5.335 2 5.8334 2c.5531 0 1.1834.0229 1.8123.0566a2 2 0 0 1-.0575-.1287l-.0603-.1492A1.245 1.245 0 0 0 6.3734 1z" clipRule="evenodd" />
                                            <path fill="currentColor" d="M10.3315 4.5433a.5.5 0 0 0-.9962-.0866l-.5368 6.1732C8.731 11.4051 8.082 12 7.304 12H4.096c-.803 0-1.4637-.6325-1.4985-1.4348l-.2647-6.087a.5.5 0 1 0-.999.0435l.2646 6.0869C1.6566 11.9458 2.7576 13 4.096 13h3.208c1.2967 0 2.3782-.9915 2.4906-2.2834z" />
                                            <path fill="currentColor" d="M3.8334 10a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1z" />
                                        </svg>
                                    </span>
                                    Удалить
                                </button>
                            }
                        </div>
                    }
                >
                    <button className={`${styles.pinControlPanel__button}`}>
                        <svg width="12" height="2" viewBox="0 0 12 2" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 0C0.447715 0 0 0.447715 0 1C0 1.55228 0.447715 2 1 2H1.01178C1.56407 2 2.01178 1.55228 2.01178 1C2.01178 0.447715 1.56407 0 1.01178 0H1Z" fill="currentColor" />
                            <path d="M4.63952 1C4.63952 0.447715 5.08723 0 5.63952 0H5.6513C6.20358 0 6.6513 0.447715 6.6513 1C6.6513 1.55228 6.20358 2 5.6513 2H5.63952C5.08723 2 4.63952 1.55228 4.63952 1Z" fill="currentColor" />
                            <path d="M9.27903 1C9.27903 0.447715 9.72675 0 10.279 0H10.2908C10.8431 0 11.2908 0.447715 11.2908 1C11.2908 1.55228 10.8431 2 10.2908 2H10.279C9.72675 2 9.27903 1.55228 9.27903 1Z" fill="currentColor" />
                        </svg>
                    </button>
                </Popover>
            }
        </div>
    )
}

const customHandleIcons = {
    'IMAGE': (
        <svg width="14" height="11" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.66667 4C4.21895 4 4.66667 3.55228 4.66667 3C4.66667 2.44772 4.21895 2 3.66667 2C3.11438 2 2.66667 2.44772 2.66667 3C2.66667 3.55228 3.11438 4 3.66667 4Z" fill="currentColor" />
            <path fillRule="evenodd" clipRule="evenodd" d="M2.66667 0H10.6667C12.1394 0 13.3333 1.19391 13.3333 2.66667V8C13.3333 9.47276 12.1394 10.6667 10.6667 10.6667H2.66667C1.19391 10.6667 0 9.47276 0 8V2.66667C0 1.19391 1.19391 0 2.66667 0ZM10.6667 1H2.66667C1.74619 1 1 1.74619 1 2.66667V8C1 8.25723 1.05827 8.50084 1.16233 8.71836L2.62287 6.71012C3.29482 5.78619 4.69188 5.84796 5.27966 6.8276C5.53396 7.25144 6.16435 7.19787 6.3435 6.73721L7.07921 4.84538C7.54873 3.63803 9.20647 3.51022 9.85553 4.63131L12.1934 8.66948C12.2834 8.46459 12.3333 8.23813 12.3333 8V2.66667C12.3333 1.74619 11.5871 1 10.6667 1ZM2.66667 9.66667C2.37414 9.66667 2.09921 9.5913 1.86024 9.45893L3.43161 7.29829C3.68214 6.95382 4.20302 6.97685 4.42216 7.34209C5.10423 8.47887 6.795 8.33521 7.2755 7.09965L8.01121 5.20783C8.17676 4.78213 8.76126 4.73707 8.9901 5.13235L11.4896 9.44966C11.2468 9.58778 10.966 9.66667 10.6667 9.66667H2.66667Z" fill="currentColor" />
        </svg>
    ),
    'TEXT': (
        <svg width="12" height="11" viewBox="0 0 12 11" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.16667 0C1.41777 0 0 1.41777 0 3.16667C0 3.44281 0.223858 3.66667 0.5 3.66667C0.776142 3.66667 1 3.44281 1 3.16667C1 1.97005 1.97005 1 3.16667 1H5.33333V10H3.83333C3.55719 10 3.33333 10.2239 3.33333 10.5C3.33333 10.7761 3.55719 11 3.83333 11H7.83333C8.10948 11 8.33333 10.7761 8.33333 10.5C8.33333 10.2239 8.10948 10 7.83333 10H6.33333V1H8.5C9.69662 1 10.6667 1.97005 10.6667 3.16667C10.6667 3.44281 10.8905 3.66667 11.1667 3.66667C11.4428 3.66667 11.6667 3.44281 11.6667 3.16667C11.6667 1.41777 10.2489 0 8.5 0H3.16667Z" fill="currentColor" />
        </svg>
    ),
    'VIDEO': (
        <svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M4.33333 7.12461C4.33333 8.24786 5.61739 8.91784 6.57603 8.29477L9.02431 6.7035C9.88079 6.14683 9.88078 4.91984 9.02431 4.36317L6.57603 2.7719C5.61739 2.14883 4.33333 2.8188 4.33333 3.94206V7.12461ZM5.33333 7.12461V3.94206C5.33333 3.79172 5.41144 3.66504 5.55778 3.58868C5.70552 3.51159 5.87887 3.51143 6.03106 3.61036L8.47935 5.20163C8.72911 5.36396 8.72911 5.70271 8.47935 5.86504L6.03106 7.45631C5.87887 7.55523 5.70552 7.55508 5.55778 7.47799C5.41144 7.40163 5.33333 7.27495 5.33333 7.12461Z" fill="currentColor" />
            <path fillRule="evenodd" clipRule="evenodd" d="M10.6667 0H2.66667C1.19391 0 0 1.19391 0 2.66667V8.53333C0 10.0061 1.19391 11.2 2.66667 11.2H10.6667C12.1394 11.2 13.3333 10.0061 13.3333 8.53333V2.66667C13.3333 1.19391 12.1394 0 10.6667 0ZM2.66667 1H10.6667C11.5871 1 12.3333 1.74619 12.3333 2.66667V8.53333C12.3333 9.45381 11.5871 10.2 10.6667 10.2H2.66667C1.74619 10.2 1 9.45381 1 8.53333V2.66667C1 1.74619 1.74619 1 2.66667 1Z" fill="currentColor" />
        </svg>
    )
}

interface ICustomHandleProps extends HandleProps {
    contentType: TContentFactoryPin['contentType'];
    nodeId: string;
    innerPosition?: {
        right?: number;
        left?: number;
        top?: number;
        bottom?: number;
    }
    blockMessage?: string;
}
const CustomHandle: React.FC<ICustomHandleProps> = ({
    contentType,
    nodeId,
    innerPosition,
    blockMessage,
    ...rest
}) => {
    const wrapperRef = useRef<HTMLDivElement | null>(null)
    const colors = getCustomHandleColors(contentType);
    const { hoveredSourceContentType, hoveredSourceNodeId, setHoveredSourceContentType, setHoveredSourceNodeId } = useContentFactoryCanvas();
    const isSourceHandle = rest.type === 'source';
    const isTargetHandle = rest.type === 'target';
    const isSelfBlocked = isTargetHandle && hoveredSourceNodeId === nodeId && hoveredSourceContentType === contentType;
    const effectiveIsConnectable = rest.isConnectable !== false && !isSelfBlocked;
    const isBlocked = effectiveIsConnectable === false;
    const effectiveBlockMessage = isSelfBlocked ? 'Нельзя связать ноду с самой собой' : blockMessage;
    const isDimmed = isTargetHandle && (
        (hoveredSourceContentType !== null && hoveredSourceContentType !== contentType) ||
        isSelfBlocked
    );
    return (
        <div
            style={{
                ...rest.style,
                cursor: isBlocked ? 'not-allowed' : 'default',
                opacity: isBlocked ? 0.5 : 1,
            }}
            ref={wrapperRef}
            data-tooltip={effectiveBlockMessage}
            className={`text_tertiary ${styles.customHandle__wrapper}`}

            onMouseEnter={() => {
                if (isSourceHandle) {
                    setHoveredSourceContentType(contentType)
                    setHoveredSourceNodeId(nodeId)
                }
                if (isBlocked && wrapperRef.current && effectiveBlockMessage) {
                    wrapperRef.current.classList.add(styles.customHandle__wrapper_tt)
                }
            }}
            onMouseLeave={(event) => {
                if (isSourceHandle) {
                    if (event.buttons === 1) return;
                    setHoveredSourceContentType(null)
                    setHoveredSourceNodeId(null)
                }
                if (wrapperRef.current) {
                    wrapperRef.current.classList.remove(styles.customHandle__wrapper_tt)
                }
            }}
        >
            <Handle
                {...rest}
                isConnectable={effectiveIsConnectable}
                style={{ transform: 'unset', left: 'unset', top: 'unset', right: 'unset', bottom: 'unset', width: '28px', height: '28px', border: 'none' }}
            >
                <button
                    className={styles.customHandle}
                    style={{ ...colors, ...innerPosition, opacity: isDimmed ? 0.2 : 1, transition: 'opacity 0.15s ease' }}
                >
                    {customHandleIcons[contentType]}
                </button>
            </Handle>
        </div>
    )
}


const DevInfoComponent: React.FC<any> = ({
    id,
    pinType,
    contentType,
    rest

}) => {
    return (
        <>
            <span className={styles.pin__label}>pin_id:&nbsp;{id}</span>
            <span className={styles.pin__label}>pin_type:&nbsp;{pinType}</span>
            <span className={styles.pin__label}>pin_content_type:&nbsp;{contentType}</span>
            <span className={styles.pin__label}>pin_position:&nbsp;{rest.positionAbsoluteX.toFixed(2)}, {rest.positionAbsoluteY.toFixed(2)}</span>
            <Tooltip
                title='click to console.log the whole params'
                arrow={false}
                placement='bottom'
            >
                <span className={styles.pin__label} style={{ cursor: 'pointer' }} onClick={() => console.log('rest', JSON.stringify(rest, null, 2))}>rest params</span>
            </Tooltip>
        </>
    )
}