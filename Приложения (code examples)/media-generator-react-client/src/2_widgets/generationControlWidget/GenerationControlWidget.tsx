import { useEffect, useState } from 'react'
import styles from './GenerationControlWidget.module.css'
import { ResultBlock, PromptBlock, GalleryModal } from '@features'
import { API, apiAssetUrl, RadarAntdButton } from '@shared'
import { message, Modal } from 'antd'
import { useAppSelector, useReferenceFiles } from '@app'
import type { TGenerationType } from '@/5_shared/models/models'
import { imageGenerationActions, videoGenerationActions, type IGenerationReference } from '@entities'
import { useAppDispatch } from '@app'


interface IGenerationControlWidgetProps {
    generationType: 'image' | 'video'
}

export const GenerationControlWidget: React.FC<IGenerationControlWidgetProps> = ({ generationType }) => {
    //vars
    const task_type: TGenerationType = generationType === 'image' ? 'edit_image' : generationType === 'video' ? 'video_preview' : null;
    const dispatch = useAppDispatch();
    // local states
    const [pollingInterval, setPollingInterval] = useState(0); // in milliseconds for status request polling
    const [isGalleryModalOpen, setIsGalleryModalOpen] = useState<{ open: boolean, generationId: number | null }>({ open: false, generationId: null });
    const [errorModalMessage, setErrorModalMessage] = useState('');
    const { getReferenceFilesInOrder, unregisterReferenceFile } = useReferenceFiles();
    // global states
    const imageGenerationState = useAppSelector(state => state.imageGeneration);
    const videoGenerationState = useAppSelector(state => state.videoGeneration);
    const prompt =
        generationType === 'image' ? imageGenerationState.prompt : videoGenerationState.prompt;
    const references =
        generationType === 'image' ? imageGenerationState.references : videoGenerationState.references;
    // API
    const { data: userData, refetch: refetchUserData } = API.useGetUserDataQuery();
    const [createImages, { isLoading: isImagesLoading, isSuccess: isImagesSuccess, isError: isImagesError, reset: resetImagesQuery, error: createImagesError }] = API.useCreateImagesMutation();
    const [createVideo, { isLoading: isVideoLoading, isSuccess: isVideoSuccess, isError: isVideoError, reset: resetVideoQuery, error: createVideoError }] = API.useCreateVideoMutation();
    const [closeTask] = API.useCloseTaskMutation();
    const { data: generationStatus } = API.useGetGenerationStatusQuery({ task_type, source: 'generation' }, { pollingInterval, skipPollingIfUnfocused: true, });
    const { data: generationsHistory, refetch: refetchGenerationsHistory } = API.useGetGenerationsHistoryQuery({ limit: 20, task_type, generationSource: 'generation' });
    const [retryGeneration] = API.useRetryGenerationMutation();
    const [deleteGeneration] = API.useDeleteGenerationMutation();
    const [markErrorAsRead] = API.useMarkErrorAsReadMutation();
    // handlers
    const handleSubmit = async () => { // start of the generation
        if (!prompt) {
            message.error('Укажите промпт');
            return;
        }
        let generationId = references.find((r) => r.generationId)?.generationId;
        const files = getReferenceFilesInOrder(references.map((r) => r.id));
        if (generationType === 'video') {
            if (files.length === 0 && !generationId) {
                message.error('Добавьте хотя бы одно изображение');
                return;
            }
            const { quality, length, dimensions, hasSound, modelType, needToEnchance } = videoGenerationState;
            if (userData && userData.tokens && modelType && modelType.tokens_per_request && userData.tokens < modelType.tokens_per_request) {
                message.error(`Недостаточно токенов для генерации!`);
                return;
            }
            dispatch(videoGenerationActions.setIsGenerationInProgress(true));
            const formData = new FormData();
            if (files.length > 0 && files[0]) {
                formData.append('image', files[0]);
            }
            formData.append('message', prompt);
            formData.append('ai_model', modelType?.id ?? '');
            formData.append('improve_prompt', needToEnchance.toString());
            formData.append('generation_id', generationId?.toString() ?? '');

            const options: Record<string, unknown> = {};
            if (quality) options.resolution = quality;
            if (length != null) options.duration = length;
            if (dimensions) options.aspect_ratio = dimensions;
            if (modelType?.audio_toggle_param) {
                options[modelType.audio_toggle_param] = Boolean(hasSound);
            }
            if (Object.keys(options).length > 0) {
                formData.append('options', JSON.stringify(options));
            }
            createVideo(formData)
            return;
        }
        if (generationType === 'image') {
            if (files.length === 0 && !generationId) {
                message.error('Добавьте хотя бы одно изображение');
                return;
            }
            const { dimensions, modelType, needToEnchance, selectedSample } = imageGenerationState;
            if (userData && userData.tokens && modelType && modelType.tokens_per_request && userData.tokens < modelType.tokens_per_request) {
                message.error(`Недостаточно токенов для генерации!`);
                return;
            }
            dispatch(imageGenerationActions.setIsGenerationInProgress(true));
            const formData = new FormData();
            files.forEach((file) => formData.append('images', file));
            formData.append('message', prompt);
            formData.append('generation_id', generationId?.toString() ?? '');
            formData.append('ai_model', modelType?.id ?? '');
            formData.append('improve_prompt', needToEnchance.toString());
            if (selectedSample?.id) {
                formData.append('sample_id', selectedSample.id.toString());
            }
            const options: Record<string, unknown> = {};
            if (dimensions) options.aspect_ratio = dimensions;
            if (Object.keys(options).length > 0) {
                formData.append('options', JSON.stringify(options));
            }
            createImages(formData)
        }

    }
    const handleDelete = (generation_id: number, isHistoryDelete: boolean = false) => { // delete generated image
        if (isHistoryDelete) {
            deleteGeneration({ generation_id });
            return;
        }
        closeTask({ task_id: generationStatus?.task_id });
        references.forEach((r) => unregisterReferenceFile(r.id));
        if (generationType === 'image') {
            dispatch(imageGenerationActions.resetState());
        }
        if (generationType === 'video') {
            dispatch(videoGenerationActions.resetState());
        }
        deleteGeneration({ generation_id });
    }
    const handleRetryGeneration = (taskId: number) => {
            retryGeneration({ task_id: taskId });
            markErrorAsRead({ task_id: taskId });
            if (generationType === 'image') {
                dispatch(imageGenerationActions.setIsGenerationInProgress(true));
            }
            if (generationType === 'video') {
                dispatch(videoGenerationActions.setIsGenerationInProgress(true));
            }
            setErrorModalMessage('');
    }
    const handleResetError = (taskId: number) => {
        setErrorModalMessage('');
        markErrorAsRead({ task_id: taskId });
        if (generationType === 'image') {
            references.forEach((r) => unregisterReferenceFile(r.id));
            dispatch(imageGenerationActions.setImageGenerationSettings({ key: 'references', value: [] }));
            dispatch(imageGenerationActions.setPrompt(''));
        }
        if (generationType === 'video') {
            references.forEach((r) => unregisterReferenceFile(r.id));
            dispatch(videoGenerationActions.setVideoGenerationSettings({ key: 'references', value: [] }));
            dispatch(videoGenerationActions.setPrompt(''));
        }
    }
    // effects
    useEffect(function startOfTheGenerationStatusHandler() {
        if (isImagesSuccess || isVideoSuccess) {
            resetImagesQuery();
            resetVideoQuery();
        }
        if (isImagesError) {
            message.error((createImagesError as any).data?.detail ?? 'Не удалось запустить генерацию изображения')
        }
        if (isVideoError) {
            message.error((createVideoError as any).data?.detail ?? 'Не удалось запустить генерацию видео')
        }
    }, [isImagesSuccess, isVideoSuccess, isImagesError, isVideoError])

    useEffect(function uiBlocker() {
        let timeout: ReturnType<typeof setTimeout> | null = null;
        if (isImagesLoading || isVideoLoading || generationStatus?.task_status === 'launched' || generationStatus?.task_status === 'pending') {
            if (generationType === 'image') {
                dispatch(imageGenerationActions.setIsGenerationInProgress(true));
            }
            if (generationType === 'video') {
                dispatch(videoGenerationActions.setIsGenerationInProgress(true));
            }
        } else {
            if (generationType === 'image') {
                timeout = setTimeout(() => dispatch(imageGenerationActions.setIsGenerationInProgress(false)), 1000);
            }
            if (generationType === 'video') {
                timeout = setTimeout(() => dispatch(videoGenerationActions.setIsGenerationInProgress(false)), 1000);
            }
        }
        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }
        }
    }, [isImagesLoading, isVideoLoading, generationStatus?.task_status])

    useEffect(function togglePolling() {
        if (generationStatus && (generationStatus?.task_status === 'launched' || generationStatus?.task_status === 'pending')) {
            setPollingInterval(3000);
        }
        if (generationStatus && (generationStatus?.task_status === 'closed' || generationStatus?.task_status === 'waiting') && generationStatus?.result) {
            setPollingInterval(0);
            refetchGenerationsHistory();
            refetchUserData();
            if (generationType === 'image' && !imageGenerationState.isEnchanceModeActive) {
                references.forEach((r) => unregisterReferenceFile(r.id));
                dispatch(imageGenerationActions.setImageGenerationSettings({ key: 'references', value: [] }));
                dispatch(imageGenerationActions.setPrompt(''));
                dispatch(imageGenerationActions.setSelectedSample(null));
                dispatch(imageGenerationActions.setIsEnchanceModeActive(false));
            }
            if (generationType === 'video' && !videoGenerationState.isGoLiveModeActive) {
                references.forEach((r) => unregisterReferenceFile(r.id));
                dispatch(videoGenerationActions.setVideoGenerationSettings({ key: 'references', value: [] }));
                dispatch(videoGenerationActions.setPrompt(''));
            } else {
                dispatch(videoGenerationActions.setIsGoLiveModeActive(false));
            }
        }
        if (generationStatus && generationStatus?.task_status === 'error') {
            setPollingInterval(0);
            refetchUserData();
            if (generationType === 'image') {
                dispatch(imageGenerationActions.setIsGenerationInProgress(false));
            }
            if (generationType === 'video') {
                dispatch(videoGenerationActions.setIsGenerationInProgress(false));
            }
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
            if (generationType === 'image' && currGen) {
                dispatch(imageGenerationActions.invokeReferencesFromStatus(
                    {
                        references: currGen?.reference_thumbnails?.map((r) => ({ id: apiAssetUrl(r), url: apiAssetUrl(r), generationId: generationStatus.generation_id })).filter((r) => r !== undefined) as IGenerationReference[],
                        prompt: currGen?.prompt ?? '',
                    }
                ));
                dispatch(imageGenerationActions.setSelectedSample(currGen?.sample ?? null));
                dispatch(imageGenerationActions.setSelectedSampleGender(currGen?.sample?.gender ?? 'female'));
            }
            if (generationType === 'video' && currGen) {
                dispatch(videoGenerationActions.invokeReferencesFromStatus(
                    {
                        references: currGen?.reference_thumbnails?.map((r) => ({ id: apiAssetUrl(r), url: apiAssetUrl(r), generationId: generationStatus.generation_id })).filter((r) => r !== undefined) as IGenerationReference[],
                        prompt: currGen?.prompt ?? '',
                    }
                ));
            }
        }
    }, [generationStatus]);
    return (
        <div className={styles.widget}>
            {/* <button onClick={() => setIsGalleryModalOpen(true)}>Open</button> */}
            <PromptBlock
                onSubmit={handleSubmit}
                isLoading={isImagesLoading || isVideoLoading}
                additionalButtonAnimationProps={generationStatus?.task_status === 'launched' || generationStatus?.task_status === 'pending'}
                generationType={generationType}
            />
            <ResultBlock
                isLoading={generationStatus?.task_status === 'launched' || generationStatus?.task_status === 'pending'}
                generationStatus={generationStatus}
                setIsGalleryModalOpen={setIsGalleryModalOpen}
                onDelete={handleDelete}
                generationType={generationType}
                references={references}
                generationsHistory={generationsHistory}
                refetchGenerationsHistory={refetchGenerationsHistory}
            />
            <GalleryModal
                galleryModalState={isGalleryModalOpen}
                onClose={() => setIsGalleryModalOpen({ open: false, generationId: null })}
                generationType={generationType}
                onDeleteGenerated={handleDelete}
                references={references}
                generationStatus={generationStatus}
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
        </div>
    )
}