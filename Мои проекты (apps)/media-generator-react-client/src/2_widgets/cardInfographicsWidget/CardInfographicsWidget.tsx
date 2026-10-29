import { useState, useEffect, useMemo } from 'react';
import { App as AntdApp, Modal } from 'antd';
import styles from './CardInfographicsWidget.module.css'
import { API, DEFAULT_IMAGE_PROCESSING_MODEL_ID, RadarAntdButton } from '@shared'
import { ChatInputBlockCardInfographics, GalleryModal, ResultBlock } from '@features';
import { cardInfographicsActions } from '@entities';
import { useAppDispatch, useAppSelector, useReferenceFiles } from '@app';
// import type { IGenerationReference } from '@entities';

export const CardInfographicsWidget = () => {
    const { message } = AntdApp.useApp();
    const cardInfographicsState = useAppSelector((state) => state.cardInfographics);
    const { productImage, infographicsImage, isGenerationInProgress, productPrompt, infographicsPrompt, dimensions, needToEnchance } = cardInfographicsState;
    const [pollingInterval, setPollingInterval] = useState(0);
    const [errorModalMessage, setErrorModalMessage] = useState('');
    const [isGalleryModalOpen, setIsGalleryModalOpen] = useState<{ open: boolean, generationId: number | null }>({ open: false, generationId: null });
    const { unregisterReferenceFile, getReferenceFile } = useReferenceFiles();
    const dispatch = useAppDispatch();
    const [editImage, { isLoading: isEditImageLoading, isSuccess: isEditImageSuccess, isError: isEditImageError, reset: resetEditImageQuery, error: editImageError }] = API.useEditImageMutation();
    const [closeTask] = API.useCloseTaskMutation();
    const { refetch: refetchUserData } = API.useGetUserDataQuery();
    const { data: generationsHistory, refetch: refetchGenerationsHistory } = API.useGetGenerationsHistoryQuery({ limit: 20, task_type: 'edit_image,text_image', generationSource: 'generate_image', editType: ['infographics'] });
    const { data: generationStatus } = API.useGetGenerationStatusQuery({ task_type: 'edit_image,text_image', source: 'generate_image', edit_type: ['infographics'] }, { pollingInterval, skipPollingIfUnfocused: true, });
    const [deleteGeneration] = API.useDeleteGenerationMutation();
    const [markErrorAsRead] = API.useMarkErrorAsReadMutation();
    const [retryGeneration] = API.useRetryGenerationMutation();
    const { data: modelTypes } = API.useGetModelsListQuery();
    const { images: imagesModels } = modelTypes ?? {};
    const modelType = useMemo(() => {
        const defaultModel = imagesModels?.find(model => model.id === DEFAULT_IMAGE_PROCESSING_MODEL_ID);
        if (defaultModel) {
            return defaultModel;
        } else {
            return imagesModels?.filter(model => model.task_type === 'edit_image')?.[0] ?? null;
        }
    }, [modelTypes]);
    const generationPrice = useMemo(() => {
        if (modelType) {
            let price = modelType?.tokens_per_request ?? 0;
            if (needToEnchance) {
                price += modelType?.tokens_per_improvement ?? 0;
            }
            return price;
        }
        return 0;
    }, [modelType, needToEnchance]);
    // --- handlers
    const handleDelete = (generation_id: number, isHistoryDelete: boolean = false) => { // delete generated image
        if (isHistoryDelete) {
            deleteGeneration({ generation_id });
            return;
        }
        closeTask({ task_id: generationStatus?.task_id });
        unregisterReferenceFile(productImage?.id ?? '');
        unregisterReferenceFile(infographicsImage?.id ?? '');
        dispatch(cardInfographicsActions.removeAllImages());
        dispatch(cardInfographicsActions.resetAllPrompts());
        deleteGeneration({ generation_id });
    }
    const handleSubmit = async () => {
        if (!productImage) {
            message.error('Загрузите фото товара');
            return;
        }
        if (!infographicsImage && !infographicsPrompt) {
            message.error('Загрузите рефренс инфографики или укажите промпт');
            return;
        }
        const productFile = getReferenceFile(productImage?.id ?? '');
        const infographicsFile = getReferenceFile(infographicsImage?.id ?? '');
        const allFiles = [productFile, infographicsFile ?? undefined]
        const formData = new FormData();
        allFiles.forEach((file) => {
            if (file) {
                formData.append('images', file as any);
            }
        });
        formData.append('prompt', JSON.stringify([productPrompt, infographicsPrompt ?? '']));
        formData.append('edit_type', 'infographics');
        formData.append('improve_prompt', needToEnchance.toString());
        formData.append('options', JSON.stringify({ aspect_ratio: dimensions }));
        await editImage(formData);
    }
    const handleResetError = (taskId: number) => {
        setErrorModalMessage('');
        markErrorAsRead({ task_id: taskId });
        unregisterReferenceFile(productImage?.id ?? '');
        unregisterReferenceFile(infographicsImage?.id ?? '');
        dispatch(cardInfographicsActions.removeAllImages());
        dispatch(cardInfographicsActions.resetAllPrompts());
    }
    const handleRetryGeneration = (taskId: number) => {
        retryGeneration({ task_id: taskId });
        markErrorAsRead({ task_id: taskId });
        dispatch(cardInfographicsActions.setIsGenerationInProgress(true));
        setErrorModalMessage('');
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
            dispatch(cardInfographicsActions.setIsGenerationInProgress(true));
        } else {
            timeout = setTimeout(() => dispatch(cardInfographicsActions.setIsGenerationInProgress(false)), 1000);
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
            unregisterReferenceFile(productImage?.id ?? '');
            unregisterReferenceFile(infographicsImage?.id ?? '');
            dispatch(cardInfographicsActions.removeAllImages());
            dispatch(cardInfographicsActions.resetAllPrompts());
        }
        if (generationStatus && generationStatus?.task_status === 'error') {
            setPollingInterval(0);
            refetchUserData();
            dispatch(cardInfographicsActions.setIsGenerationInProgress(false));
            if (generationStatus.error_unread) {
                setErrorModalMessage(generationStatus?.error_message || 'Во время генерации изображения возникла ошибка. Пожалуйста, обратитесь в поддержку.');

            }
        }
    }, [generationStatus]);

    useEffect(function invokeReferencesFromStatus() {
        const invokeRefsFunc = async () => {
            if (!productImage && !infographicsImage && !productPrompt && !infographicsPrompt && (generationStatus?.task_status === 'launched' || generationStatus?.task_status === 'pending')) {
                let currGen = generationStatus?.generations?.find((g) => g.id === generationStatus.generation_id);
                if (!currGen) {
                    currGen = generationStatus?.generations?.[0];
                }
                if (currGen) {
                    const rawPrompt = currGen.prompt;
                    const parsedPrompt = await JSON.parse(rawPrompt ?? '[]');
                    const productPrompt = parsedPrompt && Array.isArray(parsedPrompt) ? parsedPrompt[0] : '';
                    const infographicsPrompt = parsedPrompt && Array.isArray(parsedPrompt) ? parsedPrompt[1] : '';
                    const productImage = currGen?.reference_thumbnails?.[0] ? { id: currGen?.reference_thumbnails?.[0], url: currGen?.reference_thumbnails?.[0] } : null;
                    const infographicsImage = currGen?.reference_thumbnails?.[1] ? { id: currGen?.reference_thumbnails?.[1], url: currGen?.reference_thumbnails?.[1] } : null;
                    dispatch(cardInfographicsActions.invokeReferencesFromStatus(
                        {
                            productImage,
                            infographicsImage,
                            productPrompt,
                            infographicsPrompt,
                        }
                    ));
                }
            }
        }
        invokeRefsFunc();

    }, [generationStatus]);
    return (
        <>
            <div className={styles.cardInfographicsWidget}>
                <div className={styles.widget__promptBlock}>
                    <ChatInputBlockCardInfographics
                        isLoading={isEditImageLoading || isGenerationInProgress}
                        label="Описание товара"
                        placeholder="Опишите cвой товар"
                        typeKey="product"
                        uploadButtonLabel="Загрузить фото товара"
                        uploadButtonIcon={
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4.18612 5.83333C4.18612 6.20152 3.88764 6.5 3.51945 6.5C3.15126 6.5 2.85278 6.20152 2.85278 5.83333C2.85278 5.46514 3.15126 5.16667 3.51945 5.16667C3.88764 5.16667 4.18612 5.46514 4.18612 5.83333Z" fill="currentColor" />
                                <path d="M8.85278 6.5C9.22097 6.5 9.51945 6.20152 9.51945 5.83333C9.51945 5.46514 9.22097 5.16667 8.85278 5.16667C8.48459 5.16667 8.18612 5.46514 8.18612 5.83333C8.18612 6.20152 8.48459 6.5 8.85278 6.5Z" fill="currentColor" />
                                <path fillRule="evenodd" clipRule="evenodd" d="M3.01978 3.18508C3.01956 3.17897 3.01945 3.17283 3.01945 3.16667C3.01945 1.41777 4.43721 0 6.18612 0C7.93502 0 9.35278 1.41777 9.35278 3.16667C9.35278 3.17283 9.35267 3.17898 9.35245 3.18509C10.517 3.32242 11.4717 4.2138 11.6686 5.39494L12.3353 9.39494C12.6062 11.0204 11.3527 12.5 9.70487 12.5H2.66733C1.01949 12.5 -0.23396 11.0204 0.0369428 9.39494L0.70361 5.39494C0.900468 4.21379 1.85522 3.3224 3.01978 3.18508ZM4.01945 3.16667C4.01945 1.97005 4.9895 1 6.18612 1C7.38273 1 8.35278 1.97005 8.35278 3.16667H4.01945ZM1.02334 9.55934L1.69 5.55934C1.82394 4.75569 2.51926 4.16667 3.33399 4.16667H9.03821C9.85294 4.16667 10.5483 4.75569 10.6822 5.55934L11.3489 9.55934C11.5182 10.5752 10.7348 11.5 9.70487 11.5H2.66733C1.63743 11.5 0.854022 10.5752 1.02334 9.55934Z" fill="currentColor" />
                            </svg>
                        }
                    />
                    <ChatInputBlockCardInfographics
                        isLoading={isEditImageLoading || isGenerationInProgress}
                        label="Промпт для инфографики"
                        placeholder="Опишите стиль, фон, цвета карточки"
                        typeKey="infographics"
                    />
                    <div className={styles.widget__promptBlockFooter}>
                        <RadarAntdButton
                            shineAnimation={!isGenerationInProgress && productImage && (infographicsImage || infographicsPrompt) ? true : false}
                            onClick={handleSubmit}
                            loading={isEditImageLoading}
                            disabled={isGenerationInProgress || !productImage || (!infographicsImage && !infographicsPrompt)}
                        >
                            <span style={{ fontWeight: 700 }}>
                                {generationPrice > 0 ? `Создать инфографику за ${generationPrice} ` : 'Создать инфографику'}
                                {generationPrice > 0 && <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M4.48939 5.67406C4.32128 5.21976 3.67872 5.21976 3.51061 5.67406L3.27791 6.30294C3.22505 6.44577 3.11244 6.55839 2.96961 6.61124L2.34073 6.84394C1.88642 7.01205 1.88642 7.65461 2.34073 7.82272L2.96961 8.05543C3.11244 8.10828 3.22505 8.2209 3.27791 8.36373L3.51061 8.9926C3.67872 9.44691 4.32128 9.44691 4.48939 8.99261L4.7221 8.36373C4.77495 8.2209 4.88756 8.10828 5.03039 8.05543L5.65927 7.82272C6.11358 7.65461 6.11358 7.01205 5.65927 6.84394L5.03039 6.61124C4.88756 6.55839 4.77495 6.44577 4.7221 6.30294L4.48939 5.67406ZM4 7.04286C3.91675 7.15235 3.81902 7.25009 3.70953 7.33333C3.81902 7.41658 3.91675 7.51431 4 7.62381C4.08325 7.51431 4.18098 7.41658 4.29047 7.33333C4.18098 7.25009 4.08325 7.15235 4 7.04286Z" fill="currentColor" />
                                    <path fillRule="evenodd" clipRule="evenodd" d="M7.94471 7.99991C7.95386 7.99997 7.96302 8 7.97219 8C10.1967 8 12 6.20914 12 4C12 1.79086 10.1967 0 7.97219 0C5.97641 0 4.31966 1.44152 4.00006 3.33333C4.00004 3.33333 4.00008 3.33333 4.00006 3.33333C1.79092 3.33333 0 5.12419 0 7.33333C0 9.54247 1.79086 11.3333 4 11.3333C5.98203 11.3333 7.62736 9.89176 7.94471 7.99991ZM7.98631 6.99997C9.64819 6.99242 10.993 5.65218 10.993 4C10.993 2.34315 9.64056 1 7.97219 1C6.48966 1 5.25656 2.06058 5.00024 3.45941C6.62143 3.87679 7.84481 5.28499 7.98631 6.99997ZM4 10.3333C5.65685 10.3333 7 8.99019 7 7.33333C7 5.67648 5.65685 4.33333 4 4.33333C2.34315 4.33333 1 5.67648 1 7.33333C1 8.99019 2.34315 10.3333 4 10.3333Z" fill="currentColor" />
                                </svg>}
                            </span>
                        </RadarAntdButton>
                    </div>
                </div>
                <ResultBlock
                    isLoading={isEditImageLoading || isGenerationInProgress}
                    setIsGalleryModalOpen={setIsGalleryModalOpen}
                    onDelete={handleDelete}
                    generationType="image"
                    references={[productImage, infographicsImage].filter((image) => image !== null) as { id: string; url: string }[]}
                    generationStatus={generationStatus}
                    generationsHistory={generationsHistory}
                    refetchGenerationsHistory={refetchGenerationsHistory}
                    hasEnhanceButton={false}
                    hasGoLiveButton={false}
                />
            </div>
            <GalleryModal
                galleryModalState={isGalleryModalOpen}
                onClose={() => setIsGalleryModalOpen({ open: false, generationId: null })}
                generationType={'image'}
                onDeleteGenerated={handleDelete}
                references={[productImage, infographicsImage].filter((image) => image !== null) as { id: string; url: string }[]}
                generationStatus={generationStatus}
                hasGoLiveButton={false}
                hasEnhanceButton={false}
                hasDownloadButton={true}
                hasAiModelInfo={false}
                generationSource="generate_image"
                openedFromPage='card-infographics'
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