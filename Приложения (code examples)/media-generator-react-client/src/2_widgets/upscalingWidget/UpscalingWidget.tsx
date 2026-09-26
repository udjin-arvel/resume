import { useState, useEffect } from 'react';
import styles from './UpscalingWidget.module.css'
import { RadarAntdButton, Uploader, validateImageFile, API, apiAssetUrl } from '@shared'
import { message, Upload, Modal, Button } from 'antd'
import { GenerationLoadingBlock, ImageUpscalerGalleryModal } from '@features';
import { useAppSelector, useReferenceFiles, useAppDispatch } from '@app';
import { imageUpscalingActions } from '@entities';

export const UpscalingWidget = () => {
    const dispatch = useAppDispatch();
    const { registerReferenceFile, unregisterReferenceFile, getReferenceFile } = useReferenceFiles();
    const imageUpscalingState = useAppSelector((state) => state.imageUpscaling);
    const { reference, isGenerationInProgress } = imageUpscalingState;
    const [pollingInterval, setPollingInterval] = useState(0);
    const [errorModalMessage, setErrorModalMessage] = useState('');
    const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
    const { data: generationStatus } = API.useGetGenerationStatusQuery({ task_type: 'improve_quality', source: 'generation' }, { pollingInterval, skipPollingIfUnfocused: true, });
    const [closeTask] = API.useCloseTaskMutation();
    const [deleteGeneration] = API.useDeleteGenerationMutation();
    const { data: userData, refetch: refetchUserData } = API.useGetUserDataQuery();
    const [markErrorAsRead] = API.useMarkErrorAsReadMutation();
    const [upscaleImage, { isLoading: isUpscalingRequestLoading, isSuccess: isUpscalingStartedSuccessfully, reset: resetUpscalingRequestStatus, isError: isUpscalingRequestError }] = API.useUpscaleImageMutation();

    const handleRemoveImage = (id: string | undefined) => {
        if (id) {
            unregisterReferenceFile(id);
        }
        dispatch(imageUpscalingActions.removeReference())
        if (generationStatus?.task_status === 'waiting' && generationStatus?.task_id) {
            closeTask({ task_id: generationStatus.task_id });
        }
    }

    const handleSubmit = async () => {
        const file = imageUpscalingState.reference ? getReferenceFile(imageUpscalingState.reference.id) : undefined;
        if (!file) {
            message.error('Добавьте хотя бы одно изображение');
            return;
        }
        if (userData && userData.tokens && imageUpscalingState.modelType && imageUpscalingState.modelType.tokens_per_request && userData.tokens < imageUpscalingState.modelType.tokens_per_request) {
            message.error(`Недостаточно токенов для генерации!`);
            return;
        }
        const { modelType, upscaleRate } = imageUpscalingState;
        const formData = new FormData();
        formData.append('image', file);
        formData.append('ai_model', modelType?.id ?? '');
        formData.append('message', '');
        formData.append('options', JSON.stringify({ x_dpi: parseInt(upscaleRate.replace('x', '')) }));
        upscaleImage(formData)
    }

    const handleDelete = () => { // delete generated image
        closeTask({ task_id: generationStatus?.task_id });
        unregisterReferenceFile(reference?.id ?? '');
        dispatch(imageUpscalingActions.resetState())
    }

    const handleDeleteFromGallery = (generation_id: number, isHistoryDelete: boolean = false) => {
        if (isHistoryDelete) {
            deleteGeneration({ generation_id });
            return;
        }
        closeTask({ task_id: generationStatus?.task_id });
        unregisterReferenceFile(reference?.id ?? '');
        dispatch(imageUpscalingActions.resetState());
        deleteGeneration({ generation_id });
    }

    useEffect(function uiBlocker() {
        let timeout: ReturnType<typeof setTimeout> | null = null;
        if (isUpscalingRequestLoading || generationStatus?.task_status === 'launched' || generationStatus?.task_status === 'pending') {
            dispatch(imageUpscalingActions.setIsGenerationInProgress(true));
        } else {
            timeout = setTimeout(() => dispatch(imageUpscalingActions.setIsGenerationInProgress(false)), 1000);
        }
        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }
        }
    }, [isUpscalingRequestLoading, generationStatus?.task_status])

    useEffect(() => {
        if (isUpscalingStartedSuccessfully) {
            setPollingInterval(3000)
        }
        if (isUpscalingRequestError) {
            message.error('Не удалось запустить процесс');
            resetUpscalingRequestStatus();
        }
    }, [isUpscalingStartedSuccessfully, isUpscalingRequestError]);

    useEffect(() => {
        if (generationStatus && (generationStatus.task_status === 'pending' || generationStatus.task_status === 'launched') && !pollingInterval) {
            setPollingInterval(3000);
        }
        if (generationStatus && (generationStatus.task_status === 'closed' || generationStatus.task_status === 'waiting') && generationStatus.result) {
            setPollingInterval(0);
            resetUpscalingRequestStatus();
            refetchUserData()
        }
        if (generationStatus && generationStatus.task_status === 'error') {
            setPollingInterval(0);
            refetchUserData();
            if (generationStatus.error_unread) {
                setErrorModalMessage(generationStatus?.error_message || 'Во время улучшения качества возникла ошибка. Пожалуйста, обратитесь в поддержку.');
                markErrorAsRead({ task_id: generationStatus.task_id });
            }
        }
    }, [generationStatus]);

    useEffect(() => {
        if (!reference && (generationStatus?.task_status === 'waiting' || generationStatus?.task_status === 'launched' || generationStatus?.task_status === 'pending')) {
            dispatch(imageUpscalingActions.addReference({ id: apiAssetUrl(generationStatus.generations?.[0]?.reference?.[0] ?? ''), url: apiAssetUrl(generationStatus.generations?.[0]?.reference?.[0] ?? '') }));
        }
    }, [generationStatus]);
    console.log(reference);
    return (
        <div className={styles.upscalingWidget}>
            {/* uploader */}
            {!reference &&
                <div className={styles.widget__uploaderWrapper}>
                    <Uploader
                        radarSize="large"
                        style={{ pointerEvents: reference ? 'none' : undefined, width: '100%' }}
                        accept='.jpg,.jpeg,.JPEG,.JPG,.png,.webp'
                        fileList={[]}
                        beforeUpload={async (file) => {
                            try {
                                await validateImageFile(file);
                                const url = URL.createObjectURL(file);
                                registerReferenceFile(url, file);
                                dispatch(imageUpscalingActions.addReference({ id: url, url }));
                                closeTask({ task_id: generationStatus?.task_id });
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
            {reference &&
                <div className={styles.widget__result} style={{ marginTop: 20 }}>
                    <div className={styles.widget__resultItem}>
                        <div className={styles.widget__resultImageWrapper}>
                            {!isGenerationInProgress &&
                                <button className={styles.widget__removeButton} onClick={() => handleRemoveImage(reference?.id)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none">
                                        <path fill="#fff" d="M2.1468.3683c-.4911-.491-1.2874-.491-1.7785 0s-.491 1.2874 0 1.7785L4.2216 6 .3683 9.8532c-.491.4912-.491 1.2874 0 1.7785s1.2874.4911 1.7785 0L6 7.7784l3.8532 3.8533c.4911.4911 1.2874.4911 1.7785 0s.4911-1.2873 0-1.7785L7.7784 6l3.8533-3.8532c.4911-.4911.4911-1.2874 0-1.7785s-1.2874-.491-1.7785 0L6 4.2216z" />
                                    </svg>
                                </button>}
                            <img src={apiAssetUrl(reference?.url)} alt="Image 1" />
                        </div>
                        <p className="text_secondary">Исходное изображение</p>
                    </div>
                    <div className={styles.widget__resultItem}>
                        <div className={styles.widget__resultImageWrapper}>
                            {/* submit button */}
                            {pollingInterval === 0 && generationStatus?.task_status !== 'waiting' &&
                                <RadarAntdButton
                                    shineAnimation
                                    onClick={handleSubmit}
                                    loading={isUpscalingRequestLoading}
                                    disabled={isGenerationInProgress}
                                >
                                    <span style={{ fontWeight: 700 }}>
                                        {`Улучшить изображение за ${imageUpscalingState?.modelType?.tokens_per_request} `}
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" clipRule="evenodd" d="M4.48939 5.67406C4.32128 5.21976 3.67872 5.21976 3.51061 5.67406L3.27791 6.30294C3.22505 6.44577 3.11244 6.55839 2.96961 6.61124L2.34073 6.84394C1.88642 7.01205 1.88642 7.65461 2.34073 7.82272L2.96961 8.05543C3.11244 8.10828 3.22505 8.2209 3.27791 8.36373L3.51061 8.9926C3.67872 9.44691 4.32128 9.44691 4.48939 8.99261L4.7221 8.36373C4.77495 8.2209 4.88756 8.10828 5.03039 8.05543L5.65927 7.82272C6.11358 7.65461 6.11358 7.01205 5.65927 6.84394L5.03039 6.61124C4.88756 6.55839 4.77495 6.44577 4.7221 6.30294L4.48939 5.67406ZM4 7.04286C3.91675 7.15235 3.81902 7.25009 3.70953 7.33333C3.81902 7.41658 3.91675 7.51431 4 7.62381C4.08325 7.51431 4.18098 7.41658 4.29047 7.33333C4.18098 7.25009 4.08325 7.15235 4 7.04286Z" fill="currentColor" />
                                            <path fillRule="evenodd" clipRule="evenodd" d="M7.94471 7.99991C7.95386 7.99997 7.96302 8 7.97219 8C10.1967 8 12 6.20914 12 4C12 1.79086 10.1967 0 7.97219 0C5.97641 0 4.31966 1.44152 4.00006 3.33333C4.00004 3.33333 4.00008 3.33333 4.00006 3.33333C1.79092 3.33333 0 5.12419 0 7.33333C0 9.54247 1.79086 11.3333 4 11.3333C5.98203 11.3333 7.62736 9.89176 7.94471 7.99991ZM7.98631 6.99997C9.64819 6.99242 10.993 5.65218 10.993 4C10.993 2.34315 9.64056 1 7.97219 1C6.48966 1 5.25656 2.06058 5.00024 3.45941C6.62143 3.87679 7.84481 5.28499 7.98631 6.99997ZM4 10.3333C5.65685 10.3333 7 8.99019 7 7.33333C7 5.67648 5.65685 4.33333 4 4.33333C2.34315 4.33333 1 5.67648 1 7.33333C1 8.99019 2.34315 10.3333 4 10.3333Z" fill="currentColor" />
                                        </svg>
                                    </span>
                                </RadarAntdButton>
                            }
                            {/* loading block */}
                            {pollingInterval !== 0 && (generationStatus?.task_status === 'pending' || generationStatus?.task_status === 'launched') &&
                                <GenerationLoadingBlock title='Улучшаем' style={{ maxWidth: '100%' }} />
                            }
                            {/* result image */}
                            {generationStatus?.task_status === 'waiting' && generationStatus?.result &&
                                <>
                                    <img src={apiAssetUrl(generationStatus?.result ?? '')} alt="Image 2" />
                                    <div className={styles.resultWrapper__controls}>
                                        <div className={styles.resultWrapper__controlsBox}>
                                            <button className={`text_primary ${styles.resultWrapper__controlButton}`} onClick={() => setIsGalleryModalOpen(true)}>
                                                <span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none">
                                                        <rect width="32" height="32" fill="#fff" fillOpacity=".15" rx="8" />
                                                        <path fill="#fff" d="M9.6004 20.1312a.2005.2005 0 0 0-.2-.2.2005.2005 0 0 0-.2.2v3.3953a.2.2 0 0 0 .0578.1406.203.203 0 0 0 .1422.0594h3.3937a.2.2 0 1 0 0-.4h-1.9453a.4.4 0 0 1-.3687-.2469.4.4 0 0 1 .0859-.4359l4.0391-4.0391a.201.201 0 0 0 0-.2828.2.2 0 0 0-.2828 0l-4.0391 4.039a.401.401 0 0 1-.436.086.4.4 0 0 1-.2468-.3688zm14.125-10.7516a.203.203 0 0 0-.0531-.1156l-.0047-.0063-.0063-.0047a.2.2 0 0 0-.1203-.053h-3.4094a.2.2 0 0 0-.2.2l.0157.0781a.2.2 0 0 0 .1843.1219h1.9454a.401.401 0 0 1 .3703.2469.401.401 0 0 1-.0875.4359l-4.0375 4.0391a.2.2 0 1 0 .2828.2828l4.0375-4.0391a.4.4 0 0 1 .4359-.0859.399.399 0 0 1 .2469.3687v1.9454a.2.2 0 0 0 .4 0zm-13.325 11.7328 3.3562-3.3562c.3906-.3904 1.0236-.3905 1.4141 0 .39.3905.3902 1.0236 0 1.414l-3.3562 3.3563h.9796c.5523 0 1 .4477 1 1-.0003.552-.4479 1-1 1H9.4004a1 1 0 0 1-.3406-.0594 1 1 0 0 1-.3672-.2344 1 1 0 0 1-.2219-.339 1 1 0 0 1-.0703-.3672v-3.3953c.0003-.5521.448-1 1-1l.2016.0203c.4555.0931.7981.4966.7984.9797zm14.125-8.3187c0 .5522-.4477 1-1 1-.5521-.0003-1-.4479-1-1v-.9797l-3.3547 3.3562c-.3904.3904-1.0235.3901-1.4141 0-.3905-.3905-.3905-1.0235 0-1.414l3.3547-3.3563h-.9797c-.5522 0-1-.4477-1-1s.4478-1 1-1h3.3938c.0263 0 .0536.001.0797.0031l-.0016.0016c.216.0169.4294.1021.6.2594.0097.0089.0199.0183.0297.028l.0281.0298.1.1281a1 1 0 0 1 .1641.55z" />
                                                        <path fill="#fff" d="M9.6004 20.1312a.2005.2005 0 0 0-.2-.2.2005.2005 0 0 0-.2.2v3.3953a.2.2 0 0 0 .0578.1406.203.203 0 0 0 .1422.0594h3.3937a.2.2 0 1 0 0-.4h-1.9453a.4.4 0 0 1-.3687-.2469.4.4 0 0 1 .0859-.4359l4.0391-4.0391a.201.201 0 0 0 0-.2828.2.2 0 0 0-.2828 0l-4.0391 4.039a.401.401 0 0 1-.436.086.4.4 0 0 1-.2468-.3688zm14.125-10.7516a.203.203 0 0 0-.0531-.1156l-.0047-.0063-.0063-.0047a.2.2 0 0 0-.1203-.053h-3.4094a.2.2 0 0 0-.2.2l.0157.0781a.2.2 0 0 0 .1843.1219h1.9454a.401.401 0 0 1 .3703.2469.401.401 0 0 1-.0875.4359l-4.0375 4.0391a.2.2 0 1 0 .2828.2828l4.0375-4.0391a.4.4 0 0 1 .4359-.0859.399.399 0 0 1 .2469.3687v1.9454a.2.2 0 0 0 .4 0z" />
                                                    </svg>
                                                </span>
                                                Открыть сравнение
                                            </button>
                                            <div className={styles.resultWrapper__controlsGroup}>
                                                <a
                                                    className={`text_tertiary ${styles.resultWrapper__controlButtonSmall}`}
                                                    href={apiAssetUrl(generationStatus.result)}
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
                                                <button className={`text_tertiary ${styles.resultWrapper__controlButtonSmall}`} onClick={() => handleDelete()}>
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
                        <p className="text_secondary">Результат повышения качества</p>
                    </div>
                </div>
            }
            {isGalleryModalOpen && <ImageUpscalerGalleryModal
                open={isGalleryModalOpen}
                onClose={() => setIsGalleryModalOpen(false)}
                onDeleteGenerated={handleDeleteFromGallery}
                generationStatus={generationStatus}
            />
            }
            <Modal
                open={errorModalMessage ? true : false}
                onCancel={() => setErrorModalMessage('')}
                footer={[<Button key="ok" onClick={() => setErrorModalMessage('')}>OK</Button>]}
                title="Ошибка"
            >
                {errorModalMessage}
            </Modal>
        </div>
    )
}