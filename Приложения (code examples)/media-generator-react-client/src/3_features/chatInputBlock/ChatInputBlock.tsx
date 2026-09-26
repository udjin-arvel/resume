import { useMemo } from 'react';
import styles from './ChatInputBlock.module.css';
import { RadarAntdInput, RadarAntdButton, Uploader, validateImageFile, API, DEFAULT_IMAGE_PROCESSING_MODEL_ID } from '@shared';
import { message, Upload } from 'antd';
import { useAppSelector, useAppDispatch, useReferenceFiles } from '@app';
import { photoEditorActions } from '@entities';

type TPrettify<T> = {
    [K in keyof T]: T[K]
} & {}

interface IChatInputBlockProps {
    controlsHandler: (actionType: string) => void
    onSubmit: () => void
    isLoading?: boolean,
    isDrawModeOn: boolean,
    shouldRemoveBackground: boolean,
}

export const ChatInputBlock: React.FC<TPrettify<IChatInputBlockProps>> = ({
    controlsHandler,
    onSubmit,
    isLoading,
    isDrawModeOn,
    shouldRemoveBackground,
}) => {
    const { references, isGenerationInProgress, prompt, mainImage } = useAppSelector((state) => state.photoEditor);
    const { unregisterReferenceFile, registerReferenceFile } = useReferenceFiles();
    const dispatch = useAppDispatch();
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
    const handleRemoveImage = (id: string) => {
        unregisterReferenceFile(id);
        dispatch(photoEditorActions.removeReference({ id }));
    }

    return (
        <div className={styles.chatInputBlock}>
            <div className={styles.widget__assets}>
                {references?.map((file, index) => (
                    <div className={styles.widget__assetItem} key={file.id}>
                        {!isGenerationInProgress && <button className={styles.widget__assetRemoveButton} onClick={() => handleRemoveImage(file.id)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" fill="none">
                                <path fill="#fff" d="M1.0734.1842a.6288.6288 0 1 0-.8892.8892L2.1108 3 .1842 4.9266a.6288.6288 0 1 0 .8892.8892L3 3.8892l1.9266 1.9266a.6288.6288 0 1 0 .8892-.8892L3.8892 3l1.9266-1.9266a.6288.6288 0 1 0-.8892-.8892L3 2.1108z" />
                            </svg>
                        </button>}
                        <span className={`text_tertiary ${styles.widget__assetItemNumber}`}>#{index + 1}</span>
                        <img src={file.url} alt="asset" />
                    </div>
                ))}
            </div>
            <RadarAntdInput.Textarea
                placeholder="Опишите, как изменить изображение"
                autoSize={{ minRows: 2, maxRows: 2 }}
                allowClear={true}
                disabled={false}
                value={prompt}
                onChange={(e) => {
                    dispatch(photoEditorActions.setPrompt(e.target.value));
                }}
            />
            <div className={styles.chatInputBlock__footer}>
                <div className={styles.chatInputBlock__controls}>
                    <Uploader
                        radarSize='small'
                        style={{ width: '100%' }}
                        accept='.jpg,.jpeg,.JPEG,.JPG,.png,.webp'
                        fileList={[]}
                        limit={3}
                        filesCount={references?.length ?? 0}
                        title='Загрузите изображение'
                        subtitle='Или перетащите файл'
                        beforeUpload={async (file) => {
                            try {
                                await validateImageFile(file);
                                const url = URL.createObjectURL(file);
                                registerReferenceFile(url, file);
                                dispatch(photoEditorActions.addReference({ id: url, url }));
                                return false;
                            } catch (err) {
                                message.error(err instanceof Error ? err.message : 'Ошибка валидации файла');
                                return Upload.LIST_IGNORE;
                            }
                        }}
                        customRequest={({ onSuccess }) => onSuccess?.('ok')}
                    >
                        <button
                            className={`${styles.chatInputBlock__controlButton} text_secondary`}
                            onClick={() => controlsHandler('uploadReference')}
                            disabled={(references?.length ?? 0) >= 3}
                        >
                            <svg width="14" height="11" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3.66667 4C4.21895 4 4.66667 3.55228 4.66667 3C4.66667 2.44772 4.21895 2 3.66667 2C3.11438 2 2.66667 2.44772 2.66667 3C2.66667 3.55228 3.11438 4 3.66667 4Z" fill="currentColor" />
                                <path fillRule="evenodd" clipRule="evenodd" d="M2.66667 0H10.6667C12.1394 0 13.3333 1.19391 13.3333 2.66667V8C13.3333 9.47276 12.1394 10.6667 10.6667 10.6667H2.66667C1.19391 10.6667 0 9.47276 0 8V2.66667C0 1.19391 1.19391 0 2.66667 0ZM10.6667 1H2.66667C1.74619 1 1 1.74619 1 2.66667V8C1 8.25723 1.05827 8.50084 1.16233 8.71836L2.62287 6.71012C3.29482 5.78619 4.69188 5.84796 5.27966 6.8276C5.53396 7.25144 6.16435 7.19787 6.3435 6.73721L7.07921 4.84538C7.54873 3.63803 9.20647 3.51022 9.85553 4.63131L12.1934 8.66948C12.2834 8.46459 12.3333 8.23813 12.3333 8V2.66667C12.3333 1.74619 11.5871 1 10.6667 1ZM2.66667 9.66667C2.37414 9.66667 2.09921 9.5913 1.86024 9.45893L3.43161 7.29829C3.68214 6.95382 4.20302 6.97685 4.42216 7.34209C5.10423 8.47887 6.795 8.33521 7.2755 7.09965L8.01121 5.20783C8.17676 4.78213 8.76126 4.73707 8.9901 5.13235L11.4896 9.44966C11.2468 9.58778 10.966 9.66667 10.6667 9.66667H2.66667Z" fill="currentColor" />
                            </svg>
                            Загрузить референс
                        </button>
                    </Uploader>
                    <button className={isDrawModeOn ? `${styles.chatInputBlock__controlButton} ${styles.chatInputBlock__controlButton_selected} text_secondary` : `${styles.chatInputBlock__controlButton} text_secondary`} onClick={() => controlsHandler('toggleDrawingMode')}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M9.10338 0.235027C7.56098 1.15551 5.38345 2.8281 2.48499 5.7181L1.16141 6.23951C0.414515 6.53374 -0.0540934 7.27966 0.00500923 8.08024L0.149677 10.0398C0.192244 10.6164 0.650688 11.0749 1.22728 11.1174L3.31235 11.2714C4.02738 11.3242 4.70757 10.9553 5.05335 10.3272L5.76138 9.04115C8.87128 5.92302 10.2646 3.75718 11.0544 2.14063C11.3631 1.50868 11.2702 0.827676 10.8475 0.39317C10.4121 -0.0544017 9.72739 -0.137368 9.10338 0.235027ZM9.61585 1.09374C9.88601 0.932507 10.0526 1.01012 10.1307 1.09044C10.2215 1.18382 10.3042 1.39801 10.1559 1.70165C9.44829 3.14996 8.1902 5.13905 5.35583 8.02915L3.47321 6.14653C6.1933 3.46556 8.21487 1.92982 9.61585 1.09374ZM2.64309 6.73062L4.73836 8.82589L4.17734 9.84491C4.02016 10.1304 3.71099 10.2981 3.38598 10.2741L1.30091 10.1202C1.21854 10.1141 1.15304 10.0486 1.14696 9.96621L1.0023 8.00662C0.97543 7.64272 1.18843 7.30366 1.52793 7.16992L2.64309 6.73062Z" fill="currentColor" />
                        </svg>
                        Выбрать область
                    </button>
                    <button className={shouldRemoveBackground ? `${styles.chatInputBlock__controlButton} ${styles.chatInputBlock__controlButton_selected} text_secondary` : `${styles.chatInputBlock__controlButton} text_secondary`} onClick={() => controlsHandler('shouldRemoveBackground')}>
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M2.94281 4.35702L8.59966 10.0139L12.3709 6.24264C13.1519 5.46159 13.1519 4.19526 12.3709 3.41421L9.54247 0.585786C8.76143 -0.195262 7.4951 -0.195262 6.71405 0.585786L2.94281 4.35702ZM11.6638 5.53553L8.59966 8.59966L4.35702 4.35702L7.42115 1.29289C7.81168 0.902369 8.44484 0.902369 8.83537 1.29289L11.6638 4.12132C12.0543 4.51184 12.0543 5.14501 11.6638 5.53553Z" fill="currentColor" />
                            <path fillRule="evenodd" clipRule="evenodd" d="M0.585786 6.71405L2.2357 5.06413L7.89256 10.721L6.24264 12.3709C5.46159 13.1519 4.19526 13.1519 3.41421 12.3709L0.585786 9.54247C-0.195262 8.76143 -0.195262 7.4951 0.585786 6.71405ZM1.29289 7.42115L2.2357 6.47834L6.47834 10.721L5.53553 11.6638C5.14501 12.0543 4.51184 12.0543 4.12132 11.6638L1.29289 8.83537C0.902369 8.44484 0.902369 7.81168 1.29289 7.42115Z" fill="currentColor" />
                        </svg>
                        Удалить фон
                    </button>
                </div>
                <RadarAntdButton
                    shineAnimation={!isGenerationInProgress && mainImage ? true : false}
                    onClick={onSubmit}
                    loading={isLoading}
                    disabled={isGenerationInProgress || !mainImage}
                >
                    <span style={{ fontWeight: 700 }}>
                        {modelType ? (
                            `Редактировать изображение за ${modelType?.tokens_per_request} `
                        ) : ('Редактировать изображение')}
                        {modelType?.tokens_per_request &&
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M4.48939 5.67406C4.32128 5.21976 3.67872 5.21976 3.51061 5.67406L3.27791 6.30294C3.22505 6.44577 3.11244 6.55839 2.96961 6.61124L2.34073 6.84394C1.88642 7.01205 1.88642 7.65461 2.34073 7.82272L2.96961 8.05543C3.11244 8.10828 3.22505 8.2209 3.27791 8.36373L3.51061 8.9926C3.67872 9.44691 4.32128 9.44691 4.48939 8.99261L4.7221 8.36373C4.77495 8.2209 4.88756 8.10828 5.03039 8.05543L5.65927 7.82272C6.11358 7.65461 6.11358 7.01205 5.65927 6.84394L5.03039 6.61124C4.88756 6.55839 4.77495 6.44577 4.7221 6.30294L4.48939 5.67406ZM4 7.04286C3.91675 7.15235 3.81902 7.25009 3.70953 7.33333C3.81902 7.41658 3.91675 7.51431 4 7.62381C4.08325 7.51431 4.18098 7.41658 4.29047 7.33333C4.18098 7.25009 4.08325 7.15235 4 7.04286Z" fill="currentColor" />
                                <path fillRule="evenodd" clipRule="evenodd" d="M7.94471 7.99991C7.95386 7.99997 7.96302 8 7.97219 8C10.1967 8 12 6.20914 12 4C12 1.79086 10.1967 0 7.97219 0C5.97641 0 4.31966 1.44152 4.00006 3.33333C4.00004 3.33333 4.00008 3.33333 4.00006 3.33333C1.79092 3.33333 0 5.12419 0 7.33333C0 9.54247 1.79086 11.3333 4 11.3333C5.98203 11.3333 7.62736 9.89176 7.94471 7.99991ZM7.98631 6.99997C9.64819 6.99242 10.993 5.65218 10.993 4C10.993 2.34315 9.64056 1 7.97219 1C6.48966 1 5.25656 2.06058 5.00024 3.45941C6.62143 3.87679 7.84481 5.28499 7.98631 6.99997ZM4 10.3333C5.65685 10.3333 7 8.99019 7 7.33333C7 5.67648 5.65685 4.33333 4 4.33333C2.34315 4.33333 1 5.67648 1 7.33333C1 8.99019 2.34315 10.3333 4 10.3333Z" fill="currentColor" />
                            </svg>
                        }
                    </span>
                </RadarAntdButton>
            </div>
        </div>
    );
};