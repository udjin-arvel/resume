import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useAppDispatch, useReferenceFiles } from '@app';
import styles from './GalleryModal.module.css'
import { API, apiAssetUrl, Spinner, useTheme } from '@shared';
import { imageGenerationActions, type IGenerationReference, videoGenerationActions } from '@entities';
import { useNavigate } from 'react-router';
import type { IGenerationStatusResponse, TGenerationType } from '@/5_shared/models/models';
import { App as AntdApp } from 'antd';

interface IGalleryModalWidgetProps {
    galleryModalState: { open: boolean, generationId: number | null };
    onClose: () => void;
    generationType: 'image' | 'video';
    onDeleteGenerated?: (generation_id: number, isHistoryDelete?: boolean) => void;
    references?: IGenerationReference[];
    generationStatus?: IGenerationStatusResponse;
    generationSource?: 'generation' | 'content_factory' | 'chat' | 'generate_image';
    hasGoLiveButton?: boolean;
    hasDeleteButton?: boolean;
    hasEnhanceButton?: boolean;
    hasDownloadButton?: boolean;
    hasAiModelInfo?: boolean;
    projectId?: string;
    histroyRequestLimit?: number;
    customEnhanceButtonHandler?: (url: string, generationId: number) => void;
    openedFromPage?: string,
    editType?: Array<'default' | 'infographics' | 'mask' | 'clear'>;
}

const getSampleImageUrl = (path: string | null | undefined): string => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('/storage/')) {
        return apiAssetUrl(path);
    }
    return apiAssetUrl(`/storage/${path}`);
}

export const GalleryModal: React.FC<IGalleryModalWidgetProps> = ({
    galleryModalState,
    onClose,
    generationType,
    references,
    onDeleteGenerated,
    generationStatus,
    generationSource = 'generation',
    hasGoLiveButton = true,
    hasDeleteButton = true,
    hasEnhanceButton = true,
    hasDownloadButton = true,
    hasAiModelInfo = true,
    projectId,
    histroyRequestLimit = 20,
    customEnhanceButtonHandler,
    openedFromPage,
    editType,
}) => {
    const { message } = AntdApp.useApp();
    const { theme } = useTheme();
    // global states
    const [selectedItemIndex, setSelectedItemIndex] = useState(0);
    const [loadingKeys, setLoadingKeys] = useState<Record<string, boolean>>({})
    const historyListRef = useRef<HTMLDivElement>(null);
    const handleMediaLoad = (key: string) => setLoadingKeys((prev) => ({ ...prev, [key]: false }))
    const handleMediaStart = (key: string) => setLoadingKeys((prev) => ({ ...prev, [key]: true }))
    const { unregisterReferenceFile } = useReferenceFiles();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const task_type: TGenerationType | undefined | string = useMemo(() => {
        if (generationSource === 'content_factory' && generationType === 'image') return 'edit_image,text_image';
        if (generationSource === 'content_factory' && generationType === 'video') return 'video_preview,reference_video,video_video,text_video';
        if (generationType === 'image') return 'edit_image';
        if (generationType === 'video') return 'video_preview';
        return undefined;
    }, [generationType, generationSource]);
    const {
        data: generationsHistory,
        refetch: refetchGenerationsHistory,
        fulfilledTimeStamp: generationsHistoryFulfilledTimeStamp,
    } = API.useGetGenerationsHistoryQuery({ limit: histroyRequestLimit, task_type, generationSource, projectId, editType });
    const { data: models } = API.useGetModelsListQuery();
    const { refetch: refetchCurrentVideoPreviewGenStatus } = API.useGetGenerationStatusQuery({ task_type: 'video_preview', source: 'generation' });

    const navRef = useRef({ selectedItemIndex, generationsHistory });


    const scrollFooterToSelectedItem = useCallback(() => {
        const footer = historyListRef.current;
        if (!footer) return;
        const item = footer.querySelector<HTMLElement>(`[data-generation-id="${selectedItemIndex}"]`);
        if (!item) return;
        requestAnimationFrame(() => {
            const step = item.offsetWidth + 8;
            const cRect = footer.getBoundingClientRect();
            const iRect = item.getBoundingClientRect();
            if (iRect.left < cRect.left) {
                const delta = cRect.left - iRect.left;
                footer.scrollLeft -= Math.ceil(delta / step) * step;
            } else if (iRect.right > cRect.right) {
                const delta = iRect.right - cRect.right;
                footer.scrollLeft += Math.ceil(delta / step) * step;
            }
        });
    }, [selectedItemIndex]);

    const getSortedGenerationsWithResult = useCallback(() => {
        return (generationsHistory ?? [])
            .filter(g => g.result)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [generationsHistory]);

    const leftAndRightNavigation = (direction: 'left' | 'right') => {
        const { selectedItemIndex: currentId, generationsHistory: history } = navRef.current;
        const sorted = (history ?? [])
            .filter(g => g.result)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const pos = sorted.findIndex(g => g.generation_id === currentId);
        if (pos === -1) return;
        const next = direction === 'left'
            ? sorted[pos - 1]
            : sorted[pos + 1];
        if (next) setSelectedItemIndex(next.generation_id);
    };

    const handleDeleteSelectedGeneration = useCallback(() => {
        const current = generationsHistory?.find(g => g.generation_id === selectedItemIndex);
        if (!current?.result) return;
        const id = current.generation_id;
        const remaining = getSortedGenerationsWithResult().filter(g => g.generation_id !== id);
        const nextId = remaining[0]?.generation_id;
        if (nextId !== undefined) {
            setSelectedItemIndex(nextId);
        }
        onDeleteGenerated?.(id, generationStatus?.generation_id !== id);
    }, [selectedItemIndex, generationsHistory, getSortedGenerationsWithResult, generationStatus?.generation_id, onDeleteGenerated]);

    const handleDeleteSelectedGenerationRef = useRef(handleDeleteSelectedGeneration);
    handleDeleteSelectedGenerationRef.current = handleDeleteSelectedGeneration;

    const handleGoLiveButtonHandler = async (reference: { id: string, url: string, generationId?: number }) => {
        const currentVideoPreviewGenStatus = await refetchCurrentVideoPreviewGenStatus().unwrap();
        if (currentVideoPreviewGenStatus?.task_status && currentVideoPreviewGenStatus?.task_status !== 'launched' && currentVideoPreviewGenStatus?.task_status !== 'pending') {
            dispatch(videoGenerationActions.replaceAllReferences([reference]))
            dispatch(videoGenerationActions.setIsGoLiveModeActive(true))
            navigate('/video-generation')
        } else {
            message.error('Генерация видео-превью уже запущена. Пожалуйста, дождитесь её завершения.');
        }

    }



    const currentlySelectedGeneration = useMemo(() => {
        return generationsHistory?.find(generation => generation.generation_id === selectedItemIndex);
    }, [generationsHistory, selectedItemIndex]);
    const selectedSampleThumbnail = useMemo(() => {
        return getSampleImageUrl(currentlySelectedGeneration?.sample?.path_thumbnail ?? currentlySelectedGeneration?.sample?.path ?? '');
    }, [currentlySelectedGeneration]);

    const currentModel = useMemo(() => {
        const { images: imagesModels, videos: videoModels } = models ?? {};
        if (generationType === 'image') {
            const currentModel = imagesModels?.find(model => model.id === generationsHistory?.find(generation => generation.generation_id === selectedItemIndex)?.ai_model);
            return currentModel;
        }
        if (generationType === 'video') {
            const currentModel = videoModels?.find(model => model.id === generationsHistory?.find(generation => generation.generation_id === selectedItemIndex)?.ai_model);
            return currentModel;
        }
        return null;
    }, [models, generationType, generationsHistory, selectedItemIndex]);
    const basicEnhanceButtonHandler = (url: string) => {
        if (references && references.length > 0 && generationType === 'image') {
            references?.forEach(_ => unregisterReferenceFile(_.id))
        }
        dispatch(imageGenerationActions.replaceAllReferences([{ id: url, url, generationId: currentlySelectedGeneration?.generation_id }]))
        onClose()
    }

    const onKeyPressHandler = (e: KeyboardEvent) => {
        const mod = e.ctrlKey || e.metaKey;
        if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            leftAndRightNavigation(e.key === 'ArrowLeft' ? 'left' : 'right');
        }
        if (e.key === 'Backspace' || e.key === 'Delete') {
            e.preventDefault();
            handleDeleteSelectedGenerationRef.current();
        }
        if (mod && e.key.toLowerCase() === 's') {
            e.preventDefault();
            const result = generationsHistory?.[selectedItemIndex]?.result;
            if (!result) return;
            const url = apiAssetUrl(result);
            const a = document.createElement('a');
            a.href = url;
            a.download = '';
            a.rel = 'noopener noreferrer';
            document.body.appendChild(a);
            a.click();
            a.remove();
        }
        if (mod && e.key === 'Enter') {
            e.preventDefault();
            if (customEnhanceButtonHandler) {
                customEnhanceButtonHandler(apiAssetUrl(generationsHistory?.[selectedItemIndex]?.result ?? ''), currentlySelectedGeneration?.generation_id ?? 0)
            } else {
                basicEnhanceButtonHandler(apiAssetUrl(generationsHistory?.[selectedItemIndex]?.result ?? ''))
            }
        }
    }

    useEffect(() => {
        navRef.current = { selectedItemIndex, generationsHistory };
    });
    useEffect(() => {
        if (!galleryModalState.open) return;
        scrollFooterToSelectedItem();
    }, [galleryModalState.open, scrollFooterToSelectedItem, generationsHistory]);
    useEffect(() => {
        if (galleryModalState.open) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', onKeyPressHandler);
            console.log('galleryModalState before refetching', galleryModalState);
            if (galleryModalState.generationId) {
                const elemToSelect = generationsHistory?.find(generation => generation.generation_id === galleryModalState.generationId);
                console.log('idToSelect', elemToSelect?.generation_id);
                console.log('ResultToSelect', elemToSelect?.result);
                console.log('generationsHistory', generationsHistory);
                if (elemToSelect && elemToSelect.result && elemToSelect.generation_id) {
                    setSelectedItemIndex(elemToSelect.generation_id);
                } else {
                    console.log('history refetching');
                    refetchGenerationsHistory();
                }
            }
        }
        if (!galleryModalState.open) {
            document.body.style.overflow = 'auto';
            window.removeEventListener('keydown', onKeyPressHandler);
        }
        return () => {
            window.removeEventListener('keydown', onKeyPressHandler);
            document.body.style.overflow = 'auto';
        }
    }, [galleryModalState]);

    useEffect(() => {
        if (galleryModalState.open && generationsHistory && galleryModalState.generationId) {
            console.log('galleryModalState after refetching', galleryModalState);
            const elemToSelect = generationsHistory?.find(generation => generation.generation_id === galleryModalState.generationId);
            console.log('idToSelect after refetch', elemToSelect?.generation_id);
            console.log('ResultToSelect after refetch', elemToSelect?.result);
            console.log('generationsHistory', generationsHistory);
            if (elemToSelect && elemToSelect.result && elemToSelect.generation_id) {
                setSelectedItemIndex(elemToSelect.generation_id);
            } else {
                const firstInTheList = generationsHistory?.[0]?.generation_id
                console.log('firstInTheList', firstInTheList);
                setSelectedItemIndex(firstInTheList);
            }
        }
    }, [generationsHistory, galleryModalState.open, galleryModalState.generationId, generationsHistoryFulfilledTimeStamp])


    return createPortal(
        <div
            className={styles.galleryModalWidget__backdrop}
            style={{ display: galleryModalState.open ? 'flex' : 'none' }}
            id="backdrop"
            onClick={(e) => {
                if ((e.target as HTMLElement).id === 'backdrop') {
                    onClose();
                }
            }}
        >
            <div className={styles.galleryModalWidget} data-open={galleryModalState.open}>
                {/* --- side block with info */}
                <div className={styles.galleryModalWidget__sidebar}>
                    {/* PLAIN SIDEBAR FOR ALL GENERATION TYPES EXCEPT CARD INFOPHGRAPHICS */}
                    {(!openedFromPage || openedFromPage !== 'card-infographics') &&
                        <div className={styles.galleryModalWidget__sidebarHeader}>
                            {hasAiModelInfo && <div className={`${styles.galleryModalWidget__wrapper} ${styles.galleryModalWidget__wrapper_hor}`}>
                                {currentModel && <img src={currentModel?.icon_path ? apiAssetUrl(currentModel.icon_path) : ''} alt="Model" width="52" height="52" style={{ filter: theme === 'light' ? 'invert(1)' : 'invert(0)' }} />}
                                <div className={styles.galleryModalWidget__modelInfo}>
                                    <span className='text_secondary'>Модель</span>
                                    <p className="text_primary" style={{ fontWeight: 600 }}>{currentModel?.name}</p>
                                </div>
                            </div>}
                            <PromptComponent prompt={currentlySelectedGeneration?.prompt ?? ''} />
                            <div className={`${styles.galleryModalWidget__wrapper} ${styles.galleryModalWidget__wrapper_refs}`}>
                                {selectedSampleThumbnail && (
                                    <div className={styles.galleryModalWidget__samplePreview}>
                                        <span className='text_secondary'>Модель из каталога</span>
                                        <div className={styles.galleryModalWidget__samplePreviewImageWrapper}>
                                            {loadingKeys[selectedSampleThumbnail] !== false && (
                                                <div className={styles.galleryModalWidget__spinnerWrapper}>
                                                    <Spinner style={{ width: 20, height: 20 }} />
                                                </div>
                                            )}
                                            <img
                                                src={selectedSampleThumbnail}
                                                alt="Выбранная модель"
                                                onLoadStart={() => handleMediaStart(selectedSampleThumbnail)}
                                                onLoad={() => handleMediaLoad(selectedSampleThumbnail)}
                                            />
                                        </div>
                                    </div>
                                )}
                                <span className='text_secondary'>Референсы</span>
                                <div className={styles.galleryModalWidget__carousel}>
                                    {(!currentlySelectedGeneration || currentlySelectedGeneration?.reference_thumbnails?.length === 0) && (
                                        <div className={styles.galleryModalWidget__carouselItem}>
                                            <span className='text_secondary'>—</span>
                                        </div>
                                    )}
                                    {currentlySelectedGeneration?.reference_thumbnails?.map((file, index) => (
                                        <div className={styles.galleryModalWidget__carouselItem} key={index}>
                                            <img src={apiAssetUrl(file)} alt={`Референс номер ${index + 1}`} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    }
                    {/* SPECIAL CASE FOR CARD INFOPHGRAPHICS */}
                    {openedFromPage === 'card-infographics' &&
                        <CardSidebarLayout generalPrompt={currentlySelectedGeneration?.prompt ?? ''} images={currentlySelectedGeneration?.reference_thumbnails ?? []} />
                    }
                    <div className={styles.galleryModalWidget__sidebarFooter}>
                        {generationType === 'image' &&
                            <>
                                {hasGoLiveButton && <button
                                    className={`${styles.galleryModalWidget__sidebarControlButton} ${styles.galleryModalWidget__sidebarControlButton_primary}`}
                                    onClick={() => handleGoLiveButtonHandler({ id: apiAssetUrl(currentlySelectedGeneration?.result_thumbnail ?? currentlySelectedGeneration?.result ?? ''), url: apiAssetUrl(currentlySelectedGeneration?.result_thumbnail ?? currentlySelectedGeneration?.result ?? ''), generationId: currentlySelectedGeneration?.generation_id ?? 0 })}>
                                    <div className={styles.galleryModalWidget__sidebarControlButtonIconWrapper}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none">
                                            <path fill="currentColor" fillRule="evenodd" d="M7.084 12.4058c0 1.404 1.605 2.2415 2.8034 1.4627l3.0603-1.9891a1.7338 1.7338 0 0 0 0-2.9254L9.8874 6.9649C8.689 6.186 7.084 7.0235 7.084 8.4276zm1.25 0V8.4276c0-.188.0976-.3463.2805-.4417.1847-.0964.4014-.0966.5916.027l3.0604 1.9892c.3122.2029.3122.6263 0 .8292l-3.0604 1.9891c-.1902.1236-.4069.1235-.5916.0271-.183-.0955-.2805-.2538-.2805-.4417" clipRule="evenodd" />
                                            <path fill="currentColor" d="M8.334 12.4058V8.4276c0-.188.0976-.3463.2805-.4417.1847-.0964.4014-.0966.5916.027l3.0604 1.9892c.3122.2029.3122.6263 0 .8292l-3.0604 1.9891c-.1902.1236-.4069.1235-.5916.0271-.183-.0955-.2805-.2538-.2805-.4417" />
                                            <path fill="currentColor" fillRule="evenodd" d="M4.9994 2.5h3.6138v1.25H4.9994c-1.1506 0-2.0834.9327-2.0834 2.0834v8.3333c0 1.1505.9328 2.0833 2.0834 2.0833h10c1.1506 0 2.0833-.9328 2.0833-2.0833V9.3349h1.25v4.8318c0 1.8409-1.4924 3.3333-3.3333 3.3333h-10c-1.841 0-3.3334-1.4924-3.3334-3.3333V5.8334C1.666 3.9924 3.1584 2.5 4.9994 2.5" clipRule="evenodd" />
                                            <path fill="currentColor" d="M12.9974 1.6851c-.1751-.4732-.8445-.4732-1.0196 0l-.2424.655a.543.543 0 0 1-.3211.3212l-.6551.2424c-.4732.1751-.4732.8445 0 1.0196l.6551.2424a.543.543 0 0 1 .3211.3211l.2424.6551c.1751.4733.8445.4733 1.0196 0l.2424-.655a.544.544 0 0 1 .3212-.3212l.655-.2424c.4733-.1751.4733-.8445 0-1.0196l-.655-.2424a.544.544 0 0 1-.3212-.3211z" />
                                            <path fill="currentColor" fillRule="evenodd" d="M15.2086 4.256c.2101-.5678 1.0134-.5678 1.2235 0l.2908.7862a.653.653 0 0 0 .3854.3854l.7861.2908c.5679.2102.5679 1.0134 0 1.2235l-.7861.2909a.653.653 0 0 0-.3854.3853l-.2908.7862c-.2101.5679-1.0134.5678-1.2235 0l-.2909-.7861a.652.652 0 0 0-.3853-.3854l-.7862-.2909c-.5679-.2101-.5679-1.0133 0-1.2235l.7862-.2908a.652.652 0 0 0 .3853-.3854zm.2486 2.0742a1.9 1.9 0 0 0 .3631-.3631c.1041.1368.2263.259.3631.363a1.9 1.9 0 0 0-.3631.3632 1.9 1.9 0 0 0-.3631-.3631" clipRule="evenodd" />
                                            <path fill="currentColor" d="M15.4572 6.3302a1.9 1.9 0 0 0 .3631-.3631c.1041.1368.2263.259.3631.363a1.9 1.9 0 0 0-.3631.3632 1.9 1.9 0 0 0-.3631-.3631M9.2645 3.1354a.6176.6176 0 1 0-1.2352 0 .6176.6176 0 0 0 1.2352 0m9.0722 6.0808a.6176.6176 0 1 0-1.2352 0 .6176.6176 0 0 0 1.2352 0" />
                                        </svg>

                                    </div>
                                    <span className='text_primary' style={{ fontWeight: 600 }}>Оживить</span>
                                </button>}
                                {hasEnhanceButton && <button className={styles.galleryModalWidget__sidebarControlButton} onClick={() => {
                                    if (customEnhanceButtonHandler) {
                                        customEnhanceButtonHandler(apiAssetUrl(currentlySelectedGeneration?.result ?? ''), currentlySelectedGeneration?.generation_id ?? 0)
                                    } else {
                                        basicEnhanceButtonHandler(apiAssetUrl(currentlySelectedGeneration?.result ?? ''))
                                    }
                                }}>
                                    <div className={styles.galleryModalWidget__sidebarControlButtonIconWrapper}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="15" fill="none">
                                            <path fill="currentColor" d="M10.3236.355c.1751-.4733.8444-.4733 1.0195 0l.2424.655a.544.544 0 0 0 .3212.3212l.655.2424c.4733.175.4733.8444 0 1.0195l-.655.2424a.544.544 0 0 0-.3212.3212l-.2424.655c-.1751.4733-.8444.4733-1.0195 0l-.2424-.655a.544.544 0 0 0-.3212-.3212l-.655-.2424c-.4733-.1751-.4733-.8444 0-1.0196l.655-.2423a.544.544 0 0 0 .3212-.3212z" />
                                            <path fill="currentColor" d="M7.2917 1.6667a.625.625 0 0 1 0 1.25h-4.125C2.1677 2.9167 1.25 3.7882 1.25 5v6.6667c0 .6754.2851 1.2451.7105 1.6172l1.6912-2.6827c.5405-.744 1.6643-.6943 2.1371.0946.5487.9153 1.9087.7996 2.2952-.1953l.8622-2.2192c.3721-.9578 1.6859-1.0592 2.2003-.1698l2.7562 5.1457c.4088-.3723.6806-.931.6806-1.5905V8.9583a.625.625 0 0 1 1.25 0v2.7084c0 1.8409-1.4177 3.3333-3.1666 3.3333h-9.5C1.4177 15 0 13.5076 0 11.6667V5c0-1.841 1.4178-3.3333 3.1667-3.3333z" />
                                            <path fill="currentColor" d="M4.5833 6.6667c.6904 0 1.25-.5597 1.25-1.25s-.5596-1.25-1.25-1.25-1.25.5596-1.25 1.25.5597 1.25 1.25 1.25M14.7784 2.926c-.2101-.568-1.0133-.568-1.2235 0l-.2909.786a.652.652 0 0 1-.3853.3854l-.7861.2909c-.5679.2101-.5679 1.0133 0 1.2234l.7861.291a.652.652 0 0 1 .3853.3853l.2909.786c.2102.568 1.0134.568 1.2235 0l.2909-.786a.652.652 0 0 1 .3854-.3854l.7861-.2909c.5678-.2101.5678-1.0133 0-1.2234l-.7861-.291a.652.652 0 0 1-.3854-.3853z" />
                                        </svg>
                                    </div>
                                    <span className='text_primary' style={{ fontWeight: 600 }}>Улучшить</span>
                                </button>}
                            </>
                        }
                        {hasDownloadButton && <a
                            className={styles.galleryModalWidget__sidebarControlButton}
                            href={currentlySelectedGeneration?.result ? apiAssetUrl(currentlySelectedGeneration.result) : undefined}
                            download={currentlySelectedGeneration?.result ? '' : undefined}
                            aria-disabled={!currentlySelectedGeneration?.result}
                            onClick={(e) => {
                                if (!currentlySelectedGeneration?.result) e.preventDefault()
                            }}
                            style={{
                                opacity: currentlySelectedGeneration?.result ? 1 : 0.45,
                                pointerEvents: currentlySelectedGeneration?.result ? 'auto' : 'none',
                            }}
                        >
                            <div className={styles.galleryModalWidget__sidebarControlButtonIconWrapper}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="15" fill="none">
                                    <path fill="currentColor" d="M3.3385 6.803c-.4028-1.4952-.1204-2.7208.5013-3.6321.6309-.9248 1.6374-1.563 2.7313-1.809 1.093-.246 2.2302-.0917 3.1317.5072.889.5905 1.6208 1.6612 1.8269 3.395a.625.625 0 0 0 .6206.5512c1.7789 0 2.7589 1.2293 2.8438 2.5718.0841 1.331-.723 2.7981-2.7365 3.1977a.625.625 0 1 0 .2433 1.2261c2.6421-.5243 3.8634-2.561 3.7407-4.5027-.113-1.7866-1.3741-3.4725-3.5492-3.7134-.323-1.7622-1.1659-3.015-2.2979-3.767-1.228-.8157-2.725-.9943-4.0978-.6855-1.372.3087-2.6633 1.113-3.4895 2.3241-.7538 1.105-1.0994 2.5186-.797 4.131-.6953.3428-1.2185.802-1.5591 1.3421-.4206.6671-.5373 1.4196-.3908 2.1322.2922 1.4218 1.5951 2.5952 3.408 2.8094a.625.625 0 0 0 .1467-1.2414c-1.3616-.1609-2.1626-1.0036-2.3303-1.8197-.0836-.4065-.0192-.8284.2238-1.2138.2447-.388.6955-.7767 1.444-1.0546a.625.625 0 0 0 .386-.7485" />
                                    <path fill="currentColor" d="m6.0164 12.5289 1.6666 1.6667a.625.625 0 0 0 .884 0l1.6666-1.6667a.625.625 0 1 0-.8839-.8839l-.5997.5998V9.587a.625.625 0 0 0-1.25 0v2.6578l-.5998-.5998a.625.625 0 0 0-.8839.8839" />
                                </svg>
                            </div>
                            <span className='text_primary' style={{ fontWeight: 600 }}>Скачать</span>
                        </a>}
                        {hasDeleteButton && <button
                            type="button"
                            className={styles.galleryModalWidget__sidebarControlButton}
                            disabled={!currentlySelectedGeneration?.result}
                            onClick={handleDeleteSelectedGeneration}
                        >
                            <div className={styles.galleryModalWidget__sidebarControlButtonIconWrapper}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="17" fill="none">
                                    <path fill="currentColor" fillRule="evenodd" d="M3.0433 2.672a.63.63 0 0 0-.1566.0417 115 115 0 0 0-2.1432.188l-.1348.0134-.0466.0047-.0009.0001A.625.625 0 1 0 .689 4.1634l-.0006-.006.0006.006.0449-.0046.1318-.013c.115-.0113.2826-.0275.492-.047a114 114 0 0 1 1.671-.1423C4.3663 3.8525 6.013 3.75 7.2918 3.75c1.2789 0 2.9255.1025 4.2631.2064a114 114 0 0 1 2.1631.1894l.1318.013.0443.0045a.625.625 0 1 0 .1282-1.2434l-.0475-.0048-.1347-.0133a115 115 0 0 0-2.1434-.188.63.63 0 0 0-.1365-.0388 1.198 1.198 0 0 1-.9158-.7333l-.0754-.1866A2.8065 2.8065 0 0 0 7.9668 0H6.844a2.769 2.769 0 0 0-2.5676 1.7319 1.519 1.519 0 0 1-1.2099.937zM6.844 1.25c-.6193 0-1.1767.376-1.4087.9501a2.8 2.8 0 0 1-.1758.3586C5.9673 2.5232 6.6687 2.5 7.2917 2.5c.6914 0 1.4794.0286 2.2654.0707a2.5 2.5 0 0 1-.0718-.1608l-.0754-.1865A1.5565 1.5565 0 0 0 7.9668 1.25z" clipRule="evenodd" />
                                    <path fill="currentColor" d="M12.9144 5.6791a.625.625 0 0 0-1.2453-.1082l-.671 7.7165C10.9138 14.2563 10.1027 15 9.1301 15h-4.01c-1.0038 0-1.8296-.7906-1.8732-1.7936l-.3308-7.6085a.625.625 0 0 0-1.2488.0542l.3308 7.6086c.0727 1.6716 1.449 2.9893 3.122 2.9893h4.01c1.621 0 2.9728-1.2394 3.1133-2.8543z" />
                                    <path fill="currentColor" d="M4.7917 12.5a.625.625 0 1 0 0 1.25h5a.625.625 0 1 0 0-1.25z" />
                                </svg>
                            </div>
                            <span className='text_primary' style={{ fontWeight: 600 }}>Удалить</span>
                        </button>}
                    </div>
                </div>
                {/* --- main preview */}
                <div className={styles.galleryModalWidget__content}>
                    <button className={`${styles.galleryModalWidget__controllButton} ${styles.galleryModalWidget__controllButton_topRight}`} onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none">
                            <path fill="currentColor" d="M1.789.307C1.3797-.1024.7162-.1024.307.307s-.4093 1.0727 0 1.482L3.518 5 .307 8.211c-.4093.4093-.4093 1.0728 0 1.482s1.0727.4093 1.482 0L5 6.482l3.211 3.211c.4093.4093 1.0728.4093 1.482 0s.4093-1.0727 0-1.482L6.482 5l3.211-3.211c.4093-.4093.4093-1.0728 0-1.482s-1.0727-.4093-1.482 0L5 3.518z" />
                        </svg>
                    </button>
                    <button className={`${styles.galleryModalWidget__controllButton} ${styles.galleryModalWidget__controllButton_bottomLeft}`} onClick={() => leftAndRightNavigation('left')}>
                        &larr;
                    </button>
                    <button className={`${styles.galleryModalWidget__controllButton} ${styles.galleryModalWidget__controllButton_bottomRight}`} onClick={() => leftAndRightNavigation('right')}>
                        &rarr;
                    </button>

                    {generationType === 'video' && currentlySelectedGeneration?.result && (
                        <VideoPlayer
                            src={apiAssetUrl(currentlySelectedGeneration?.result)}
                            isOpen={galleryModalState.open}
                        />
                    )}
                    {generationType === 'image' && currentlySelectedGeneration?.result &&
                        <div className={`${styles.galleryModalWidget__mediaWrapper}`}>
                            {loadingKeys[currentlySelectedGeneration.result] !== false && (
                                <div className={styles.galleryModalWidget__spinnerWrapper}>
                                    <Spinner />
                                </div>
                            )}
                            <img
                                key={selectedItemIndex}
                                src={apiAssetUrl(currentlySelectedGeneration?.result)}
                                alt="Image"
                                onLoadStart={(e) => {
                                    (e.target as HTMLImageElement).classList.remove('checkerboard-bg');
                                    handleMediaStart(currentlySelectedGeneration.result!)
                                }}
                                onLoad={(e) => {
                                    handleMediaLoad(currentlySelectedGeneration.result!);
                                    const { naturalWidth, naturalHeight } = e.target as HTMLImageElement;
                                    (e.target as HTMLImageElement).classList.add('checkerboard-bg');
                                    if (naturalWidth > naturalHeight) {
                                        (e.target as HTMLImageElement).style.width = 'auto';
                                        (e.target as HTMLImageElement).style.height = 'auto';
                                    } else {
                                        (e.target as HTMLImageElement).style.width = 'auto';
                                        (e.target as HTMLImageElement).style.height = 'auto';
                                    }
                                }}
                            />
                        </div>
                    }
                </div>
                {/* --- history list */}
                <div className={styles.galleryModalWidget__footer} ref={historyListRef}>
                    {generationsHistory
                        ?.filter((_) => _.result)
                        .sort(
                            (a, b) =>
                                new Date(b.created_at).getTime() -
                                new Date(a.created_at).getTime()
                        )
                        .map((_, index) => {
                            if (generationType === 'image') {
                                return (
                                    <div
                                        className={`${styles.galleryModalWidget__footerItem} ${_.generation_id === selectedItemIndex ? styles.galleryModalWidget__footerItem_active : ''}`}
                                        key={_.generation_id}
                                        data-generation-id={_.generation_id}
                                        onClick={() => setSelectedItemIndex(_.generation_id)}
                                    >
                                        {loadingKeys[_.result_thumbnail ?? _.result!] !== false && (
                                            <div className={styles.galleryModalWidget__spinnerWrapper}>
                                                <Spinner style={{ width: 20, height: 20 }} />
                                            </div>
                                        )}
                                        <img
                                            src={apiAssetUrl(_.result_thumbnail ?? _.result)}
                                            alt={`Сегенрированное изображение номер ${index + 1}`}
                                            onLoadStart={() => handleMediaStart(_.result_thumbnail ?? _.result!)}
                                            onLoad={() => handleMediaLoad(_.result_thumbnail ?? _.result!)}
                                            onError={(e) => {
                                                if (_.result_thumbnail && _.result) {
                                                    (e.currentTarget as HTMLImageElement).src = apiAssetUrl(_.result);
                                                }
                                            }}
                                        />
                                    </div>
                                )
                            }
                            if (generationType === 'video') {
                                return (
                                    <div
                                        className={`${styles.galleryModalWidget__footerItem} ${_.generation_id === selectedItemIndex ? styles.galleryModalWidget__footerItem_active : ''}`}
                                        key={_.generation_id}
                                        data-generation-id={_.generation_id}
                                        onClick={() => setSelectedItemIndex(_.generation_id)}
                                    >
                                        {loadingKeys[_.result!] !== false && (
                                            <div className={styles.galleryModalWidget__spinnerWrapper}>
                                                <Spinner style={{ width: 20, height: 20 }} />
                                            </div>
                                        )}
                                        <video
                                            src={apiAssetUrl(_.result)}
                                            preload="metadata"
                                            muted
                                            playsInline
                                            onLoadStart={() => handleMediaStart(_.result!)}
                                            onLoadedData={() => handleMediaLoad(_.result!)}
                                        />
                                    </div>
                                )
                            }
                        })}
                </div>
            </div>
        </div>,
        document.body
    )
}



const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

const VideoPlayer = ({ src, isOpen }: { src: string; isOpen: boolean }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const isSeekingRef = useRef(false);
    const shouldAutoPlayRef = useRef(false);
    /** true until first successful autoplay policy after modal open (incl. reopen with same src) */
    const preferAutoplayAfterModalOpenRef = useRef(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const isPlayingRef = useRef(false);
    const [isMuted, setIsMuted] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isVideoLoading, setIsVideoLoading] = useState(true);

    const togglePlay = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) {
            video.play();
        } else {
            video.pause();
        }
    }, []);

    const toggleMute = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = !video.muted;
        setIsMuted(video.muted);
    }, []);

    const handleTimeUpdate = useCallback(() => {
        const video = videoRef.current;
        if (!video || isSeekingRef.current) return;
        setCurrentTime(video.currentTime);
    }, []);

    const handleLoadedMetadata = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        const d = video.duration;
        setDuration(Number.isFinite(d) ? d : 0);
        setCurrentTime(Number.isFinite(video.currentTime) ? video.currentTime : 0);
    }, []);

    const handleCanPlay = useCallback(() => {
        setIsVideoLoading(false);
        if (shouldAutoPlayRef.current) {
            shouldAutoPlayRef.current = false;
            preferAutoplayAfterModalOpenRef.current = false;
            void videoRef.current?.play().catch(() => { });
        }
    }, []);

    const handleVideoError = useCallback(() => {
        setIsVideoLoading(false);
    }, []);

    const handleWaiting = useCallback(() => {
        setIsVideoLoading(true);
    }, []);

    const handlePlaying = useCallback(() => {
        setIsVideoLoading(false);
    }, []);

    const videoOnKeyPressHandler = useCallback((e: KeyboardEvent) => {
        if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault();
            togglePlay();
            return;
        }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            toggleMute();
        }
    }, [togglePlay, toggleMute]);

    useEffect(() => {
        if (!isOpen) {
            videoRef.current?.pause();
            return;
        }
        preferAutoplayAfterModalOpenRef.current = true;
        shouldAutoPlayRef.current = true;
        const tryPlayIfAlreadyBuffered = () => {
            const v = videoRef.current;
            if (!v || !preferAutoplayAfterModalOpenRef.current) return;
            if (v.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
                void v.play().then(
                    () => {
                        shouldAutoPlayRef.current = false;
                        preferAutoplayAfterModalOpenRef.current = false;
                    },
                    () => { },
                );
            }
        };
        const raf = requestAnimationFrame(tryPlayIfAlreadyBuffered);
        window.addEventListener('keydown', videoOnKeyPressHandler);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('keydown', videoOnKeyPressHandler);
            videoRef.current?.pause();
        };
    }, [isOpen, videoOnKeyPressHandler]);

    useEffect(() => {
        if (preferAutoplayAfterModalOpenRef.current) {
            shouldAutoPlayRef.current = true;
            preferAutoplayAfterModalOpenRef.current = false;
        } else {
            shouldAutoPlayRef.current = isPlayingRef.current;
        }
        setIsVideoLoading(true);
        setDuration(0);
        setCurrentTime(0);
    }, [src]);

    return (
        <>
            <div
                className={styles.galleryModalWidget__mediaWrapper}
                aria-busy={isVideoLoading}
            >
                <video
                    key={src}
                    ref={videoRef}
                    src={src}
                    loop
                    playsInline
                    onPlay={() => { setIsPlaying(true); isPlayingRef.current = true; }}
                    onPause={() => { setIsPlaying(false); isPlayingRef.current = false; }}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onCanPlayThrough={handleCanPlay}
                    onError={handleVideoError}
                    onWaiting={handleWaiting}
                    onPlaying={handlePlaying}
                    onClick={togglePlay}
                    muted={isMuted}
                />
                {isVideoLoading && (
                    <div
                        className={styles.galleryModalWidget__videoLoaderOverlay}
                        aria-live="polite"
                    >
                        <Spinner />
                    </div>
                )}
            </div>
            <div className={styles.galleryModalWidget__videoControls}>
                <button className={styles.galleryModalWidget__controllButton} style={{ position: 'relative' }} onClick={togglePlay} type="button">
                    {isPlaying
                        ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="2.93359" y="1.60001" width="4" height="12.8" rx="1.6" fill="currentColor" />
                            <rect x="9.33398" y="1.60001" width="4" height="12.8" rx="1.6" fill="currentColor" />
                        </svg>

                        : <svg width="11" height="12" viewBox="0 0 11 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 9.91788V1.96962C0 0.455665 1.57599 -0.490558 2.83679 0.26642L9.45597 4.24055C10.7168 4.99753 10.7168 6.88997 9.45597 7.64695L2.83679 11.6211C1.57599 12.3781 0 11.4318 0 9.91788Z" fill="currentColor" />
                        </svg>

                    }
                </button>
                <button className={styles.galleryModalWidget__controllButton} style={{ position: 'relative' }} onClick={toggleMute} type="button">
                    {isMuted
                        ? <svg width="11" height="12" viewBox="0 0 11 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7.90173 0C8.27648 0 8.6176 0.143993 8.87278 0.379671L0.883959 8.3685C0.352488 8.02962 0 7.4349 0 6.75786V5.24214C0 4.18793 0.854602 3.33333 1.9088 3.33333C2.28699 3.33333 2.65665 3.22099 2.97088 3.01057L7.10517 0.242074C7.34085 0.0842547 7.61809 0 7.90173 0Z" fill="currentColor" />
                            <path d="M7.10517 11.7579L3.04309 9.03779L9.33333 2.74755V10.5684C9.33333 11.359 8.69238 12 7.90173 12C7.61809 12 7.34085 11.9157 7.10517 11.7579Z" fill="currentColor" />
                            <path d="M10.3536 1.02022C10.5488 0.824958 10.5488 0.508375 10.3536 0.313113C10.1583 0.117851 9.84171 0.117851 9.64645 0.313113L0.646447 9.31311C0.451184 9.50838 0.451184 9.82496 0.646447 10.0202C0.841709 10.2155 1.15829 10.2155 1.35355 10.0202L10.3536 1.02022Z" fill="currentColor" />
                        </svg>

                        : <svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 6.75786V5.24214C0 4.18793 0.854602 3.33333 1.9088 3.33333C2.28699 3.33333 2.65665 3.22099 2.97088 3.01057L7.10517 0.242074C7.34085 0.0842547 7.61809 0 7.90173 0C8.69238 0 9.33333 0.640951 9.33333 1.4316V10.5684C9.33333 11.359 8.69238 12 7.90173 12C7.61809 12 7.34085 11.9157 7.10517 11.7579L2.97088 8.98943C2.65665 8.77901 2.28699 8.66667 1.9088 8.66667C0.854602 8.66667 0 7.81207 0 6.75786Z" fill="currentColor" />
                            <path d="M12.0604 9.3916C12.6203 8.67622 13.1667 7.56999 13.1667 5.99993C13.1667 4.42987 12.6203 3.32364 12.0604 2.60826C11.7824 2.25308 11.5033 1.9968 11.2906 1.82744C11.1841 1.74265 11.0937 1.67922 11.0276 1.63571C10.9945 1.61393 10.9675 1.5971 10.9475 1.58502C10.9375 1.57898 10.9292 1.57412 10.9228 1.57043L10.9147 1.56576L10.912 1.56428L10.9104 1.56339L10.9094 1.56281C10.668 1.42874 10.3636 1.51577 10.2295 1.75718C10.0959 1.99785 10.182 2.30109 10.4217 2.43579L10.4308 2.44119C10.4401 2.44679 10.456 2.45664 10.4776 2.47088C10.5209 2.49939 10.5868 2.54531 10.6677 2.60979C10.83 2.73898 11.0509 2.94094 11.2729 3.2246C11.713 3.78688 12.1667 4.68066 12.1667 5.99993C12.1667 7.3192 11.713 8.21297 11.2729 8.77526C11.0509 9.05892 10.83 9.26088 10.6677 9.39007C10.5868 9.45454 10.5209 9.50046 10.4776 9.52897C10.456 9.54321 10.4401 9.55306 10.4308 9.55866L10.4217 9.56406C10.182 9.69876 10.0959 10.002 10.2295 10.2427C10.3636 10.4841 10.668 10.5711 10.9094 10.437C10.9147 10.4341 10.9104 10.4365 10.9104 10.4365L10.9117 10.4358L10.9147 10.4341L10.9228 10.4294C10.9292 10.4257 10.9375 10.4209 10.9475 10.4148C10.9675 10.4028 10.9945 10.3859 11.0276 10.3641C11.0937 10.3206 11.1841 10.2572 11.2906 10.1724C11.5033 10.0031 11.7824 9.74677 12.0604 9.3916Z" fill="currentColor" />
                            <path d="M10.2427 4.22948C10.0013 4.09541 9.69695 4.18243 9.56288 4.42385C9.43017 4.66282 9.5141 4.9635 9.74997 5.09959L9.75365 5.10197C9.76049 5.10647 9.77426 5.11595 9.79275 5.13067C9.83002 5.16034 9.88425 5.20955 9.93959 5.28027C10.0463 5.41666 10.1667 5.64377 10.1667 5.99993C10.1667 6.35609 10.0463 6.5832 9.93959 6.71959C9.88425 6.79031 9.83002 6.83952 9.79275 6.86919C9.77426 6.88391 9.76049 6.89338 9.75365 6.89788L9.74998 6.90026C9.5141 7.03636 9.43017 7.33704 9.56288 7.57601C9.69695 7.81742 10.0013 7.90445 10.2427 7.77038L10.2437 7.76984L10.2448 7.76926L10.247 7.76798L10.2523 7.76494L10.2658 7.75696C10.2761 7.75077 10.2888 7.74283 10.3036 7.73306C10.3333 7.71355 10.3716 7.68658 10.4156 7.65154C10.5033 7.5817 10.6158 7.47816 10.7271 7.33593C10.9537 7.04644 11.1667 6.60688 11.1667 5.99993C11.1667 5.39298 10.9537 4.95342 10.7271 4.66392C10.6158 4.52169 10.5033 4.41816 10.4156 4.34832C10.3716 4.31328 10.3333 4.2863 10.3036 4.2668C10.2888 4.25703 10.2761 4.24909 10.2658 4.2429L10.2523 4.23491L10.247 4.23188L10.2448 4.2306L10.2437 4.23002C10.2437 4.23002 10.2658 4.2429 10.2523 4.23491L10.2427 4.22948Z" fill="currentColor" />
                        </svg>

                    }
                </button>
                <input
                    className={styles.galleryModalWidget__seekbar}
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    step={0.01}
                    onPointerDown={() => { isSeekingRef.current = true; }}
                    onPointerUp={() => { isSeekingRef.current = false; }}
                    onChange={(e) => {
                        const t = Number(e.target.value);
                        setCurrentTime(t);
                        if (videoRef.current) videoRef.current.currentTime = t;
                    }}
                />
                <span className={styles.galleryModalWidget__videoTime}>
                    {formatTime(currentTime)} / {formatTime(duration)}
                </span>
            </div>
        </>
    )
}

interface ICardSidebarLayoutProps {
    generalPrompt?: string;
    images: string[]
}

const CardSidebarLayout: React.FC<ICardSidebarLayoutProps> = ({ generalPrompt, images }) => {
    const [promptState, setPromptState] = useState<string[]>([]);
    console.log('promptState', promptState);
    useEffect(function parsePrompt() {
        const promptParser = async (prompt: string) => {
            try {
                const parsedPrompt = await JSON.parse(prompt);
                if (typeof parsedPrompt === 'object' && Array.isArray(parsedPrompt)) {
                    return setPromptState(parsedPrompt.map((item: string) => item.trim()));
                }
            } catch (error) {
                setPromptState([prompt.trim()]);
                console.error('Error parsing prompt', error);
            }
        }
        if (!generalPrompt) return;
        promptParser(generalPrompt);
    }, [generalPrompt]);
    return (
        <div className={styles.galleryModalWidget__sidebarHeader}>
            <div className={`${styles.galleryModalWidget__wrapper} ${styles.galleryModalWidget__wrapper_prompt}`}>
                <span className='text_secondary'>Описание товара</span>
                <p className="text_secondary">{promptState[0] || '—'}</p>
            </div>
            <div className={`${styles.galleryModalWidget__wrapper} ${styles.galleryModalWidget__wrapper_refs}`}>
                <span className='text_secondary'>Фото товара</span>
                <div className={styles.galleryModalWidget__carousel}>
                    <div className={styles.galleryModalWidget__carouselItem}>
                        {images[0] ? <img src={apiAssetUrl(images[0])} alt="Фото товара" /> : <span className='text_secondary'>—</span>}
                    </div>
                </div>
            </div>
            <div className={`${styles.galleryModalWidget__wrapper} ${styles.galleryModalWidget__wrapper_prompt}`}>
                <span className='text_secondary'>Промпт</span>
                <p className="text_secondary">{promptState[1] || '—'}</p>
            </div>
            <div className={`${styles.galleryModalWidget__wrapper} ${styles.galleryModalWidget__wrapper_refs}`}>
                <span className='text_secondary'>Референс</span>
                <div className={styles.galleryModalWidget__carousel}>
                    <div className={styles.galleryModalWidget__carouselItem}>
                        {images[1] ? <img src={apiAssetUrl(images[1])} alt="Референс" /> : <span className='text_secondary'>—</span>}
                    </div>
                </div>
            </div>
        </div>
    )
}

const PromptComponent: React.FC<{ prompt: string }> = ({ prompt }) => {
    const [promptState, setPromptState] = useState<string>('');
    useEffect(function parsePrompt() {
        const promptParser = async (prompt: string) => {
            try {
                const parsedPrompt = await JSON.parse(prompt);
                if (parsedPrompt) {
                    switch (typeof parsedPrompt) {
                        case 'string':
                            return setPromptState(parsedPrompt);
                        case 'object':
                            return setPromptState(() => {
                                console.log(Array.isArray(parsedPrompt));
                                if (Array.isArray(parsedPrompt)) {
                                    return parsedPrompt.join(' ');
                                }
                                return parsedPrompt.toString();
                            });
                    }
                }
            } catch (error) {
                setPromptState(prompt.trim());
                console.error('Error parsing prompt @ PromptComponent', error);
            }

        }
        if (!prompt) return;
        promptParser(prompt);
    }, [prompt]);
    return (
        <div className={`${styles.galleryModalWidget__wrapper} ${styles.galleryModalWidget__wrapper_prompt}`}>
            <span className='text_secondary'>Промпт</span>
            <p className="text_secondary">{promptState || '—'}</p>
        </div>
    )
}