import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import styles from './ImageUpscalerGalleryModal.module.css'
import { API, apiAssetUrl, Spinner } from '@shared';
import type { IGenerationStatusResponse } from '@shared/models/models';
import { Splitter } from 'antd';

interface IGalleryModalWidgetProps {
    open: boolean;
    onClose: () => void;
    onDeleteGenerated: (generation_id: number, isHistoryDelete?: boolean) => void;
    generationStatus?: IGenerationStatusResponse;
}

export const ImageUpscalerGalleryModal: React.FC<IGalleryModalWidgetProps> = ({
    open,
    onClose,
    onDeleteGenerated,
    generationStatus,
}) => {
    // global states

    const { data: generationsHistory, refetch: refetchGenerationsHistory } = API.useGetGenerationsHistoryQuery({ limit: 20, task_type: 'improve_quality', generationSource: 'generation' });
    const [selectedItemIndex, setSelectedItemIndex] = useState(0);
    const [loadingKeys, setLoadingKeys] = useState<Record<string, boolean>>({})
    const historyListRef = useRef<HTMLDivElement>(null);
    const handleMediaLoad = (key: string) => setLoadingKeys((prev) => ({ ...prev, [key]: false }))
    const handleMediaStart = (key: string) => setLoadingKeys((prev) => ({ ...prev, [key]: true }))
    const currentlySelectedGeneration = useMemo(() => {
        return generationsHistory?.find(generation => generation.generation_id === selectedItemIndex);
    }, [generationsHistory, selectedItemIndex]);

    const navRef = useRef({ selectedItemIndex, generationsHistory });
    useEffect(() => {
        navRef.current = { selectedItemIndex, generationsHistory };
    });

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

    const getSortedGenerationsWithResult = useCallback(() => {
        return (generationsHistory ?? [])
            .filter(g => g.result)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [generationsHistory]);

    const handleDeleteSelectedGeneration = useCallback(() => {
        const current = generationsHistory?.find(g => g.generation_id === selectedItemIndex);
        if (!current?.result) return;
        const id = current.generation_id;
        const remaining = getSortedGenerationsWithResult().filter(g => g.generation_id !== id);
        const nextId = remaining[0]?.generation_id;
        if (nextId !== undefined) {
            setSelectedItemIndex(nextId);
        }
        onDeleteGenerated(id, generationStatus?.generation_id !== id);
    }, [selectedItemIndex, generationsHistory, getSortedGenerationsWithResult, generationStatus?.generation_id, onDeleteGenerated]);

    const handleDeleteSelectedGenerationRef = useRef(handleDeleteSelectedGeneration);
    handleDeleteSelectedGenerationRef.current = handleDeleteSelectedGeneration;

    useEffect(() => {
        if (!open) return;
        scrollFooterToSelectedItem();
    }, [open, scrollFooterToSelectedItem, generationsHistory]);

    const handleDownloadResult = () => {
        const result = currentlySelectedGeneration?.result;
        if (!result) return;
        const url = apiAssetUrl(result);
        const a = document.createElement('a');
        a.href = url;
        a.download = '';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

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
            const { selectedItemIndex: gid, generationsHistory: history } = navRef.current;
            const result = history?.find((g) => g.generation_id === gid)?.result;
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
    }

    useEffect(() => {
        if (generationsHistory) {
            setSelectedItemIndex(generationsHistory[0].generation_id);
        }
    }, [generationsHistory]);


    useEffect(() => {
        if (open) {
            refetchGenerationsHistory();
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', onKeyPressHandler);
        } else {
            document.body.style.overflow = 'auto';
            window.removeEventListener('keydown', onKeyPressHandler);
        }

        return () => {
            window.removeEventListener('keydown', onKeyPressHandler);
            document.body.style.overflow = 'auto';
        }
    }, [open, onClose, onDeleteGenerated, generationStatus?.generation_id]);

    return createPortal(
        <div
            className={styles.galleryModalWidget__backdrop}
            style={{ display: open ? 'flex' : 'none' }}
            id="backdrop"
            onClick={(e) => {
                if ((e.target as HTMLElement).id === 'backdrop') {
                    onClose();
                }
            }}
        >
            <div className={styles.galleryModalWidget} data-open={open}>
                <div className={styles.galleryModalWidget__content}>
                    <button className={`${styles.galleryModalWidget__controllButton} ${styles.galleryModalWidget__controllButton_topRight}`} onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none">
                            <path fill="currentColor" d="M1.789.307C1.3797-.1024.7162-.1024.307.307s-.4093 1.0727 0 1.482L3.518 5 .307 8.211c-.4093.4093-.4093 1.0728 0 1.482s1.0727.4093 1.482 0L5 6.482l3.211 3.211c.4093.4093 1.0728.4093 1.482 0s.4093-1.0727 0-1.482L6.482 5l3.211-3.211c.4093-.4093.4093-1.0728 0-1.482s-1.0727-.4093-1.482 0L5 3.518z" />
                        </svg>
                    </button>
                    <div className={styles.galleryModalWidget__contentWrapper}>
                        {generationsHistory && generationsHistory.length > 0 &&
                            <Splitter
                            >
                                <Splitter.Panel defaultSize="50%" min="20%" max="80%">
                                    <div
                                        className={styles.galleryModalWidget__mediaWrapper}
                                        style={{ paddingRight: '8px' }}
                                    >
                                        {loadingKeys[currentlySelectedGeneration?.reference?.[0] ?? ''] !== false && (
                                            <div className={styles.galleryModalWidget__spinnerWrapper}>
                                                <Spinner style={{ width: 20, height: 20 }} />
                                            </div>
                                        )}
                                        <img
                                            key={currentlySelectedGeneration?.generation_id}
                                            src={apiAssetUrl(currentlySelectedGeneration?.reference?.[0] ?? '')}
                                            alt="Image"
                                            onLoadStart={(e) => {
                                                (e.target as HTMLImageElement).classList.remove('checkerboard-bg');
                                                handleMediaStart(currentlySelectedGeneration?.reference?.[0] ?? '')
                                            }}
                                            onLoad={(e) => {
                                                (e.target as HTMLImageElement).classList.add('checkerboard-bg');
                                                handleMediaLoad(currentlySelectedGeneration?.reference?.[0] ?? '');
                                            }}
                                        />
                                    </div>
                                </Splitter.Panel>
                                <Splitter.Panel>
                                    <div
                                        className={styles.galleryModalWidget__mediaWrapper}
                                        style={{ paddingLeft: '8px' }}
                                    >
                                        <div className={styles.galleryModalWidget__dButtonsWrapper}>
                                            <button
                                                type="button"
                                                className={`${styles.galleryModalWidget__dButton}`}
                                                style={{
                                                    opacity: currentlySelectedGeneration?.result ? 1 : 0.45,
                                                    pointerEvents: currentlySelectedGeneration?.result ? 'auto' : 'none',
                                                }}
                                                disabled={!currentlySelectedGeneration?.result}
                                                onClick={handleDownloadResult}
                                            >
                                                <div>
                                                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M3.3169 11.2H4.1529C4.22942 11.038 4.33466 10.8862 4.46863 10.7522C4.78105 10.4398 5.19052 10.2836 5.6 10.2836V8.68359C5.6 7.79994 6.31634 7.08359 7.2 7.08359C8.08366 7.08359 8.8 7.79994 8.8 8.68359V10.2836C9.20948 10.2836 9.61895 10.4398 9.93137 10.7522C10.0653 10.8862 10.1706 11.038 10.2471 11.2H10.6339C15.7988 10.7739 15.3684 4.38285 11.0643 4.38284C10.2035 -2.86039 0.304023 -0.303954 2.02567 6.08713C-1.41768 7.36535 -0.126472 11.2 3.3169 11.2Z" fill="currentColor" />
                                                        <path d="M7.8 8.68359C7.8 8.35222 7.53137 8.08359 7.2 8.08359C6.86863 8.08359 6.6 8.35222 6.6 8.68359V12.0351L6.02426 11.4593C5.78995 11.225 5.41005 11.225 5.17574 11.4593C4.94142 11.6936 4.94142 12.0735 5.17574 12.3079L6.77574 13.9079C7.01005 14.1422 7.38995 14.1422 7.62426 13.9079L9.22427 12.3079C9.45858 12.0735 9.45858 11.6936 9.22427 11.4593C8.98995 11.225 8.61005 11.225 8.37574 11.4593L7.8 12.0351V8.68359Z" fill="currentColor" />
                                                    </svg>
                                                </div>
                                                Скачать
                                            </button>
                                            <button
                                                type="button"
                                                className={`${styles.galleryModalWidget__dButton}`}
                                                style={{
                                                    opacity: currentlySelectedGeneration?.result ? 1 : 0.45,
                                                }}
                                                disabled={!currentlySelectedGeneration?.result}
                                                onClick={handleDeleteSelectedGeneration}
                                            >
                                                <div>
                                                    <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path fillRule="evenodd" clipRule="evenodd" d="M2.92153 2.56516C2.86867 2.57214 2.81834 2.58579 2.77126 2.60517C2.14208 2.65432 1.59002 2.7032 1.19248 2.74006C0.989131 2.75892 0.826095 2.77465 0.713715 2.78568L0.584399 2.79852L0.539628 2.80305L0.538764 2.80314C0.209126 2.83698 -0.030661 3.13165 0.00318468 3.46128C0.0370304 3.79092 0.331692 4.03071 0.66133 3.99686L0.660742 3.99112C0.661333 3.99686 0.66133 3.99686 0.66133 3.99686L0.70442 3.9925L0.830953 3.97994C0.941406 3.9691 1.10229 3.95358 1.3033 3.93494C1.7054 3.89765 2.26757 3.84792 2.90744 3.7982C4.19155 3.69842 5.77234 3.6 7.00005 3.6C8.22775 3.6 9.80855 3.69842 11.0927 3.7982C11.7325 3.84792 12.2947 3.89765 12.6968 3.93494C12.8978 3.95358 13.0587 3.9691 13.1691 3.97994L13.2957 3.9925L13.3382 3.9968C13.6679 4.03065 13.9631 3.79092 13.9969 3.46128C14.0308 3.13165 13.791 2.83698 13.4613 2.80314L13.4157 2.79852L13.2864 2.78568C13.174 2.77465 13.011 2.75892 12.8076 2.74006C12.4101 2.7032 11.858 2.65432 11.2288 2.60517C11.1875 2.58819 11.1437 2.57558 11.0977 2.568C10.7019 2.5027 10.3688 2.23592 10.2185 1.86399L10.1461 1.68492C9.7347 0.666633 8.74636 0 7.6481 0H6.57035C5.48663 0 4.51139 0.657802 4.10541 1.6626C3.90856 2.14979 3.46489 2.49344 2.94395 2.5622L2.92153 2.56516ZM6.57035 1.2C5.97579 1.2 5.44075 1.56089 5.21802 2.11214C5.16967 2.23181 5.11315 2.34673 5.04921 2.45631C5.72863 2.4223 6.40195 2.4 7.00005 2.4C7.66381 2.4 8.42021 2.42746 9.17479 2.46792C9.15008 2.41753 9.12708 2.36604 9.10586 2.31353L9.03351 2.13446C8.80533 1.56972 8.2572 1.2 7.6481 1.2H6.57035Z" fill="currentColor" />
                                                        <path d="M12.3978 5.45198C12.4265 5.12185 12.1822 4.83096 11.852 4.80226C11.5219 4.77355 11.231 5.0179 11.2023 5.34802L10.5581 12.7559C10.4773 13.6861 9.69858 14.4 8.7649 14.4H4.91536C3.95165 14.4 3.15892 13.641 3.11706 12.6782L2.79948 5.37394C2.78509 5.04288 2.50504 4.78617 2.17398 4.80057C1.84293 4.81496 1.58622 5.095 1.60061 5.42606L1.91819 12.7303C1.98796 14.335 3.30918 15.6 4.91536 15.6H8.7649C10.321 15.6 11.6188 14.4102 11.7536 12.8599L12.3978 5.45198Z" fill="currentColor" />
                                                        <path d="M4.60005 12C4.26868 12 4.00005 12.2686 4.00005 12.6C4.00005 12.9314 4.26868 13.2 4.60005 13.2H9.40005C9.73142 13.2 10 12.9314 10 12.6C10 12.2686 9.73142 12 9.40005 12H4.60005Z" fill="currentColor" />
                                                    </svg>
                                                </div>
                                                Удалить
                                            </button>
                                        </div>
                                        {loadingKeys[currentlySelectedGeneration?.result ?? ''] !== false && (
                                            <div className={styles.galleryModalWidget__spinnerWrapper}>
                                                <Spinner style={{ width: 20, height: 20 }} />
                                            </div>
                                        )}
                                        <img
                                            key={currentlySelectedGeneration?.generation_id}
                                            src={apiAssetUrl(currentlySelectedGeneration?.result ?? '')}
                                            alt="Image"
                                            onLoadStart={(e) => {
                                                (e.target as HTMLImageElement).classList.remove('checkerboard-bg');
                                                handleMediaStart(currentlySelectedGeneration?.result ?? '')
                                            }}
                                            onLoad={(e) => {
                                                (e.target as HTMLImageElement).classList.add('checkerboard-bg');
                                                handleMediaLoad(currentlySelectedGeneration?.result ?? '');
                                            }}
                                        />
                                    </div>
                                </Splitter.Panel>
                            </Splitter>}
                    </div>
                    <div className={styles.galleryModalWidget__controllButtons}>
                        <button className={`${styles.galleryModalWidget__controllButton}`} onClick={() => leftAndRightNavigation('left')}>
                            &larr;
                        </button>
                        <button className={`${styles.galleryModalWidget__controllButton}`} onClick={() => leftAndRightNavigation('right')}>
                            &rarr;
                        </button>
                    </div>
                </div>
                <div className={styles.galleryModalWidget__footer} ref={historyListRef}>
                    {generationsHistory?.filter((_) => _.result).sort(
                        (a, b) =>
                            new Date(b.created_at).getTime() -
                            new Date(a.created_at).getTime()
                    ).map((_) => {
                        return (
                            <div className={`${styles.galleryModalWidget__footerItem} ${_.generation_id === selectedItemIndex ? styles.galleryModalWidget__footerItem_active : ''}`} key={_.generation_id} onClick={() => setSelectedItemIndex(_.generation_id)}>
                                {loadingKeys[_.reference_thumbnails?.[0] ?? ''] !== false && (
                                    <div className={styles.galleryModalWidget__spinnerWrapper}>
                                        <Spinner style={{ width: 20, height: 20 }} />
                                    </div>
                                )}
                                <img
                                    src={apiAssetUrl(_.reference_thumbnails?.[0] ?? '')}
                                    alt={`Сегенрированное изображение номер ${_.generation_id}`}
                                    onLoadStart={() => handleMediaStart(_.reference_thumbnails?.[0] ?? '')}
                                    onLoad={() => handleMediaLoad(_.reference_thumbnails?.[0] ?? '')}
                                />
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>,
        document.body
    )
}
