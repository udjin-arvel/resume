import { useState, useRef, useEffect, useMemo } from 'react';
import { Upload, App as AntdApp, Modal } from 'antd';
import styles from './PhotoEditorWidget.module.css'
import { Uploader, validateImageFile, API, apiAssetUrl, RadarAntdButton } from '@shared'
import { GenerationLoadingBlock, PhotoEditorKonvaCanvas, ChatInputBlock, GalleryModal, ResultBlock } from '@features';
import type { PhotoEditorKonvaCanvasHandle } from '@features';
import { photoEditorActions, imageGenerationActions } from '@entities';
import { useAppDispatch, useAppSelector, useReferenceFiles } from '@app';
import type { IGenerationReference } from '@entities';
import { useNavigate } from 'react-router';

export const PhotoEditorWidget = () => {
    const { message } = AntdApp.useApp();
    const navigate = useNavigate();
    const photoEditorState = useAppSelector((state) => state.photoEditor);
    const { mainImage, references, isGenerationInProgress, prompt } = photoEditorState;
    const [pollingInterval, setPollingInterval] = useState(0);
    const [isDrawModeOn, setIsDrawModeOn] = useState(false);
    const [errorModalMessage, setErrorModalMessage] = useState('');
    const [shouldRemoveBackground, setShouldRemoveBackground] = useState(false);
    const canvasWrapperRef = useRef<HTMLDivElement>(null);
    const canvasScreenshotRef = useRef<PhotoEditorKonvaCanvasHandle | null>(null);
    const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });
    const [isGalleryModalOpen, setIsGalleryModalOpen] = useState<{ open: boolean, generationId: number | null }>({ open: false, generationId: null });
    const { registerReferenceFile, unregisterReferenceFile, getReferenceFilesInOrder, getReferenceFile } = useReferenceFiles();
    const dispatch = useAppDispatch();
    const [editImage, { isLoading: isEditImageLoading, isSuccess: isEditImageSuccess, isError: isEditImageError, reset: resetEditImageQuery, error: editImageError }] = API.useEditImageMutation();
    const [closeTask] = API.useCloseTaskMutation();
    const { refetch: refetchUserData } = API.useGetUserDataQuery();
    const {
        data: generationsHistory,
        isLoading: isLoadingGenerationsHistory,
        fulfilledTimeStamp: generationsHistoryUpdatedAt,
        refetch: refetchGenerationsHistory
    } = API.useGetGenerationsHistoryQuery({ limit: 20, task_type: 'edit_image', generationSource: 'generate_image', editType: ['clear', 'mask'] });
    const { data: generationStatus } = API.useGetGenerationStatusQuery({ task_type: 'edit_image', edit_type: ['clear', 'mask'] }, { pollingInterval, skipPollingIfUnfocused: true, });
    const [deleteGeneration] = API.useDeleteGenerationMutation();
    const [markErrorAsRead] = API.useMarkErrorAsReadMutation();
    const [retryGeneration] = API.useRetryGenerationMutation();
    // --- constants
    const shouldShowResult = useMemo(() => {
        const { task_status, result } = generationStatus ?? {};
        if (isGenerationInProgress || isEditImageLoading || task_status === 'launched' || task_status === 'pending') {
            return true;
        }
        if (task_status === 'waiting' && result) {
            return true;
        }
        if (task_status === 'closed') {
            return false;
        }
        return false;
    }, [generationStatus, isGenerationInProgress, isEditImageLoading]);
    // --- handlers
    const handleRemoveImage = async (id: string | undefined, imageType: 'main' | 'reference') => {
        if (id) {
            unregisterReferenceFile(id);
        }
        if (imageType === 'main') {
            dispatch(photoEditorActions.removeMainImage())
        } else {
            dispatch(photoEditorActions.removeReference({ id: id ?? '' }))
        }
        if (generationStatus?.task_status === 'waiting' && generationStatus?.task_id) {
            await closeTask({ task_id: generationStatus.task_id });
        }
    }
    const handleCloseTask = async () => {
        if (generationStatus?.task_status === 'waiting' && generationStatus?.task_id) {
            closeTask({ task_id: generationStatus.task_id });
        }
    }
    const controlsHandler = (actionType: string) => {
        if (actionType === 'uploadReference') { }
        if (actionType === 'toggleDrawingMode') {
            setIsDrawModeOn(prev => {
                if (prev) {
                    return !prev;
                } else {
                    setShouldRemoveBackground(false);
                    return !prev;
                }
            })
        }
        if (actionType === 'shouldRemoveBackground') {
            setShouldRemoveBackground(prev => {
                if (prev) {
                    return !prev;
                } else {
                    setIsDrawModeOn(false);
                    return !prev;
                }
            })
        }
    }
    const handleDelete = (generationId: number, isHistoryDelete: boolean = false) => {
        if (isHistoryDelete) {
            deleteGeneration({ generation_id: generationId });
            return;
        }
        closeTask({ task_id: generationStatus?.task_id });
        references?.forEach((r) => unregisterReferenceFile(r.id));
        dispatch(photoEditorActions.removeAllReferences());
        dispatch(photoEditorActions.setPrompt(''));
        deleteGeneration({ generation_id: generationId });
    }
    const handleCaptureCanvas = async () => {
        const screenshotBlob = await canvasScreenshotRef.current?.captureOriginalBlob();
        if (!screenshotBlob) {
            message.error('Не удалось сделать скриншот');
            return;
        }
        return screenshotBlob;
    }
    const handleUndoDrawing = async () => {
        await canvasScreenshotRef.current?.undo();
    }
    const handleRedoDrawing = async () => {
        await canvasScreenshotRef.current?.redo();
    }
    const handleClearDrawing = async () => {
        await canvasScreenshotRef.current?.clearDrawing();
    }
    const handleSubmit = async () => {
        if (!mainImage) {
            message.error('Загрузите исходное изображение');
            return;
        }
        if (mainImage && !prompt && !shouldRemoveBackground && !isDrawModeOn) {
            message.error('Укажите промпт или выберите опции редактирования');
            return;
        }
        const mainFile = getReferenceFile(mainImage?.id ?? '');
        const files = getReferenceFilesInOrder(references?.map((ref) => ref.id) ?? []);
        let stageFile = null;
        if (isDrawModeOn) {
            stageFile = await handleCaptureCanvas();
        }

        const allFiles = [stageFile, mainFile, ...files].filter((file): file is Blob => file instanceof Blob);
        if (allFiles.length === 0) {
            message.error('Не удалось собрать файлы для отправки');
            return;
        }
        const formData = new FormData();
        allFiles.forEach((file) => {
            formData.append('images', file);
        });
        formData.append('edit_type', shouldRemoveBackground ? 'clear' : 'mask');
        formData.append('prompt', prompt);
        await editImage(formData);
    }
    const handleResetError = (taskId: number) => {
        setErrorModalMessage('');
        markErrorAsRead({ task_id: taskId });
        references?.forEach((r) => unregisterReferenceFile(r.id));
        dispatch(photoEditorActions.removeAllReferences());
        dispatch(photoEditorActions.setPrompt(''));
    }
    const handleRetryGeneration = (taskId: number) => {
        retryGeneration({ task_id: taskId });
        markErrorAsRead({ task_id: taskId });
        dispatch(photoEditorActions.setIsGenerationInProgress(true));
        setErrorModalMessage('');
    }
    const handleEnhanceButton = (url: string, generationId: number) => {
        dispatch(imageGenerationActions.replaceAllReferences([{ id: url, url, generationId }]))
        dispatch(imageGenerationActions.setIsEnchanceModeActive(true));
        setIsGalleryModalOpen({ open: false, generationId: null });
        navigate('/image-generation');
    }
    // effects
    useEffect(function startOfTheGenerationStatusHandler() {
        if (isEditImageSuccess) {
            resetEditImageQuery();
        }
        if (isEditImageError) {
            message.error((editImageError as any).data?.detail ?? 'Не удалось запустить генерацию изображения')
        }
    }, [isEditImageSuccess, isEditImageError])

    useEffect(function uiBlocker() {
        let timeout: ReturnType<typeof setTimeout> | null = null;
        if (isEditImageLoading || generationStatus?.task_status === 'launched' || generationStatus?.task_status === 'pending') {
            dispatch(photoEditorActions.setIsGenerationInProgress(true));
        } else {
            timeout = setTimeout(() => dispatch(photoEditorActions.setIsGenerationInProgress(false)), 1000);
        }
        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }
        }
    }, [isEditImageLoading, generationStatus?.task_status])

    useEffect(function togglePolling() {
        if (generationStatus && (generationStatus?.task_status === 'launched' || generationStatus?.task_status === 'pending')) {
            setPollingInterval(3000);
        }
        if (generationStatus && (generationStatus?.task_status === 'closed' || generationStatus?.task_status === 'waiting') && generationStatus?.result) {
            setPollingInterval(0);
            refetchGenerationsHistory();
            refetchUserData();
            references?.forEach((r) => unregisterReferenceFile(r.id));
            dispatch(photoEditorActions.removeAllReferences());
            dispatch(photoEditorActions.setPrompt(''));
        }
        if (generationStatus && generationStatus?.task_status === 'error') {
            setPollingInterval(0);
            refetchUserData();
            dispatch(photoEditorActions.setIsGenerationInProgress(false));
            if (generationStatus.error_unread) {
                setErrorModalMessage(generationStatus?.error_message || 'Во время генерации изображения возникла ошибка. Пожалуйста, обратитесь в поддержку.');

            }
        }
    }, [generationStatus]);

    useEffect(function invokeReferencesFromStatus() {
        if (references?.length === 0 && (generationStatus?.task_status === 'launched' || generationStatus?.task_status === 'pending')) {
            let currGen = generationStatus?.generations?.find((g) => g.id === generationStatus.generation_id);
            if (!currGen) {
                currGen = generationStatus?.generations?.[0];
            }
            if (currGen) {
                dispatch(photoEditorActions.invokeReferencesFromStatus(
                    {
                        references: currGen?.reference_thumbnails?.map((r) => ({ id: apiAssetUrl(r), url: apiAssetUrl(r), generationId: generationStatus.generation_id })).filter((r) => r !== undefined) as IGenerationReference[],
                        prompt: currGen?.prompt ?? '',
                    }
                ));
            }
        }
        return () => {
            handleCloseTask()
        }
    }, [generationStatus]);
    return (
        <>
            <div className={styles.photoEditorWidget}>
                {!mainImage &&
                    <div className={styles.widget__uploaderWrapper}>
                        <Uploader
                            radarSize="large"
                            style={{ width: '100%' }}
                            accept='.jpg,.jpeg,.JPEG,.JPG,.png,.webp'
                            fileList={[]}
                            title='Загрузите изображение'
                            subtitle='Или перетащите файл'
                            beforeUpload={async (file) => {
                                try {
                                    await validateImageFile(file);
                                    const url = URL.createObjectURL(file);
                                    registerReferenceFile(url, file);
                                    dispatch(photoEditorActions.addMainImage({ id: url, url }));
                                    return false;
                                } catch (err) {
                                    message.error(err instanceof Error ? err.message : 'Ошибка валидации файла');
                                    return Upload.LIST_IGNORE;
                                }
                            }}
                            customRequest={({ onSuccess }) => onSuccess?.('ok')}
                        />
                    </div>
                }
                {/* result */}
                {mainImage &&
                    <div className={styles.widget__result} style={{ marginTop: 20 }}>
                        <div className={styles.widget__resultItem}>
                            <div className={styles.widget__resultImageWrapper} ref={canvasWrapperRef}>
                                {!isGenerationInProgress &&
                                    <button className={styles.widget__removeButton} onClick={() => handleRemoveImage(mainImage.id, 'main')}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none">
                                            <path fill="#fff" d="M2.1468.3683c-.4911-.491-1.2874-.491-1.7785 0s-.491 1.2874 0 1.7785L4.2216 6 .3683 9.8532c-.491.4912-.491 1.2874 0 1.7785s1.2874.4911 1.7785 0L6 7.7784l3.8532 3.8533c.4911.4911 1.2874.4911 1.7785 0s.4911-1.2873 0-1.7785L7.7784 6l3.8533-3.8532c.4911-.4911.4911-1.2874 0-1.7785s-1.2874-.491-1.7785 0L6 4.2216z" />
                                        </svg>
                                    </button>}
                                {/* <img src={apiAssetUrl(mainImage?.url)} alt="Image 1" /> */}
                                <PhotoEditorKonvaCanvas
                                    mainImageUrl={apiAssetUrl(mainImage?.url)}
                                    canvasWrapperRef={canvasWrapperRef}
                                    isDrawModeOn={isDrawModeOn}
                                    canvasHandleRef={canvasScreenshotRef}
                                    onHistoryChange={setHistoryState}
                                />
                            </div>
                            {!shouldShowResult && isDrawModeOn && <div className={styles.widget__historyControls}>
                                <button
                                    className={styles.widget__historyButton}
                                    onClick={handleClearDrawing}
                                    title="Очистить маску"
                                >
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M2.1468.3683c-.4911-.491-1.2874-.491-1.7785 0s-.491 1.2874 0 1.7785L4.2216 6 .3683 9.8532c-.491.4912-.491 1.2874 0 1.7785s1.2874.4911 1.7785 0L6 7.7784l3.8532 3.8533c.4911.4911 1.2874.4911 1.7785 0s.4911-1.2873 0-1.7785L7.7784 6l3.8533-3.8532c.4911-.4911.4911-1.2874 0-1.7785s-1.2874-.491-1.7785 0L6 4.2216z" fill="currentColor" />
                                    </svg>
                                </button>
                                <div className={styles.widget__historyCenter}>
                                    <button
                                        className={styles.widget__historyButton}
                                        onClick={handleUndoDrawing}
                                        disabled={!historyState.canUndo}
                                        title="Отменить"
                                    >
                                        <svg width="16" height="13" viewBox="0 0 16 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M3.56694 1.06694C3.81102 0.822863 3.81102 0.427135 3.56694 0.183058C3.32286 -0.0610197 2.92713 -0.0610191 2.68306 0.183059L0.183058 2.68307C0.165016 2.70111 0.148191 2.72014 0.132636 2.74003C0.0603825 2.83232 0.013511 2.94543 0.00252444 3.06887C0.000848544 3.08746 0 3.10619 0 3.12501C0 3.26077 0.0441708 3.39198 0.124554 3.49942C0.142316 3.52316 0.161846 3.54574 0.183059 3.56695L2.68306 6.06694C2.92714 6.31102 3.32287 6.31102 3.56694 6.06694C3.81102 5.82286 3.81102 5.42713 3.56694 5.18306L2.13388 3.75H6.45833C10.2553 3.75 13.3333 6.82804 13.3333 10.625C13.3333 10.9702 13.6132 11.25 13.9583 11.25C14.3035 11.25 14.5833 10.9702 14.5833 10.625C14.5833 6.13769 10.9456 2.5 6.45833 2.5H2.13389L3.56694 1.06694Z" fill="currentColor" />
                                        </svg>
                                    </button>
                                    <button
                                        className={styles.widget__historyButton}
                                        onClick={handleRedoDrawing}
                                        disabled={!historyState.canRedo}
                                        title="Повторить"
                                    >
                                        <svg width="16" height="13" viewBox="0 0 16 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M11.0163 1.06694C10.7722 0.822863 10.7722 0.427135 11.0163 0.183058C11.2604 -0.0610197 11.6561 -0.0610191 11.9002 0.183059L14.3957 2.67862C14.5115 2.79205 14.5833 2.95014 14.5833 3.125C14.5833 3.29949 14.5118 3.45728 14.3965 3.57067L11.9002 6.06694C11.6561 6.31102 11.2604 6.31102 11.0163 6.06694C10.7722 5.82286 10.7722 5.42713 11.0163 5.18306L12.4494 3.75H8.125C4.32805 3.75 1.25 6.82804 1.25 10.625C1.25 10.9702 0.970177 11.25 0.624999 11.25C0.279821 11.25 0 10.9702 0 10.625C0 6.13769 3.63769 2.5 8.125 2.5H12.4494L11.0163 1.06694Z" fill="currentColor" />
                                        </svg>
                                    </button>
                                </div>
                            </div>}
                            {shouldShowResult && <p className="text_secondary">Исходное изображение</p>}
                        </div>
                        {shouldShowResult &&
                            <div className={styles.widget__resultItem}>
                                <div className={`${styles.widget__resultImageWrapper}`}>
                                    {/* {!isGenerationInProgress &&
                                    <button className={styles.widget__removeButton} onClick={() => handleCloseTask()}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none">
                                            <path fill="#fff" d="M2.1468.3683c-.4911-.491-1.2874-.491-1.7785 0s-.491 1.2874 0 1.7785L4.2216 6 .3683 9.8532c-.491.4912-.491 1.2874 0 1.7785s1.2874.4911 1.7785 0L6 7.7784l3.8532 3.8533c.4911.4911 1.2874.4911 1.7785 0s.4911-1.2873 0-1.7785L7.7784 6l3.8533-3.8532c.4911-.4911.4911-1.2874 0-1.7785s-1.2874-.491-1.7785 0L6 4.2216z" />
                                        </svg>
                                    </button>} */}
                                    {/* loading block */}
                                    {(isEditImageLoading || isGenerationInProgress) &&
                                        <GenerationLoadingBlock title='Редактируем' style={{ maxWidth: '100%' }} />
                                    }
                                    {/* result image */}
                                    {!isEditImageLoading && !isGenerationInProgress && generationStatus?.result &&
                                        <>
                                            <img src={apiAssetUrl(generationStatus?.result ?? '')} alt="Image 2" className='checkerboard-bg' />
                                            <div className={styles.resultWrapper__controls}>
                                                <div className={styles.resultWrapper__controlsBox}>
                                                    <button className={`text_primary ${styles.resultWrapper__controlButton}`} onClick={() => setIsGalleryModalOpen({ open: true, generationId: generationStatus?.generation_id ?? null })}>
                                                        <span>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none">
                                                                <rect width="32" height="32" fill="#fff" fillOpacity=".15" rx="8" />
                                                                <path fill="#fff" d="M9.6004 20.1312a.2005.2005 0 0 0-.2-.2.2005.2005 0 0 0-.2.2v3.3953a.2.2 0 0 0 .0578.1406.203.203 0 0 0 .1422.0594h3.3937a.2.2 0 1 0 0-.4h-1.9453a.4.4 0 0 1-.3687-.2469.4.4 0 0 1 .0859-.4359l4.0391-4.0391a.201.201 0 0 0 0-.2828.2.2 0 0 0-.2828 0l-4.0391 4.039a.401.401 0 0 1-.436.086.4.4 0 0 1-.2468-.3688zm14.125-10.7516a.203.203 0 0 0-.0531-.1156l-.0047-.0063-.0063-.0047a.2.2 0 0 0-.1203-.053h-3.4094a.2.2 0 0 0-.2.2l.0157.0781a.2.2 0 0 0 .1843.1219h1.9454a.401.401 0 0 1 .3703.2469.401.401 0 0 1-.0875.4359l-4.0375 4.0391a.2.2 0 1 0 .2828.2828l4.0375-4.0391a.4.4 0 0 1 .4359-.0859.399.399 0 0 1 .2469.3687v1.9454a.2.2 0 0 0 .4 0zm-13.325 11.7328 3.3562-3.3562c.3906-.3904 1.0236-.3905 1.4141 0 .39.3905.3902 1.0236 0 1.414l-3.3562 3.3563h.9796c.5523 0 1 .4477 1 1-.0003.552-.4479 1-1 1H9.4004a1 1 0 0 1-.3406-.0594 1 1 0 0 1-.3672-.2344 1 1 0 0 1-.2219-.339 1 1 0 0 1-.0703-.3672v-3.3953c.0003-.5521.448-1 1-1l.2016.0203c.4555.0931.7981.4966.7984.9797zm14.125-8.3187c0 .5522-.4477 1-1 1-.5521-.0003-1-.4479-1-1v-.9797l-3.3547 3.3562c-.3904.3904-1.0235.3901-1.4141 0-.3905-.3905-.3905-1.0235 0-1.414l3.3547-3.3563h-.9797c-.5522 0-1-.4477-1-1s.4478-1 1-1h3.3938c.0263 0 .0536.001.0797.0031l-.0016.0016c.216.0169.4294.1021.6.2594.0097.0089.0199.0183.0297.028l.0281.0298.1.1281a1 1 0 0 1 .1641.55z" />
                                                                <path fill="#fff" d="M9.6004 20.1312a.2005.2005 0 0 0-.2-.2.2005.2005 0 0 0-.2.2v3.3953a.2.2 0 0 0 .0578.1406.203.203 0 0 0 .1422.0594h3.3937a.2.2 0 1 0 0-.4h-1.9453a.4.4 0 0 1-.3687-.2469.4.4 0 0 1 .0859-.4359l4.0391-4.0391a.201.201 0 0 0 0-.2828.2.2 0 0 0-.2828 0l-4.0391 4.039a.401.401 0 0 1-.436.086.4.4 0 0 1-.2468-.3688zm14.125-10.7516a.203.203 0 0 0-.0531-.1156l-.0047-.0063-.0063-.0047a.2.2 0 0 0-.1203-.053h-3.4094a.2.2 0 0 0-.2.2l.0157.0781a.2.2 0 0 0 .1843.1219h1.9454a.401.401 0 0 1 .3703.2469.401.401 0 0 1-.0875.4359l-4.0375 4.0391a.2.2 0 1 0 .2828.2828l4.0375-4.0391a.4.4 0 0 1 .4359-.0859.399.399 0 0 1 .2469.3687v1.9454a.2.2 0 0 0 .4 0z" />
                                                            </svg>
                                                        </span>
                                                        Открыть
                                                    </button>
                                                    <div className={styles.resultWrapper__controlsGroup}>
                                                        <a
                                                            className={`text_tertiary ${styles.resultWrapper__controlButtonSmall}`}
                                                            href={apiAssetUrl(generationStatus?.result)}
                                                            download
                                                        >
                                                            <span>
                                                                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                    <rect width="32" height="32" rx="8" fill="white" fillOpacity="0.15" />
                                                                    <path d="M12.9165 20.7999H13.7525C13.829 20.6379 13.9343 20.486 14.0682 20.3521C14.3807 20.0397 14.7901 19.8834 15.1996 19.8834V18.2834C15.1996 17.3998 15.916 16.6834 16.7996 16.6834C17.6833 16.6834 18.3996 17.3998 18.3996 18.2834V19.8834C18.8091 19.8834 19.2186 20.0397 19.531 20.3521C19.6649 20.486 19.7702 20.6379 19.8467 20.7999H20.2335C25.3984 20.3738 24.968 13.9827 20.6639 13.9827C19.8031 6.73946 9.90363 9.2959 11.6253 15.687C8.18193 16.9652 9.47314 20.7999 12.9165 20.7999Z" fill="white" />
                                                                    <path d="M17.3996 18.2834C17.3996 17.9521 17.131 17.6834 16.7996 17.6834C16.4682 17.6834 16.1996 17.9521 16.1996 18.2834V21.6349L15.6239 21.0592C15.3896 20.8249 15.0097 20.8249 14.7753 21.0592C14.541 21.2935 14.541 21.6734 14.7753 21.9077L16.3753 23.5077C16.6097 23.742 16.9896 23.742 17.2239 23.5077L18.8239 21.9077C19.0582 21.6734 19.0582 21.2935 18.8239 21.0592C18.5896 20.8249 18.2097 20.8249 17.9753 21.0592L17.3996 21.6349V18.2834Z" fill="white" />
                                                                </svg>

                                                            </span>
                                                            Скачать
                                                        </a>
                                                        <button className={`text_tertiary ${styles.resultWrapper__controlButtonSmall}`} onClick={() => handleDelete(generationStatus?.generation_id ?? 0, true)}>
                                                            <span>
                                                                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                    <rect width="32" height="32" rx="8" fill="white" fillOpacity="0.15" />
                                                                    <path fillRule="evenodd" clipRule="evenodd" d="M11.9235 10.7651C11.8706 10.7721 11.8203 10.7857 11.7732 10.8051C11.144 10.8543 10.592 10.9031 10.1944 10.94C9.99108 10.9589 9.82805 10.9746 9.71567 10.9856L9.58635 10.9985L9.54158 11.003L9.54072 11.0031C9.21108 11.0369 8.97129 11.3316 9.00514 11.6612C9.03898 11.9909 9.33365 12.2307 9.66328 12.1968L9.6627 12.1911C9.66329 12.1968 9.66328 12.1968 9.66328 12.1968L9.70637 12.1925L9.83291 12.1799C9.94336 12.1691 10.1042 12.1535 10.3052 12.1349C10.7074 12.0976 11.2695 12.0479 11.9094 11.9981C13.1935 11.8984 14.7743 11.8 16.002 11.8C17.2297 11.8 18.8105 11.8984 20.0946 11.9981C20.7345 12.0479 21.2966 12.0976 21.6988 12.1349C21.8998 12.1535 22.0606 12.1691 22.1711 12.1799L22.2976 12.1925L22.3402 12.1968C22.6698 12.2306 22.965 11.9909 22.9989 11.6612C23.0327 11.3316 22.7929 11.0369 22.4633 11.0031L22.4176 10.9985L22.2883 10.9856C22.176 10.9746 22.0129 10.9589 21.8096 10.94C21.412 10.9031 20.8599 10.8543 20.2307 10.8051C20.1894 10.7881 20.1456 10.7755 20.0997 10.768C19.7039 10.7027 19.3707 10.4359 19.2204 10.0639L19.1481 9.88487C18.7367 8.86658 17.7483 8.19995 16.6501 8.19995H15.5723C14.4886 8.19995 13.5133 8.85775 13.1074 9.86255C12.9105 10.3497 12.4668 10.6934 11.9459 10.7622L11.9235 10.7651ZM15.5723 9.39995C14.9777 9.39995 14.4427 9.76084 14.22 10.3121C14.1716 10.4318 14.1151 10.5467 14.0512 10.6563C14.7306 10.6223 15.4039 10.6 16.002 10.6C16.6658 10.6 17.4222 10.6274 18.1767 10.6679C18.152 10.6175 18.129 10.566 18.1078 10.5135L18.0355 10.3344C17.8073 9.76967 17.2592 9.39995 16.6501 9.39995H15.5723Z" fill="white" />
                                                                    <path d="M21.3997 13.6519C21.4285 13.3218 21.1841 13.0309 20.854 13.0022C20.5239 12.9735 20.233 13.2178 20.2043 13.548L19.5601 20.9559C19.4792 21.886 18.7005 22.6 17.7669 22.6H13.9173C12.9536 22.6 12.1609 21.8409 12.119 20.8781L11.8014 13.5739C11.787 13.2428 11.507 12.9861 11.1759 13.0005C10.8449 13.0149 10.5882 13.295 10.6026 13.626L10.9201 20.9303C10.9899 22.5349 12.3111 23.8 13.9173 23.8H17.7669C19.323 23.8 20.6208 22.6101 20.7556 21.0598L21.3997 13.6519Z" fill="white" />
                                                                    <path d="M13.602 20.2C13.2706 20.2 13.002 20.4686 13.002 20.8C13.002 21.1313 13.2706 21.4 13.602 21.4H18.402C18.7334 21.4 19.002 21.1313 19.002 20.8C19.002 20.4686 18.7334 20.2 18.402 20.2H13.602Z" fill="white" />
                                                                </svg>

                                                            </span>
                                                            Удалить
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    }
                                </div>
                                <p className="text_secondary">Результат редактирования</p>
                            </div>
                        }
                    </div>
                }
            </div>
            <div className={styles.widget__chatInputBlockWrapper}>
                <ChatInputBlock
                    onSubmit={handleSubmit}
                    isLoading={isEditImageLoading}
                    controlsHandler={controlsHandler}
                    isDrawModeOn={isDrawModeOn}
                    shouldRemoveBackground={shouldRemoveBackground}
                />
            </div>
            <div className={styles.widget__resultBlockWrapper}>
                <ResultBlock
                    isLoading={isGenerationInProgress || isEditImageLoading || isLoadingGenerationsHistory}
                    generationStatus={generationStatus}
                    setIsGalleryModalOpen={setIsGalleryModalOpen}
                    onDelete={handleDelete}
                    generationType={'image'}
                    references={references ?? []}
                    generationsHistory={generationsHistory}
                    generationsHistoryUpdatedAt={generationsHistoryUpdatedAt}
                    refetchGenerationsHistory={refetchGenerationsHistory}
                    hasCurrentGenerationBlock={false}
                    customEnhanceButtonHandler={handleEnhanceButton}
                    isOnImageGenetationPage={false}
                    historyBlockTitle='История редактирования'
                />
            </div>
            {/* DEV ---- save canvas screenshot, open gallery modal */}
            {/* <button onClick={
             const screenshotBlob = await handleCaptureCanvas();
        if (!screenshotBlob) return;
        const screenshotUrl = URL.createObjectURL(screenshotBlob);
        const link = document.createElement('a');
        link.href = screenshotUrl;
        link.download = `photo-editor-capture-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(screenshotUrl);
        message.success('Скриншот сохранен');
            }>Capture</button> */}
            {/* <button onClick={() => setIsGalleryModalOpen({ open: true, generationId: 0 })}>Open</button> */}
            <GalleryModal
                galleryModalState={isGalleryModalOpen}
                onClose={() => setIsGalleryModalOpen({ open: false, generationId: null })}
                generationType={'image'}
                onDeleteGenerated={handleDelete}
                references={references ?? []}
                generationStatus={generationStatus}
                hasGoLiveButton={true}
                hasEnhanceButton={true}
                hasDownloadButton={true}
                hasAiModelInfo={false}
                generationSource='generate_image'
                editType={['clear', 'mask']}
                customEnhanceButtonHandler={handleEnhanceButton}
            />
            <Modal
                open={errorModalMessage ? true : false}
                onCancel={() => {
                    if (generationStatus?.task_id) {
                        handleResetError(generationStatus.task_id);
                    }
                }}
                footer={
                    <div className={styles.errorModalFooter}>
                        <RadarAntdButton.Error
                            color='danger'
                            style={{ fontWeight: 600 }}
                            key="ok"
                            onClick={() => {
                                if (generationStatus?.task_id) {
                                    handleResetError(generationStatus.task_id);
                                }
                            }}
                        >
                            Сбросить
                        </RadarAntdButton.Error>
                        <RadarAntdButton
                            key="retry"
                            style={{ fontWeight: 600 }}
                            onClick={() => {
                                if (generationStatus?.task_id) {
                                    handleRetryGeneration(generationStatus.task_id);
                                }
                            }
                            }>
                            Повторить
                        </RadarAntdButton>
                    </div>
                }
                title="Ошибка"
            >
                {errorModalMessage}
            </Modal>
        </>
    )
}