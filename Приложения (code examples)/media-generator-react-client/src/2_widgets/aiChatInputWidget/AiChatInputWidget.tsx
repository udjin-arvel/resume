import styles from './AiChatInputWidget.module.css'
import { RadarAntdInput, RadarAntdButton, API, Uploader, validateImageFile, Spinner } from '@shared'
import { useAppSelector, useAppDispatch } from '@app'
import { App as AntdApp, Upload } from 'antd'
import { aiChatActions } from '@entities'
import { useEffect } from 'react'

interface IAiChatInputWidgetProps {

}

export const AiChatInputWidget: React.FC<IAiChatInputWidgetProps> = ({

}) => {
    const { currentChatId, userMessage, isStreaming, shouldUseWebSearch, files } = useAppSelector(state => state.aiChat);
    const { message: messageAntd } = AntdApp.useApp();
    const dispatch = useAppDispatch();
    // --- API
    const [createNewAiChat, { data: createNewAiChatData, isLoading: isCreateNewAiChatLoading, isError: isCreateNewAiChatError, isSuccess: isCreateNewAiChatSuccess, reset: resetCreateNewAiChat }] = API.useCreateNewAiChatMutation();
    const [sendMessageToCurrentChat, { isLoading: isSendMessageToCurrentChatLoading, isError: isSendMessageToCurrentChatError, isSuccess: isSendMessageToCurrentChatSuccess, reset: resetSendMessageToCurrentChat }] = API.useSendMessageToCurrentChatMutation();
    const [uploadAsset, { data: uploadAssetData, isLoading: isUploadAssetLoading, isError: isUploadAssetError, isSuccess: isUploadAssetSuccess, reset: resetUploadAsset }] = API.useUploadAssetMutation();
    // --- handlers
    const submitMessage = async () => {
        if (!userMessage.trim()) {
            messageAntd.error('Сообщение не может быть пустым');
            return;
        }
        if (!currentChatId) {
            const formData = new FormData();
            formData.append('message', userMessage);
            formData.append('title', 'Новый чат');
            formData.append('enable_web_search', shouldUseWebSearch ? 'true' : 'false');
            formData.append('attachments', JSON.stringify(files ?? []));
            const data = {
                message: userMessage,
                title: 'Новый чат',
                enable_web_search: shouldUseWebSearch,
                attachments: files ?? [],
            }
            createNewAiChat(data);
        } else {
            sendMessageToCurrentChat({ data: { message: userMessage, enable_web_search: shouldUseWebSearch, attachments: files ?? [] }, chatId: currentChatId });
        };
    }
    const handleRemoveImage = (filename: string) => {
        dispatch(aiChatActions.removeFileByFilename(filename));
    }
    // --- effects
    useEffect(function handleApiStatuses() {
        if (isCreateNewAiChatError || isSendMessageToCurrentChatError) {
            messageAntd.error('Не удалось отправить сообщение');
            resetCreateNewAiChat();
            resetSendMessageToCurrentChat();
            dispatch(aiChatActions.setIsStreaming(false));
        }
        if (isCreateNewAiChatSuccess) {
            const nextChatId = createNewAiChatData?.chat_id ?? null;
            dispatch(aiChatActions.setCurrentChatId(nextChatId));
            if (nextChatId) {
                dispatch(aiChatActions.requestStreamStart(nextChatId));
            }
            dispatch(aiChatActions.setUserMessage(''));
            dispatch(aiChatActions.resetAllAssets());
            resetCreateNewAiChat();
        }
        if (isSendMessageToCurrentChatSuccess) {
            if (currentChatId) {
                dispatch(aiChatActions.requestStreamStart(currentChatId));
            }
            dispatch(aiChatActions.setUserMessage(''));
            dispatch(aiChatActions.resetAllAssets());
            resetSendMessageToCurrentChat();
        }
    }, [isCreateNewAiChatError, isCreateNewAiChatSuccess, isSendMessageToCurrentChatSuccess, createNewAiChatData, isSendMessageToCurrentChatError, currentChatId]);
    useEffect(function handleUploadAsset() {
        if (isUploadAssetError) {
            messageAntd.error('Не удалось загрузить файл');
            resetUploadAsset();
        }
        if (isUploadAssetSuccess) {
            dispatch(aiChatActions.setFiles({ ...uploadAssetData, isLoading: false }));
            resetUploadAsset();
        }
    }, [isUploadAssetError, isUploadAssetSuccess, uploadAssetData]);
    return (
        <div className={styles.aiChatInputWidget}>
            <div className={styles.aiChatInputWidget__assets}>
                {files?.map((file, idx) => {
                    if (file.kind === 'image') {
                        return (
                            <div className={styles.widget__assetItem} key={idx}>
                                {!isStreaming && !file.isLoading && <button className={styles.widget__assetRemoveButton} onClick={() => handleRemoveImage(file.original_filename ?? '')}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" fill="none">
                                        <path fill="#fff" d="M1.0734.1842a.6288.6288 0 1 0-.8892.8892L2.1108 3 .1842 4.9266a.6288.6288 0 1 0 .8892.8892L3 3.8892l1.9266 1.9266a.6288.6288 0 1 0 .8892-.8892L3.8892 3l1.9266-1.9266a.6288.6288 0 1 0-.8892-.8892L3 2.1108z" />
                                    </svg>
                                </button>}
                                <img src={file.url_thumbnail} alt="asset" />
                            </div>
                        )
                    }
                    if (file.kind !== 'image') {
                        return (
                            <div className={`${styles.widget__assetItem} ${styles.widget__assetItem_document}`} key={idx}>
                                {!isStreaming && !file.isLoading && <button className={styles.widget__assetRemoveButton} onClick={() => handleRemoveImage(file.original_filename ?? '')}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" fill="none">
                                        <path fill="#fff" d="M1.0734.1842a.6288.6288 0 1 0-.8892.8892L2.1108 3 .1842 4.9266a.6288.6288 0 1 0 .8892.8892L3 3.8892l1.9266 1.9266a.6288.6288 0 1 0 .8892-.8892L3.8892 3l1.9266-1.9266a.6288.6288 0 1 0-.8892-.8892L3 2.1108z" />
                                    </svg>
                                </button>}
                                <svg width="11" height="13" viewBox="0 0 11 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M2.5 6.66667C2.22386 6.66667 2 6.89052 2 7.16667C2 7.44281 2.22386 7.66667 2.5 7.66667H7.83333C8.10948 7.66667 8.33333 7.44281 8.33333 7.16667C8.33333 6.89052 8.10948 6.66667 7.83333 6.66667H2.5Z" fill="var(--color-primary,#5329FF)" />
                                    <path d="M2 4.5C2 4.22386 2.22386 4 2.5 4H5.16667C5.44281 4 5.66667 4.22386 5.66667 4.5C5.66667 4.77614 5.44281 5 5.16667 5H2.5C2.22386 5 2 4.77614 2 4.5Z" fill="var(--color-primary,#5329FF)" />
                                    <path d="M2.5 9.33333C2.22386 9.33333 2 9.55719 2 9.83333C2 10.1095 2.22386 10.3333 2.5 10.3333H7.83333C8.10948 10.3333 8.33333 10.1095 8.33333 9.83333C8.33333 9.55719 8.10948 9.33333 7.83333 9.33333H2.5Z" fill="var(--color-primary,#5329FF)" />
                                    <path fillRule="evenodd" clipRule="evenodd" d="M3.16667 0C1.41777 0 0 1.41776 0 3.16667V9.83333C0 11.5822 1.41776 13 3.16667 13H7.16667C8.91557 13 10.3333 11.5822 10.3333 9.83333V4.27124C10.3333 3.43138 9.9997 2.62593 9.40584 2.03207L8.30127 0.927495C7.7074 0.33363 6.90195 0 6.0621 0H3.16667ZM1 3.16667C1 1.97005 1.97005 1 3.16667 1H6.0621C6.63673 1 7.18783 1.22827 7.59416 1.6346L8.69873 2.73917C9.10506 3.1455 9.33333 3.6966 9.33333 4.27124V9.83333C9.33333 11.03 8.36328 12 7.16667 12H3.16667C1.97005 12 1 11.03 1 9.83333V3.16667Z" fill="var(--color-primary,#5329FF)" />
                                </svg>
                                <div className={styles.widget__assetText}>
                                    <p className="text_secondary" style={{ fontWeight: 600 }}>{file.original_filename}</p>
                                    <span className="text_tertiary">{file.mime_type?.replace(/^.*\//, '').toUpperCase()}</span>
                                </div>
                            </div>
                        )
                    }
                })}
                {isUploadAssetLoading && <div className={styles.widget__assetItem} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Spinner />
                </div>}
            </div>
            <RadarAntdInput.Textarea
                placeholder="Ваш запрос..."
                autoSize={{ minRows: 2, maxRows: 2 }}
                allowClear={true}
                disabled={isStreaming}
                value={userMessage}
                onPressEnter={submitMessage}
                onChange={(e) => {
                    dispatch(aiChatActions.setUserMessage(e.target.value));
                }}
            />
            <div className={styles.aiChatInputWidget__footer}>
                <div className={styles.aiChatInputWidget__footerControls}>
                    <Uploader
                        radarSize='small'
                        style={{ width: '100%' }}
                        accept='.pdf'
                        fileList={[]}
                        limit={5 - (files?.length ?? 0)}
                        filesCount={files?.length ?? 0}
                        title='Загрузите документ'
                        subtitle='Или перетащите файл'
                        disabled={(files?.length ?? 0) >= 5 || isUploadAssetLoading || isStreaming}
                        beforeUpload={async (file) => {
                            try {
                                const formData = new FormData();
                                formData.append('file', file);
                                uploadAsset(formData);
                                return false;
                            } catch (err) {
                                messageAntd.error(err instanceof Error ? err.message : 'Ошибка валидации файла');
                                return Upload.LIST_IGNORE;
                            }
                        }}
                        customRequest={({ onSuccess }) => onSuccess?.('ok')}
                    >
                        <button
                            className={`${styles.chatInputBlock__controlButton} text_secondary`}
                            disabled={(files?.length ?? 0) >= 5 || isUploadAssetLoading || isStreaming}
                        >
                            <svg width="11" height="13" viewBox="0 0 11 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2.5 6.66667C2.22386 6.66667 2 6.89052 2 7.16667C2 7.44281 2.22386 7.66667 2.5 7.66667H7.83333C8.10948 7.66667 8.33333 7.44281 8.33333 7.16667C8.33333 6.89052 8.10948 6.66667 7.83333 6.66667H2.5Z" fill="currentColor" />
                                <path d="M2 4.5C2 4.22386 2.22386 4 2.5 4H5.16667C5.44281 4 5.66667 4.22386 5.66667 4.5C5.66667 4.77614 5.44281 5 5.16667 5H2.5C2.22386 5 2 4.77614 2 4.5Z" fill="currentColor" />
                                <path d="M2.5 9.33333C2.22386 9.33333 2 9.55719 2 9.83333C2 10.1095 2.22386 10.3333 2.5 10.3333H7.83333C8.10948 10.3333 8.33333 10.1095 8.33333 9.83333C8.33333 9.55719 8.10948 9.33333 7.83333 9.33333H2.5Z" fill="currentColor" />
                                <path fillRule="evenodd" clipRule="evenodd" d="M3.16667 0C1.41776 0 0 1.41776 0 3.16667V9.83333C0 11.5822 1.41776 13 3.16667 13H7.16667C8.91557 13 10.3333 11.5822 10.3333 9.83333V4.27124C10.3333 3.43138 9.9997 2.62593 9.40584 2.03207L8.30127 0.927495C7.7074 0.33363 6.90195 0 6.0621 0H3.16667ZM1 3.16667C1 1.97005 1.97005 1 3.16667 1H6.0621C6.63673 1 7.18783 1.22827 7.59416 1.6346L8.69873 2.73917C9.10506 3.1455 9.33333 3.6966 9.33333 4.27124V9.83333C9.33333 11.03 8.36328 12 7.16667 12H3.16667C1.97005 12 1 11.03 1 9.83333V3.16667Z" fill="currentColor" />
                            </svg>
                            Документ
                        </button>
                    </Uploader>
                    <Uploader
                        radarSize='small'
                        style={{ width: '100%' }}
                        accept='.jpg,.jpeg,.JPEG,.JPG,.png,.webp'
                        fileList={[]}
                        limit={5 - (files?.length ?? 0)}
                        filesCount={files?.length ?? 0}
                        title='Загрузите изображение'
                        subtitle='Или перетащите файл'
                        disabled={(files?.length ?? 0) >= 5 || isUploadAssetLoading || isStreaming}
                        beforeUpload={async (file) => {
                            try {
                                await validateImageFile(file);
                                const formData = new FormData();
                                formData.append('file', file);
                                uploadAsset(formData);
                                return false;
                            } catch (err) {
                                messageAntd.error(err instanceof Error ? err.message : 'Ошибка валидации файла');
                                return Upload.LIST_IGNORE;
                            }
                        }}
                        customRequest={({ onSuccess }) => onSuccess?.('ok')}
                    >
                        <button
                            className={`${styles.chatInputBlock__controlButton} text_secondary`}
                            disabled={(files?.length ?? 0) >= 5 || isUploadAssetLoading || isStreaming}
                        >
                            <svg width="14" height="11" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3.66667 4C4.21895 4 4.66667 3.55228 4.66667 3C4.66667 2.44772 4.21895 2 3.66667 2C3.11438 2 2.66667 2.44772 2.66667 3C2.66667 3.55228 3.11438 4 3.66667 4Z" fill="currentColor" />
                                <path fillRule="evenodd" clipRule="evenodd" d="M2.66667 0H10.6667C12.1394 0 13.3333 1.19391 13.3333 2.66667V8C13.3333 9.47276 12.1394 10.6667 10.6667 10.6667H2.66667C1.19391 10.6667 0 9.47276 0 8V2.66667C0 1.19391 1.19391 0 2.66667 0ZM10.6667 1H2.66667C1.74619 1 1 1.74619 1 2.66667V8C1 8.25723 1.05827 8.50084 1.16233 8.71836L2.62287 6.71012C3.29482 5.78619 4.69188 5.84796 5.27966 6.8276C5.53396 7.25144 6.16435 7.19787 6.3435 6.73721L7.07921 4.84538C7.54873 3.63803 9.20647 3.51022 9.85553 4.63131L12.1934 8.66948C12.2834 8.46459 12.3333 8.23813 12.3333 8V2.66667C12.3333 1.74619 11.5871 1 10.6667 1ZM2.66667 9.66667C2.37414 9.66667 2.09921 9.5913 1.86024 9.45893L3.43161 7.29829C3.68214 6.95382 4.20302 6.97685 4.42216 7.34209C5.10423 8.47887 6.795 8.33521 7.2755 7.09965L8.01121 5.20783C8.17676 4.78213 8.76126 4.73707 8.9901 5.13235L11.4896 9.44966C11.2468 9.58778 10.966 9.66667 10.6667 9.66667H2.66667Z" fill="currentColor" />
                            </svg>
                            Изображение
                        </button>
                    </Uploader>
                    <button className={shouldUseWebSearch ? `${styles.chatInputBlock__controlButton} ${styles.chatInputBlock__controlButton_selected} text_secondary` : `${styles.chatInputBlock__controlButton} text_secondary`} onClick={() => { dispatch(aiChatActions.setShouldUseWebSearch(!shouldUseWebSearch)) }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M13.3333 6.66667C13.3333 10.3486 10.3486 13.3333 6.66667 13.3333C2.98477 13.3333 0 10.3486 0 6.66667C0 2.98477 2.98477 0 6.66667 0C10.3486 0 13.3333 2.98477 13.3333 6.66667ZM1 6.66667C1 6.16219 1.06592 5.6731 1.18962 5.20756L1.44388 5.15438L1.46988 5.14903C1.49299 5.1443 1.52748 5.1373 1.57232 5.12835C1.66201 5.11044 1.79304 5.08476 1.95719 5.05388C2.19056 5.00999 2.49046 4.95568 2.83333 4.89836V8.43497C2.49046 8.37766 2.19056 8.32335 1.95719 8.27945C1.79304 8.24857 1.66201 8.22289 1.57232 8.20499C1.52748 8.19603 1.49299 8.18903 1.46988 8.1843L1.44388 8.17896L1.18962 8.12577C1.06592 7.66023 1 7.17115 1 6.66667ZM1.77233 4.07112C2.04784 4.01929 2.4137 3.95333 2.83333 3.88481V2.4933C2.33645 2.94994 1.92133 3.49417 1.61248 4.10151C1.66166 4.09206 1.71506 4.08189 1.77233 4.07112ZM6.16667 8.82219C5.42268 8.79088 4.5928 8.69738 3.83333 8.58975V4.74358C4.5928 4.63595 5.42268 4.54245 6.16667 4.51115V8.82219ZM3.83333 3.73384C4.58556 3.63013 5.41155 3.54006 6.16667 3.51035V1.02176C5.32217 1.09559 4.53077 1.35466 3.83333 1.7581V3.73384ZM9.5 8.58975C8.74053 8.69738 7.91065 8.79088 7.16667 8.82219V4.51115C7.91065 4.54245 8.74053 4.63595 9.5 4.74358V8.58975ZM7.16667 3.51035C7.92178 3.54006 8.74777 3.63013 9.5 3.73384V1.7581C8.80257 1.35466 8.01117 1.09559 7.16667 1.02176V3.51035ZM11.3761 8.27945C11.1428 8.32335 10.8429 8.37766 10.5 8.43497V4.89836C10.8429 4.95568 11.1428 5.00999 11.3761 5.05388C11.5403 5.08476 11.6713 5.11044 11.761 5.12835C11.8059 5.1373 11.8403 5.1443 11.8635 5.14903L11.8895 5.15438L11.8958 5.1557L12.1437 5.20756C12.2674 5.6731 12.3333 6.16219 12.3333 6.66667C12.3333 7.17115 12.2674 7.66023 12.1437 8.12577L11.8895 8.17896L11.8635 8.1843C11.8403 8.18903 11.8059 8.19603 11.761 8.20499C11.6713 8.22289 11.5403 8.24857 11.3761 8.27945ZM11.561 4.07112C11.6183 4.08189 11.6717 4.09206 11.7209 4.10151C11.412 3.49417 10.9969 2.94994 10.5 2.4933V3.88481C10.9196 3.95333 11.2855 4.01929 11.561 4.07112ZM10.5 10.84C10.9969 10.3834 11.412 9.83916 11.7209 9.23182C11.6717 9.24127 11.6183 9.25144 11.561 9.26222C11.2855 9.31404 10.9196 9.38 10.5 9.44853V10.84ZM7.16667 9.82298C7.92178 9.79327 8.74777 9.70321 9.5 9.59949V11.3333C9.5 11.4099 9.51719 11.4824 9.54792 11.5472C8.8389 11.9667 8.03057 12.2361 7.16667 12.3116V9.82298ZM3.83333 9.59949C4.58556 9.70321 5.41155 9.79327 6.16667 9.82298V12.3116C5.30277 12.2361 4.49443 11.9667 3.78542 11.5472C3.81614 11.4824 3.83333 11.4099 3.83333 11.3333V9.59949ZM1.77233 9.26222C2.04784 9.31404 2.4137 9.38 2.83333 9.44853V10.84C2.33645 10.3834 1.92133 9.83916 1.61248 9.23182C1.66166 9.24127 1.71506 9.25144 1.77233 9.26222Z" fill="currentColor" />
                        </svg>
                        Поиск
                    </button>
                    <span className={`${styles.content__priceBadge} text_secondary`} style={{ color: 'currentColor' }}>
                        1&nbsp;
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: '#5329ff' }}>
                            <path fillRule="evenodd" clipRule="evenodd" d="M4.48939 5.67406C4.32128 5.21976 3.67872 5.21976 3.51061 5.67406L3.27791 6.30294C3.22505 6.44577 3.11244 6.55839 2.96961 6.61124L2.34073 6.84394C1.88642 7.01205 1.88642 7.65461 2.34073 7.82272L2.96961 8.05543C3.11244 8.10828 3.22505 8.2209 3.27791 8.36373L3.51061 8.9926C3.67872 9.44691 4.32128 9.44691 4.48939 8.99261L4.7221 8.36373C4.77495 8.2209 4.88756 8.10828 5.03039 8.05543L5.65927 7.82272C6.11358 7.65461 6.11358 7.01205 5.65927 6.84394L5.03039 6.61124C4.88756 6.55839 4.77495 6.44577 4.7221 6.30294L4.48939 5.67406ZM4 7.04286C3.91675 7.15235 3.81902 7.25009 3.70953 7.33333C3.81902 7.41658 3.91675 7.51431 4 7.62381C4.08325 7.51431 4.18098 7.41658 4.29047 7.33333C4.18098 7.25009 4.08325 7.15235 4 7.04286Z" fill="currentColor" />
                            <path fillRule="evenodd" clipRule="evenodd" d="M7.94471 7.99991C7.95386 7.99997 7.96302 8 7.97219 8C10.1967 8 12 6.20914 12 4C12 1.79086 10.1967 0 7.97219 0C5.97641 0 4.31966 1.44152 4.00006 3.33333C4.00004 3.33333 4.00008 3.33333 4.00006 3.33333C1.79092 3.33333 0 5.12419 0 7.33333C0 9.54247 1.79086 11.3333 4 11.3333C5.98203 11.3333 7.62736 9.89176 7.94471 7.99991ZM7.98631 6.99997C9.64819 6.99242 10.993 5.65218 10.993 4C10.993 2.34315 9.64056 1 7.97219 1C6.48966 1 5.25656 2.06058 5.00024 3.45941C6.62143 3.87679 7.84481 5.28499 7.98631 6.99997ZM4 10.3333C5.65685 10.3333 7 8.99019 7 7.33333C7 5.67648 5.65685 4.33333 4 4.33333C2.34315 4.33333 1 5.67648 1 7.33333C1 8.99019 2.34315 10.3333 4 10.3333Z" fill="currentColor" />
                        </svg>
                    </span>
                </div>
                <div className={styles.aiChatInputWidget__submitButton}>
                    <RadarAntdButton
                        shineAnimation={!isCreateNewAiChatLoading && !!userMessage.trim() && !isSendMessageToCurrentChatLoading && !isStreaming}
                        onClick={submitMessage}
                        size="large"
                        style={{ width: 32, height: 32, padding: 0, borderRadius: '50%' }}
                        disabled={isCreateNewAiChatLoading || !userMessage.trim() || isSendMessageToCurrentChatLoading || isStreaming}
                    >
                        <svg width="11" height="14" viewBox="0 0 11 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4.97328 0.00130859C4.99041 0.000439606 5.00765 0 5.025 0C5.2822 0 5.5394 0.098119 5.73564 0.294357L9.75564 4.31436C10.1481 4.70683 10.1481 5.34317 9.75564 5.73564C9.36317 6.12812 8.72684 6.12812 8.33436 5.73564L6.03 3.43129L5.97828 12.495C5.97828 13.05 5.52833 13.5 4.97328 13.5C4.41824 13.5 3.96828 13.05 3.96828 12.495L4.02 3.43129L1.71564 5.73564C1.32317 6.12812 0.686835 6.12812 0.294358 5.73564C-0.0981192 5.34317 -0.0981192 4.70683 0.294358 4.31436L4.31436 0.294357C4.41071 0.198001 4.52177 0.125303 4.6403 0.0762588C4.74372 0.0333768 4.85584 0.00726116 4.97328 0.00130859Z" fill="currentColor" />
                        </svg>
                    </RadarAntdButton>
                </div>
            </div>
        </div>
    )
}