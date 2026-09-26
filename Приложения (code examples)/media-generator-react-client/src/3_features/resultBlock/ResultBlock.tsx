import { useMemo, useState, type SetStateAction, useRef, useLayoutEffect } from 'react';
import styles from './ResultBlock.module.css'
import { GenerationLoadingBlock } from '@features';
import { apiAssetUrl, Spinner, API } from '@shared';
import { imageGenerationActions, videoGenerationActions } from '@entities';
import { useAppDispatch, useReferenceFiles } from '@app';
import { useNavigate } from 'react-router';
import type { IGenerationHistoryResponseDTO, IGenerationStatusResponse } from '@shared/models/models';
import { App as AntdApp } from 'antd';

interface IResultBlockProps {
    isLoading: boolean;
    setIsGalleryModalOpen: React.Dispatch<SetStateAction<{ open: boolean, generationId: number | null }>>
    onDelete: (generation_id: number, isHistoryDelete?: boolean) => void
    generationType: 'image' | 'video'
    references: { id: string, url: string }[]
    generationStatus?: IGenerationStatusResponse
    generationsHistory?: IGenerationHistoryResponseDTO[]
    generationsHistoryUpdatedAt?: number
    refetchGenerationsHistory: () => void,
    hasEnhanceButton?: boolean,
    hasGoLiveButton?: boolean,
    hasCurrentGenerationBlock?: boolean,
    customEnhanceButtonHandler?: (url: string, generationId: number) => void,
    isOnImageGenetationPage?: boolean,
    historyBlockTitle?: string,
    currGenerationBlockTitle?: string,
}

export const ResultBlock: React.FC<IResultBlockProps> = ({
    isLoading,
    setIsGalleryModalOpen,
    onDelete,
    generationType,
    references,
    generationStatus,
    generationsHistory,
    generationsHistoryUpdatedAt,
    refetchGenerationsHistory,
    hasEnhanceButton = true,
    hasGoLiveButton = true,
    hasCurrentGenerationBlock = true,
    customEnhanceButtonHandler,
    isOnImageGenetationPage = true,
    historyBlockTitle = 'История генераций',
    currGenerationBlockTitle = 'Результат генерации',
}) => {
    const isTaskProcessing = isOnImageGenetationPage ? (generationStatus?.task_status === 'launched' || generationStatus?.task_status === 'pending') : false
    const { unregisterReferenceFile } = useReferenceFiles();
    const dispatch = useAppDispatch()
    const [loadingKeys, setLoadingKeys] = useState<Record<string, boolean>>({})
    const historyContainerRef = useRef<HTMLDivElement>(null)
    const { refetch: refetchCurrentVideoPreviewGenStatus } = API.useGetGenerationStatusQuery({ task_type: 'video_preview', source: 'generation' });
    const navigate = useNavigate()
    const { message } = AntdApp.useApp()
    const handleMediaLoad = (key: string) => {
        setLoadingKeys((prev) => ({ ...prev, [key]: false }))
    }

    const handleMediaStart = (key: string) => {
        setLoadingKeys((prev) => ({ ...prev, [key]: true }))
    }
    const hasActualHistory = useMemo(() => {
        if (!generationsHistory || generationsHistory?.length === 0) return false;
        const isWaiting = generationStatus?.task_status === 'waiting';
        if (isWaiting) {
            return generationsHistory.filter((g) => g.generation_id !== generationStatus?.generation_id && g.result).length > 0
        } else {
            return generationsHistory.filter((g) => g.result).length > 0
        }
    }, [generationsHistory, generationStatus]);
    const hasScroll = useMemo(() => {
        const historyContainer = historyContainerRef.current;
        if (!historyContainer) return false;
        return historyContainer.scrollWidth > historyContainer.clientWidth;
    }, [generationsHistory, generationStatus, historyContainerRef])
    const enhanceButtonHandler = (url: string, taskId: number) => {
        if (customEnhanceButtonHandler) {
            customEnhanceButtonHandler(url, taskId);
        } else {
            refetchGenerationsHistory();
            if (references.length > 0) {
                references.forEach(_ => unregisterReferenceFile(_.id))
            }
            dispatch(imageGenerationActions.replaceAllReferences([{ id: url, url, generationId: taskId }]))
            const promptInput = document.getElementById('promptTextArea') as HTMLTextAreaElement;
            if (promptInput) {
                promptInput.focus();
            }
        }
      
    }
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

    useLayoutEffect(() => {
        if (!historyContainerRef.current) return;
        if (!hasActualHistory) return;

        const rafId = window.requestAnimationFrame(() => {
            historyContainerRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
        });

        return () => {
            window.cancelAnimationFrame(rafId);
        };
    }, [generationsHistoryUpdatedAt, hasActualHistory, generationsHistory])

    return (isLoading || (generationStatus && generationStatus.task_status === 'waiting') || hasActualHistory) && (
        <div className={styles.resultWidget}>
            {hasCurrentGenerationBlock && (isLoading || (generationStatus && generationStatus.task_status === 'waiting' && generationStatus?.result)) && (
                <div className={styles.resultWidget__result}>
                    <p className={`text_tertiary ${styles.resultWidget__blockTitle}`} style={{ marginLeft: '8px' }}>{currGenerationBlockTitle}</p>
                    {/* Current generation block */}
                    <div className={styles.resultWidget__resultList}>
                        {isLoading &&
                            <GenerationLoadingBlock title='Генерация' />
                        }
                        {!isLoading && generationStatus && generationStatus.task_status === 'waiting' && generationStatus.result &&
                            <div className={styles.resultWrapper}>
                                {loadingKeys[generationStatus.result_thumbnail ?? generationStatus?.reference_thumbnails?.[0] ?? generationStatus.result! ?? ''] !== false && (
                                    <div className={styles.resultWrapper__spinnerWrapper}>
                                        <Spinner />
                                    </div>
                                )}
                                {generationType === 'image' ? (
                                    <img
                                        src={apiAssetUrl(generationStatus.result_thumbnail ?? generationStatus.result!)}
                                        alt="Result Image"
                                        onLoadStart={() => handleMediaStart(generationStatus.result_thumbnail ?? generationStatus.result!)}
                                        onLoad={() => handleMediaLoad(generationStatus.result_thumbnail ?? generationStatus.result!)}
                                    />
                                ) : (
                                    <img
                                        src={apiAssetUrl(generationStatus?.reference_thumbnails?.[0] ?? '')}
                                        alt="Result Image"
                                        onLoadStart={() => handleMediaStart(generationStatus?.reference_thumbnails?.[0] ?? '')}
                                        onLoad={() => handleMediaLoad(generationStatus?.reference_thumbnails?.[0] ?? '')}
                                    />
                                )}
                                <div className={styles.resultWrapper__controls}>
                                    <div className={styles.resultWrapper__controlsBox}>
                                        <div className={styles.resultWrapper__controlsGroup}>
                                            {generationType === 'image' && hasGoLiveButton &&
                                                <button
                                                    className={`text_tertiary ${styles.resultWrapper__controlButtonSmall}`}
                                                    onClick={() => handleGoLiveButtonHandler({ id: apiAssetUrl(generationStatus.result_thumbnail ?? generationStatus.result!), url: apiAssetUrl(generationStatus.result_thumbnail ?? generationStatus.result!), generationId: generationStatus?.generation_id ?? 0 })}
                                                >
                                                    <span>
                                                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path fillRule="evenodd" clipRule="evenodd" d="M4.93202 7.44613C4.21304 7.91343 3.25 7.41095 3.25 6.56851V4.18159C3.25 3.33915 4.21304 2.83667 4.93202 3.30397L6.76823 4.49743C7.41059 4.91493 7.41059 5.83517 6.76823 6.25267L4.93202 7.44613ZM4 4.18159V6.56851C4 6.68126 4.05858 6.77627 4.16833 6.83354C4.27914 6.89136 4.40915 6.89147 4.5233 6.81728L6.35951 5.62383C6.54683 5.50208 6.54683 5.24802 6.35951 5.12627L4.5233 3.93282C4.40915 3.85863 4.27914 3.85874 4.16833 3.91656C4.05858 3.97383 4 4.06884 4 4.18159Z" fill="white" />
                                                            <path fillRule="evenodd" clipRule="evenodd" d="M3.19875 0.0570508C3.02312 -0.0527155 2.79177 0.000674397 2.682 0.176301C2.57223 0.351927 2.62562 0.583283 2.80125 0.69305L3.89245 1.37505H2C0.895431 1.37505 0 2.27048 0 3.37505V7.37505C0 8.47962 0.895431 9.37505 2 9.37505H8C9.10457 9.37505 10 8.47962 10 7.37505V3.37505C10 2.27048 9.10457 1.37505 8 1.37505H6.10755L7.19875 0.69305C7.37438 0.583283 7.42777 0.351927 7.318 0.176301C7.20823 0.000674397 6.97688 -0.0527155 6.80125 0.0570508L5 1.18283L3.19875 0.0570508ZM9.25 3.37505C9.25 2.68469 8.69036 2.12505 8 2.12505H2C1.30964 2.12505 0.75 2.68469 0.75 3.37505V7.37505C0.75 8.06541 1.30964 8.62505 2 8.62505H8C8.69036 8.62505 9.25 8.06541 9.25 7.37505V3.37505Z" fill="white" />
                                                        </svg>
                                                    </span>
                                                    Оживить
                                                </button>
                                            }
                                        </div>
                                        {generationType === 'image' && hasEnhanceButton &&
                                            <button className={`text_primary ${styles.resultWrapper__controlButton}`} onClick={() => enhanceButtonHandler(apiAssetUrl(generationStatus.result_thumbnail ?? generationStatus.result!), generationStatus?.generation_id ?? 0)}>
                                                <span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="37" height="35" fill="none">
                                                        <path fill="#fff" d="M20.3236 10.3549c.1751-.4732.8444-.4732 1.0195 0l.2424.6551a.544.544 0 0 0 .3212.3212l.655.2424c.4733.1751.4733.8444 0 1.0195l-.655.2424a.544.544 0 0 0-.3212.3212l-.2424.655c-.1751.4733-.8444.4733-1.0195 0l-.2424-.655a.544.544 0 0 0-.3212-.3212l-.6551-.2424c-.4732-.1751-.4732-.8444 0-1.0195l.6551-.2424a.544.544 0 0 0 .3212-.3212z" />
                                                        <path fill="#fff" d="M17.2917 11.6667a.625.625 0 0 1 0 1.25h-4.125c-.9989 0-1.9167.8715-1.9167 2.0833v6.6667c0 .6754.2851 1.2451.7105 1.6172l1.6912-2.6827c.5405-.744 1.6643-.6942 2.1371.0946.5487.9153 1.9087.7996 2.2952-.1953l.8622-2.2192c.3721-.9578 1.6859-1.0592 2.2003-.1698l2.7562 5.1457c.4088-.3723.6806-.931.6806-1.5905v-2.7084a.6251.6251 0 0 1 1.25 0v2.7084c0 1.8409-1.4177 3.3333-3.1666 3.3333h-9.5C11.4178 25 10 23.5076 10 21.6667V15c0-1.8409 1.4178-3.3333 3.1667-3.3333z" />
                                                        <path fill="#fff" d="M14.5833 16.6667c.6904 0 1.25-.5597 1.25-1.25s-.5596-1.25-1.25-1.25-1.25.5596-1.25 1.25.5597 1.25 1.25 1.25m10.1951-3.7408c-.2101-.5679-1.0133-.5679-1.2235 0l-.2909.7861a.652.652 0 0 1-.3853.3854l-.7861.2909c-.5679.2101-.5679 1.0133 0 1.2234l.7861.2909a.652.652 0 0 1 .3853.3854l.2909.7861c.2102.5679 1.0134.5679 1.2235 0l.2909-.7861a.653.653 0 0 1 .3854-.3854l.7861-.2909c.5678-.2101.5678-1.0133 0-1.2234l-.7861-.2909a.653.653 0 0 1-.3854-.3854z" />
                                                    </svg>
                                                </span>
                                                Улучшить
                                            </button>}
                                        <div className={styles.resultWrapper__controlsGroup}>
                                            <button className={`text_tertiary ${styles.resultWrapper__controlButtonSmall}`} onClick={() => setIsGalleryModalOpen({ open: true, generationId: generationStatus?.generation_id ?? 0 })}>
                                                <span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none">
                                                        <path fill="#fff" d="M1.75 8.332a.1253.1253 0 0 0-.125-.125.1253.1253 0 0 0-.125.125v2.1221a.1255.1255 0 0 0 .082.1172.13.13 0 0 0 .043.0078h2.121a.125.125 0 0 0 0-.25H2.5304a.2501.2501 0 0 1-.1768-.4268L4.878 7.378a.1255.1255 0 0 0 0-.1767.125.125 0 0 0-.1767 0L2.1768 9.7256a.2503.2503 0 0 1-.4268-.1768zm8.8281-6.7197a.126.126 0 0 0-.0332-.0723l-.0029-.0039-.0039-.0029a.126.126 0 0 0-.0752-.0332H8.332a.125.125 0 0 0-.125.125l.0098.0488a.125.125 0 0 0 .1152.0762h1.2158a.251.251 0 0 1 .2315.1543.25.25 0 0 1-.0547.2725L7.2012 4.7012a.125.125 0 1 0 .1767.1767l2.5235-2.5244a.25.25 0 0 1 .2724-.0537.249.249 0 0 1 .1543.2305V3.746a.125.125 0 1 0 .25 0zM2.25 8.9453l2.0977-2.0976a.625.625 0 0 1 .8838 0 .6254.6254 0 0 1 0 .8838L3.1337 9.829h.6123a.625.625 0 1 1 0 1.25H1.625a.63.63 0 0 1-.2129-.0371.626.626 0 0 1-.3681-.3584A.62.62 0 0 1 1 10.454V8.332a.6253.6253 0 0 1 .625-.625l.126.0126a.6256.6256 0 0 1 .499.6123zm8.8281-5.1992a.625.625 0 1 1-1.25 0v-.6123L7.7315 5.2314a.6249.6249 0 1 1-.8838-.8838L8.9443 2.25H8.332a.625.625 0 0 1 0-1.25h2.1211a.6.6 0 0 1 .0498.002l-.0009.001a.624.624 0 0 1 .375.162q.0092.0084.0185.0176l.0176.0186.0625.08a.626.626 0 0 1 .1025.3438z" />
                                                        <path fill="#fff" d="M1.75 8.332a.1253.1253 0 0 0-.125-.125.1253.1253 0 0 0-.125.125v2.1221a.1255.1255 0 0 0 .082.1172.13.13 0 0 0 .043.0078h2.121a.125.125 0 0 0 0-.25H2.5304a.2501.2501 0 0 1-.1768-.4268L4.878 7.378a.1255.1255 0 0 0 0-.1767.125.125 0 0 0-.1767 0L2.1768 9.7256a.2503.2503 0 0 1-.4268-.1768zm8.8281-6.7197a.126.126 0 0 0-.0332-.0723l-.0029-.0039-.0039-.0029a.126.126 0 0 0-.0752-.0332H8.332a.125.125 0 0 0-.125.125l.0098.0488a.125.125 0 0 0 .1152.0762h1.2158a.251.251 0 0 1 .2315.1543.25.25 0 0 1-.0547.2725L7.2012 4.7012a.125.125 0 1 0 .1767.1767l2.5235-2.5244a.25.25 0 0 1 .2724-.0537.249.249 0 0 1 .1543.2305V3.746a.125.125 0 1 0 .25 0z" />
                                                    </svg>
                                                </span>
                                                Открыть
                                            </button>
                                            <a
                                                className={`text_tertiary ${styles.resultWrapper__controlButtonSmall}`}
                                                href={apiAssetUrl(generationStatus.result)}
                                                download
                                            >
                                                <span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none">
                                                        <path fill="#fff" d="M3.573 9h.5226a1 1 0 0 1 .1973-.2799A.997.997 0 0 1 5 8.4273v-1c0-.5523.4477-1 1-1s1 .4477 1 1v1a.997.997 0 0 1 .7071.2928A1 1 0 0 1 7.9044 9h.2418c3.2281-.2663 2.9591-4.2607.269-4.2607C7.8772.2123 1.69 1.81 2.766 5.8045.614 6.6033 1.421 9 3.573 9" />
                                                        <path fill="#fff" d="M6.375 7.4273a.375.375 0 1 0-.75 0v2.0946l-.3598-.3598a.375.375 0 0 0-.5304.5303l1 1a.375.375 0 0 0 .5304 0l1-1a.375.375 0 0 0-.5304-.5303l-.3598.3598z" />
                                                    </svg>
                                                </span>
                                                Скачать
                                            </a>
                                            <button className={`text_tertiary ${styles.resultWrapper__controlButtonSmall}`} onClick={() => { onDelete(generationStatus?.generation_id ?? 0) }}>
                                                <span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="9" height="10" fill="none">
                                                        <path fill="#fff" fillRule="evenodd" d="M1.826 1.6032a.38.38 0 0 0-.094.025 69 69 0 0 0-1.286.1128l-.0808.008-.028.003H.3368a.375.375 0 0 0 .0766.746L.413 2.4944l.0003.0036.027-.0027.079-.0078a68 68 0 0 1 1.2978-.1136c.8026-.0624 1.7906-.1239 2.558-.1239.7672 0 1.7552.0615 2.5578.1239a68 68 0 0 1 1.2978.1136l.0791.0078.0266.0027a.375.375 0 1 0 .077-.746l-.0286-.003-.0808-.008a69 69 0 0 0-1.286-.1128.38.38 0 0 0-.082-.0232.719.719 0 0 1-.5495-.44l-.0452-.112A1.684 1.684 0 0 0 4.7801 0h-.6736a1.662 1.662 0 0 0-1.5406 1.0391.912.912 0 0 1-.726.5623zM4.1065.75a.912.912 0 0 0-.8452.57 1.7 1.7 0 0 1-.1055.2152C3.5804 1.5139 4.0012 1.5 4.375 1.5c.4149 0 .8876.0172 1.3592.0425a1.5 1.5 0 0 1-.043-.0965l-.0453-.112A.934.934 0 0 0 4.7802.75z" clipRule="evenodd" />
                                                        <path fill="#fff" d="M7.7486 3.4075a.375.375 0 0 0-.7472-.065l-.4026 4.63A1.125 1.125 0 0 1 5.4781 9H3.072a1.125 1.125 0 0 1-1.124-1.0761l-.1984-4.5652a.375.375 0 0 0-.7493.0326l.1985 4.5651C1.2425 8.9594 2.0682 9.75 3.072 9.75h2.406c.9725 0 1.7837-.7437 1.868-1.7126z" />
                                                        <path fill="#fff" d="M2.875 7.5a.375.375 0 1 0 0 .75h3a.375.375 0 1 0 0-.75z" />
                                                    </svg>
                                                </span>
                                                Удалить
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        }
                    </div>
                </div>
            )}
            {/* History block */}
            {hasActualHistory &&
                <div className={styles.resultWidget__history}>
                    <p className={`text_tertiary ${styles.resultWidget__blockTitle}`}>{historyBlockTitle}</p>
                    <div className={hasScroll ? `${styles.resultWidget__historyList} ${styles.resultWidget__historyList_scroll}` : styles.resultWidget__historyList} ref={historyContainerRef}>
                        {generationsHistory
                            ?.filter(
                                (g) =>
                                    g.result &&
                                    !(
                                        generationStatus?.task_status === 'waiting' &&
                                        g.generation_id === generationStatus?.generation_id
                                    )
                            )
                            .sort(
                                (a, b) =>
                                    new Date(b.created_at).getTime() -
                                    new Date(a.created_at).getTime()
                            )
                            .map((_) => (
                                <div className={styles.resultWrapper} key={_.generation_id}>
                                    {loadingKeys[_.result_thumbnail ?? _.reference_thumbnails?.[0] ?? _.result!] !== false && (
                                        <div className={styles.resultWrapper__spinnerWrapper}>
                                            <Spinner />
                                        </div>
                                    )}
                                    {generationType === 'image' ? (
                                        <img
                                            src={apiAssetUrl(_.result_thumbnail ?? _.result!)}
                                            alt="Result Image"
                                            className='checkerboard-bg'
                                            onLoadStart={() => handleMediaStart(_.result_thumbnail ?? _.result!)}
                                            onLoad={() => handleMediaLoad(_.result_thumbnail ?? _.result!)}
                                            onError={(e) => {
                                                if (_.result_thumbnail && _.result) {
                                                    (e.currentTarget as HTMLImageElement).src = apiAssetUrl(_.result);
                                                }
                                            }}
                                        />
                                    ) : (
                                        <img
                                            src={apiAssetUrl(_.reference_thumbnails?.[0] ?? '')}
                                            alt="Result Image"
                                            className='checkerboard-bg'
                                            onLoadStart={() => handleMediaStart(_.reference_thumbnails?.[0] ?? '')}
                                            onLoad={() => handleMediaLoad(_.reference_thumbnails?.[0] ?? '')}
                                            onError={(e) => {
                                                if (_.result_thumbnail && _.result) {
                                                    (e.currentTarget as HTMLImageElement).src = apiAssetUrl(_.result);
                                                }
                                            }}
                                        />
                                    )}
                                    <div className={styles.resultWrapper__controls}>
                                        <div className={styles.resultWrapper__controlsBox}>
                                            <div className={styles.resultWrapper__controlsGroup}>
                                                {generationType === 'image' && hasGoLiveButton &&
                                                    <button
                                                        className={`text_tertiary ${styles.resultWrapper__controlButtonSmall}`}
                                                        onClick={() => handleGoLiveButtonHandler({ id: apiAssetUrl(_.result_thumbnail ?? _.result!), url: apiAssetUrl(_.result_thumbnail ?? _.result!), generationId: _.generation_id ?? 0 })}
                                                    >
                                                        <span>
                                                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path fillRule="evenodd" clipRule="evenodd" d="M4.93202 7.44613C4.21304 7.91343 3.25 7.41095 3.25 6.56851V4.18159C3.25 3.33915 4.21304 2.83667 4.93202 3.30397L6.76823 4.49743C7.41059 4.91493 7.41059 5.83517 6.76823 6.25267L4.93202 7.44613ZM4 4.18159V6.56851C4 6.68126 4.05858 6.77627 4.16833 6.83354C4.27914 6.89136 4.40915 6.89147 4.5233 6.81728L6.35951 5.62383C6.54683 5.50208 6.54683 5.24802 6.35951 5.12627L4.5233 3.93282C4.40915 3.85863 4.27914 3.85874 4.16833 3.91656C4.05858 3.97383 4 4.06884 4 4.18159Z" fill="white" />
                                                                <path fillRule="evenodd" clipRule="evenodd" d="M3.19875 0.0570508C3.02312 -0.0527155 2.79177 0.000674397 2.682 0.176301C2.57223 0.351927 2.62562 0.583283 2.80125 0.69305L3.89245 1.37505H2C0.895431 1.37505 0 2.27048 0 3.37505V7.37505C0 8.47962 0.895431 9.37505 2 9.37505H8C9.10457 9.37505 10 8.47962 10 7.37505V3.37505C10 2.27048 9.10457 1.37505 8 1.37505H6.10755L7.19875 0.69305C7.37438 0.583283 7.42777 0.351927 7.318 0.176301C7.20823 0.000674397 6.97688 -0.0527155 6.80125 0.0570508L5 1.18283L3.19875 0.0570508ZM9.25 3.37505C9.25 2.68469 8.69036 2.12505 8 2.12505H2C1.30964 2.12505 0.75 2.68469 0.75 3.37505V7.37505C0.75 8.06541 1.30964 8.62505 2 8.62505H8C8.69036 8.62505 9.25 8.06541 9.25 7.37505V3.37505Z" fill="white" />
                                                            </svg>
                                                        </span>
                                                        Оживить
                                                    </button>
                                                }
                                            </div>
                                            {generationType === 'image' && hasEnhanceButton && !isTaskProcessing && <button className={`text_primary ${styles.resultWrapper__controlButton}`} onClick={() => enhanceButtonHandler(apiAssetUrl(_.result_thumbnail ?? _.result), _.generation_id)}>
                                                <span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="37" height="35" fill="none">
                                                        <path fill="#fff" d="M20.3236 10.3549c.1751-.4732.8444-.4732 1.0195 0l.2424.6551a.544.544 0 0 0 .3212.3212l.655.2424c.4733.1751.4733.8444 0 1.0195l-.655.2424a.544.544 0 0 0-.3212.3212l-.2424.655c-.1751.4733-.8444.4733-1.0195 0l-.2424-.655a.544.544 0 0 0-.3212-.3212l-.6551-.2424c-.4732-.1751-.4732-.8444 0-1.0195l.6551-.2424a.544.544 0 0 0 .3212-.3212z" />
                                                        <path fill="#fff" d="M17.2917 11.6667a.625.625 0 0 1 0 1.25h-4.125c-.9989 0-1.9167.8715-1.9167 2.0833v6.6667c0 .6754.2851 1.2451.7105 1.6172l1.6912-2.6827c.5405-.744 1.6643-.6942 2.1371.0946.5487.9153 1.9087.7996 2.2952-.1953l.8622-2.2192c.3721-.9578 1.6859-1.0592 2.2003-.1698l2.7562 5.1457c.4088-.3723.6806-.931.6806-1.5905v-2.7084a.6251.6251 0 0 1 1.25 0v2.7084c0 1.8409-1.4177 3.3333-3.1666 3.3333h-9.5C11.4178 25 10 23.5076 10 21.6667V15c0-1.8409 1.4178-3.3333 3.1667-3.3333z" />
                                                        <path fill="#fff" d="M14.5833 16.6667c.6904 0 1.25-.5597 1.25-1.25s-.5596-1.25-1.25-1.25-1.25.5596-1.25 1.25.5597 1.25 1.25 1.25m10.1951-3.7408c-.2101-.5679-1.0133-.5679-1.2235 0l-.2909.7861a.652.652 0 0 1-.3853.3854l-.7861.2909c-.5679.2101-.5679 1.0133 0 1.2234l.7861.2909a.652.652 0 0 1 .3853.3854l.2909.7861c.2102.5679 1.0134.5679 1.2235 0l.2909-.7861a.653.653 0 0 1 .3854-.3854l.7861-.2909c.5678-.2101.5678-1.0133 0-1.2234l-.7861-.2909a.653.653 0 0 1-.3854-.3854z" />
                                                    </svg>
                                                </span>
                                                Улучшить
                                            </button>}
                                            <div className={styles.resultWrapper__controlsGroup}>
                                                <button className={`text_tertiary ${styles.resultWrapper__controlButtonSmall}`} onClick={() => setIsGalleryModalOpen({ open: true, generationId: _.generation_id })}>
                                                    <span>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none">
                                                            <path fill="#fff" d="M1.75 8.332a.1253.1253 0 0 0-.125-.125.1253.1253 0 0 0-.125.125v2.1221a.1255.1255 0 0 0 .082.1172.13.13 0 0 0 .043.0078h2.121a.125.125 0 0 0 0-.25H2.5304a.2501.2501 0 0 1-.1768-.4268L4.878 7.378a.1255.1255 0 0 0 0-.1767.125.125 0 0 0-.1767 0L2.1768 9.7256a.2503.2503 0 0 1-.4268-.1768zm8.8281-6.7197a.126.126 0 0 0-.0332-.0723l-.0029-.0039-.0039-.0029a.126.126 0 0 0-.0752-.0332H8.332a.125.125 0 0 0-.125.125l.0098.0488a.125.125 0 0 0 .1152.0762h1.2158a.251.251 0 0 1 .2315.1543.25.25 0 0 1-.0547.2725L7.2012 4.7012a.125.125 0 1 0 .1767.1767l2.5235-2.5244a.25.25 0 0 1 .2724-.0537.249.249 0 0 1 .1543.2305V3.746a.125.125 0 1 0 .25 0zM2.25 8.9453l2.0977-2.0976a.625.625 0 0 1 .8838 0 .6254.6254 0 0 1 0 .8838L3.1337 9.829h.6123a.625.625 0 1 1 0 1.25H1.625a.63.63 0 0 1-.2129-.0371.626.626 0 0 1-.3681-.3584A.62.62 0 0 1 1 10.454V8.332a.6253.6253 0 0 1 .625-.625l.126.0126a.6256.6256 0 0 1 .499.6123zm8.8281-5.1992a.625.625 0 1 1-1.25 0v-.6123L7.7315 5.2314a.6249.6249 0 1 1-.8838-.8838L8.9443 2.25H8.332a.625.625 0 0 1 0-1.25h2.1211a.6.6 0 0 1 .0498.002l-.0009.001a.624.624 0 0 1 .375.162q.0092.0084.0185.0176l.0176.0186.0625.08a.626.626 0 0 1 .1025.3438z" />
                                                            <path fill="#fff" d="M1.75 8.332a.1253.1253 0 0 0-.125-.125.1253.1253 0 0 0-.125.125v2.1221a.1255.1255 0 0 0 .082.1172.13.13 0 0 0 .043.0078h2.121a.125.125 0 0 0 0-.25H2.5304a.2501.2501 0 0 1-.1768-.4268L4.878 7.378a.1255.1255 0 0 0 0-.1767.125.125 0 0 0-.1767 0L2.1768 9.7256a.2503.2503 0 0 1-.4268-.1768zm8.8281-6.7197a.126.126 0 0 0-.0332-.0723l-.0029-.0039-.0039-.0029a.126.126 0 0 0-.0752-.0332H8.332a.125.125 0 0 0-.125.125l.0098.0488a.125.125 0 0 0 .1152.0762h1.2158a.251.251 0 0 1 .2315.1543.25.25 0 0 1-.0547.2725L7.2012 4.7012a.125.125 0 1 0 .1767.1767l2.5235-2.5244a.25.25 0 0 1 .2724-.0537.249.249 0 0 1 .1543.2305V3.746a.125.125 0 1 0 .25 0z" />
                                                        </svg>
                                                    </span>
                                                    Открыть
                                                </button>
                                                <a
                                                    className={`text_tertiary ${styles.resultWrapper__controlButtonSmall}`}
                                                    href={apiAssetUrl(_.result)}
                                                    download
                                                >
                                                    <span>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none">
                                                            <path fill="#fff" d="M3.573 9h.5226a1 1 0 0 1 .1973-.2799A.997.997 0 0 1 5 8.4273v-1c0-.5523.4477-1 1-1s1 .4477 1 1v1a.997.997 0 0 1 .7071.2928A1 1 0 0 1 7.9044 9h.2418c3.2281-.2663 2.9591-4.2607.269-4.2607C7.8772.2123 1.69 1.81 2.766 5.8045.614 6.6033 1.421 9 3.573 9" />
                                                            <path fill="#fff" d="M6.375 7.4273a.375.375 0 1 0-.75 0v2.0946l-.3598-.3598a.375.375 0 0 0-.5304.5303l1 1a.375.375 0 0 0 .5304 0l1-1a.375.375 0 0 0-.5304-.5303l-.3598.3598z" />
                                                        </svg>
                                                    </span>
                                                    Скачать
                                                </a>
                                                <button className={`text_tertiary ${styles.resultWrapper__controlButtonSmall}`} onClick={() => onDelete(_.generation_id, true)}>
                                                    <span>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="9" height="10" fill="none">
                                                            <path fill="#fff" fillRule="evenodd" d="M1.826 1.6032a.38.38 0 0 0-.094.025 69 69 0 0 0-1.286.1128l-.0808.008-.028.003H.3368a.375.375 0 0 0 .0766.746L.413 2.4944l.0003.0036.027-.0027.079-.0078a68 68 0 0 1 1.2978-.1136c.8026-.0624 1.7906-.1239 2.558-.1239.7672 0 1.7552.0615 2.5578.1239a68 68 0 0 1 1.2978.1136l.0791.0078.0266.0027a.375.375 0 1 0 .077-.746l-.0286-.003-.0808-.008a69 69 0 0 0-1.286-.1128.38.38 0 0 0-.082-.0232.719.719 0 0 1-.5495-.44l-.0452-.112A1.684 1.684 0 0 0 4.7801 0h-.6736a1.662 1.662 0 0 0-1.5406 1.0391.912.912 0 0 1-.726.5623zM4.1065.75a.912.912 0 0 0-.8452.57 1.7 1.7 0 0 1-.1055.2152C3.5804 1.5139 4.0012 1.5 4.375 1.5c.4149 0 .8876.0172 1.3592.0425a1.5 1.5 0 0 1-.043-.0965l-.0453-.112A.934.934 0 0 0 4.7802.75z" clipRule="evenodd" />
                                                            <path fill="#fff" d="M7.7486 3.4075a.375.375 0 0 0-.7472-.065l-.4026 4.63A1.125 1.125 0 0 1 5.4781 9H3.072a1.125 1.125 0 0 1-1.124-1.0761l-.1984-4.5652a.375.375 0 0 0-.7493.0326l.1985 4.5651C1.2425 8.9594 2.0682 9.75 3.072 9.75h2.406c.9725 0 1.7837-.7437 1.868-1.7126z" />
                                                            <path fill="#fff" d="M2.875 7.5a.375.375 0 1 0 0 .75h3a.375.375 0 1 0 0-.75z" />
                                                        </svg>
                                                    </span>
                                                    Удалить
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            }
        </div>
    );
}