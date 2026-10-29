import { useMemo } from 'react';
import styles from './PromptBlock.module.css'
import { Uploader, RadarAntdInput, RadarAntdButton, validateImageFile, MAX_IMAGES_LIMIT, MAX_PROMPT_LENGTH, apiAssetUrl } from '@shared'
import { Upload, message } from 'antd'
import { useAppSelector, useAppDispatch, useReferenceFiles } from '@app'
import { imageGenerationActions, videoGenerationActions } from '@entities'

interface IPromptBlockProps {
    onSubmit: () => void
    isLoading?: boolean,
    additionalButtonAnimationProps?: boolean,
    generationType: 'image' | 'video',
}

export const PromptBlock: React.FC<IPromptBlockProps> = ({
    onSubmit,
    isLoading,
    // additionalButtonAnimationProps,
    generationType
}) => {
    const CURRENT_REDUX_SLICE: 'imageGeneration' | 'videoGeneration' = generationType === 'image' ? 'imageGeneration' : 'videoGeneration';
    const dispatch = useAppDispatch();
    const { registerReferenceFile, unregisterReferenceFile } = useReferenceFiles();
    const { prompt, references, modelType, needToEnchance, selectedSample } = useAppSelector(state => state[CURRENT_REDUX_SLICE]);
    const { isGenerationInProgress } = useAppSelector(state => state[CURRENT_REDUX_SLICE]);
    const length = useAppSelector(state => generationType === 'video' ? state.videoGeneration.length : null);
    const hasSound = useAppSelector(state => generationType === 'video' ? state.videoGeneration.hasSound : null);
    const isUploaderDisbled = references && references.length >= MAX_IMAGES_LIMIT

    const generationPrice = useMemo(() => {
        if (generationType === 'image') {

            let price = modelType?.tokens_per_request ?? 0;
            if (needToEnchance) {
                price += modelType?.tokens_per_improvement ?? 0;
            }
            return price;
        }
        if (generationType === 'video') {
            let price = modelType?.tokens_per_request ?? 0;
            if (modelType?.tokens_per_second && modelType?.basic_video_duration && length && length > modelType?.basic_video_duration) {
                price += modelType.tokens_per_second * (length - modelType.basic_video_duration);
            }
            if (needToEnchance) {
                price += modelType?.tokens_per_improvement ?? 0;
            }
            if (hasSound) {
                price += modelType?.tokens_per_sound ?? 0;
            }
            return price;
        }
        return 0;
    }, [generationType, modelType, length, needToEnchance, hasSound]);
    const referencesLimit = useMemo(() => {
        let limit = 0;
        if (generationType === 'image') {
            if (modelType?.max_input_images) {
                limit = modelType?.max_input_images <= 5 ? modelType?.max_input_images : 5;
            } else {
                limit = 5;
            }
            if (selectedSample) {
                limit -= 1;
            }
            return limit;
        }
        if (generationType === 'video') {
            return 1;
        }
        return 1;
    }, [generationType, modelType]);

    const handleRemoveImage = (id: string, type: 'reference' | 'sample') => {
        if (type === 'reference') {
            unregisterReferenceFile(id);
            if (CURRENT_REDUX_SLICE === 'imageGeneration') {
                dispatch(imageGenerationActions.removeReference({ id }))
            }
            if (CURRENT_REDUX_SLICE === 'videoGeneration') {
                dispatch(videoGenerationActions.removeReference({ id }))
            }
        }
        if (type === 'sample' && CURRENT_REDUX_SLICE === 'imageGeneration') {
            dispatch(imageGenerationActions.setSelectedSample(null))
        }
        if (type === 'sample' && CURRENT_REDUX_SLICE === 'videoGeneration') {
        }
    }

    return (
        <div className={styles.widget}>
            <div className={styles.widget__refsAndUploadBlock}>
                <div className={styles.widget__assets}>
                    {selectedSample && (
                        <div className={styles.widget__assetItem}>
                            {!isGenerationInProgress &&
                                <button className={styles.widget__assetRemoveButton} onClick={() => handleRemoveImage('', 'sample')}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" fill="none">
                                        <path fill="#fff" d="M1.0734.1842a.6288.6288 0 1 0-.8892.8892L2.1108 3 .1842 4.9266a.6288.6288 0 1 0 .8892.8892L3 3.8892l1.9266 1.9266a.6288.6288 0 1 0 .8892-.8892L3.8892 3l1.9266-1.9266a.6288.6288 0 1 0-.8892-.8892L3 2.1108z" />
                                    </svg>
                                </button>}
                            <span className={`text_tertiary ${styles.widget__assetItemNumber}`}>Модель</span>
                            <img src={apiAssetUrl(`/storage/${selectedSample.path_thumbnail ?? selectedSample?.path}`)} alt="asset" />
                        </div>
                    )}
                    {references?.map((file, index) => (
                        <div className={styles.widget__assetItem} key={file.id}>
                            {!isGenerationInProgress && <button className={styles.widget__assetRemoveButton} onClick={() => handleRemoveImage(file.id, 'reference')}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" fill="none">
                                    <path fill="#fff" d="M1.0734.1842a.6288.6288 0 1 0-.8892.8892L2.1108 3 .1842 4.9266a.6288.6288 0 1 0 .8892.8892L3 3.8892l1.9266 1.9266a.6288.6288 0 1 0 .8892-.8892L3.8892 3l1.9266-1.9266a.6288.6288 0 1 0-.8892-.8892L3 2.1108z" />
                                </svg>
                            </button>}
                            <span className={`text_tertiary ${styles.widget__assetItemNumber}`}>#{index + 1}</span>
                            <img src={file.url} alt="asset" />
                        </div>
                    ))}
                </div>
                <Uploader
                    radarSize="small"
                    style={{ pointerEvents: isUploaderDisbled ? 'none' : undefined, width: '100%', }}
                    accept={generationType === 'image' ? '.jpg,.jpeg,.JPEG,.JPG,.png,.webp' : '.jpg,.jpeg,.JPEG,.JPG,.png'}
                    multiple
                    fileList={[]}
                    limit={referencesLimit}
                    filesCount={references?.length ?? 0}
                    disabled={references?.length >= referencesLimit || isGenerationInProgress}
                    beforeUpload={async (file) => {
                        try {
                            if ((references?.length ?? 0) >= MAX_IMAGES_LIMIT) {
                                message.error('Максимальное количество файлов достигнуто');
                                return Upload.LIST_IGNORE;
                            }
                            await validateImageFile(file);
                            const url = URL.createObjectURL(file);
                            registerReferenceFile(url, file);
                            if (CURRENT_REDUX_SLICE === 'imageGeneration') {
                                dispatch(imageGenerationActions.addReference({ id: url, url }))
                            }
                            if (CURRENT_REDUX_SLICE === 'videoGeneration') {
                                dispatch(videoGenerationActions.addReference({ id: url, url }))
                            }
                            return false;
                        } catch (err) {
                            message.error(err instanceof Error ? err.message : 'Ошибка валидации файла');
                            return Upload.LIST_IGNORE;
                        }
                    }}
                    customRequest={({ onSuccess }) => onSuccess?.('ok')}
                />
            </div>
            <div className={styles.widget__promptSection}>
                <div className={styles.widget__promptSectionInput}>
                    <div className={styles.widget__promptSectionSuffix}>
                        <span className="text_tertiary">{prompt.length} / {(modelType?.max_prompt_length ?? MAX_PROMPT_LENGTH)}</span>
                    </div>
                    <RadarAntdInput.Textarea
                        autoSize={{ minRows: 1, maxRows: 3 }}
                        name="prompt"
                        placeholder="Введите ваш промпт..."
                        value={prompt}
                        id='promptTextArea'
                        allowClear={!isGenerationInProgress}
                        disabled={isGenerationInProgress}
                        onPressEnter={(e) => {
                            e.preventDefault();
                            onSubmit();
                        }}
                        onChange={(e) => {
                            const { value } = e.target;
                            if (value.length > (modelType?.max_prompt_length ?? MAX_PROMPT_LENGTH)) {
                                message.error('Максимальное количество символов достигнуто');
                                return;
                            }
                            if (CURRENT_REDUX_SLICE === 'imageGeneration') {
                                dispatch(imageGenerationActions.setPrompt(value))
                            }
                            if (CURRENT_REDUX_SLICE === 'videoGeneration') {
                                dispatch(videoGenerationActions.setPrompt(value))
                            }
                        }}
                    />
                </div>
                <RadarAntdButton
                    style={{ height: 50, flex: '0 0 auto' }}
                    shineAnimation={!isGenerationInProgress}
                    loading={isLoading}
                    disabled={isGenerationInProgress}
                    onClick={onSubmit}
                >
                    <div className={styles.widget__promptButton}>
                        <span style={{ fontWeight: 700 }}>
                            {isLoading
                                ? 'Отправляем запрос...'
                                : generationType === 'image'
                                    ? (<>
                                        {`Создать изображение за ${generationPrice} `}
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" clipRule="evenodd" d="M4.48939 5.67406C4.32128 5.21976 3.67872 5.21976 3.51061 5.67406L3.27791 6.30294C3.22505 6.44577 3.11244 6.55839 2.96961 6.61124L2.34073 6.84394C1.88642 7.01205 1.88642 7.65461 2.34073 7.82272L2.96961 8.05543C3.11244 8.10828 3.22505 8.2209 3.27791 8.36373L3.51061 8.9926C3.67872 9.44691 4.32128 9.44691 4.48939 8.99261L4.7221 8.36373C4.77495 8.2209 4.88756 8.10828 5.03039 8.05543L5.65927 7.82272C6.11358 7.65461 6.11358 7.01205 5.65927 6.84394L5.03039 6.61124C4.88756 6.55839 4.77495 6.44577 4.7221 6.30294L4.48939 5.67406ZM4 7.04286C3.91675 7.15235 3.81902 7.25009 3.70953 7.33333C3.81902 7.41658 3.91675 7.51431 4 7.62381C4.08325 7.51431 4.18098 7.41658 4.29047 7.33333C4.18098 7.25009 4.08325 7.15235 4 7.04286Z" fill="currentColor" />
                                            <path fillRule="evenodd" clipRule="evenodd" d="M7.94471 7.99991C7.95386 7.99997 7.96302 8 7.97219 8C10.1967 8 12 6.20914 12 4C12 1.79086 10.1967 0 7.97219 0C5.97641 0 4.31966 1.44152 4.00006 3.33333C4.00004 3.33333 4.00008 3.33333 4.00006 3.33333C1.79092 3.33333 0 5.12419 0 7.33333C0 9.54247 1.79086 11.3333 4 11.3333C5.98203 11.3333 7.62736 9.89176 7.94471 7.99991ZM7.98631 6.99997C9.64819 6.99242 10.993 5.65218 10.993 4C10.993 2.34315 9.64056 1 7.97219 1C6.48966 1 5.25656 2.06058 5.00024 3.45941C6.62143 3.87679 7.84481 5.28499 7.98631 6.99997ZM4 10.3333C5.65685 10.3333 7 8.99019 7 7.33333C7 5.67648 5.65685 4.33333 4 4.33333C2.34315 4.33333 1 5.67648 1 7.33333C1 8.99019 2.34315 10.3333 4 10.3333Z" fill="currentColor" />
                                        </svg>
                                    </>)
                                    : generationType === 'video'
                                        ? (<>
                                            {`Создать видеообложку за ${generationPrice} `}
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path fillRule="evenodd" clipRule="evenodd" d="M4.48939 5.67406C4.32128 5.21976 3.67872 5.21976 3.51061 5.67406L3.27791 6.30294C3.22505 6.44577 3.11244 6.55839 2.96961 6.61124L2.34073 6.84394C1.88642 7.01205 1.88642 7.65461 2.34073 7.82272L2.96961 8.05543C3.11244 8.10828 3.22505 8.2209 3.27791 8.36373L3.51061 8.9926C3.67872 9.44691 4.32128 9.44691 4.48939 8.99261L4.7221 8.36373C4.77495 8.2209 4.88756 8.10828 5.03039 8.05543L5.65927 7.82272C6.11358 7.65461 6.11358 7.01205 5.65927 6.84394L5.03039 6.61124C4.88756 6.55839 4.77495 6.44577 4.7221 6.30294L4.48939 5.67406ZM4 7.04286C3.91675 7.15235 3.81902 7.25009 3.70953 7.33333C3.81902 7.41658 3.91675 7.51431 4 7.62381C4.08325 7.51431 4.18098 7.41658 4.29047 7.33333C4.18098 7.25009 4.08325 7.15235 4 7.04286Z" fill="currentColor" />
                                                <path fillRule="evenodd" clipRule="evenodd" d="M7.94471 7.99991C7.95386 7.99997 7.96302 8 7.97219 8C10.1967 8 12 6.20914 12 4C12 1.79086 10.1967 0 7.97219 0C5.97641 0 4.31966 1.44152 4.00006 3.33333C4.00004 3.33333 4.00008 3.33333 4.00006 3.33333C1.79092 3.33333 0 5.12419 0 7.33333C0 9.54247 1.79086 11.3333 4 11.3333C5.98203 11.3333 7.62736 9.89176 7.94471 7.99991ZM7.98631 6.99997C9.64819 6.99242 10.993 5.65218 10.993 4C10.993 2.34315 9.64056 1 7.97219 1C6.48966 1 5.25656 2.06058 5.00024 3.45941C6.62143 3.87679 7.84481 5.28499 7.98631 6.99997ZM4 10.3333C5.65685 10.3333 7 8.99019 7 7.33333C7 5.67648 5.65685 4.33333 4 4.33333C2.34315 4.33333 1 5.67648 1 7.33333C1 8.99019 2.34315 10.3333 4 10.3333Z" fill="currentColor" />
                                            </svg>
                                        </>)
                                        : 'Сгенерировать'
                            }
                        </span>
                    </div>
                </RadarAntdButton>
            </div >
        </div >
    )
}