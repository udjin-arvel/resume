import styles from './ChatInputBlockCardInfographics.module.css';
import { RadarAntdInput } from '@shared';
import { Uploader, validateImageFile } from '@shared';
import { message, Upload } from 'antd';
import { useAppSelector, useAppDispatch, useReferenceFiles } from '@app';
import { cardInfographicsActions } from '@entities';

type TPrettify<T> = {
    [K in keyof T]: T[K]
} & {}

interface IChatInputBlockProps {
    label: string;
    placeholder: string;
    typeKey: 'product' | 'infographics';
    uploadButtonLabel?: string;
    uploadButtonIcon?: React.ReactNode;
    isLoading?: boolean,
}

export const ChatInputBlockCardInfographics: React.FC<TPrettify<IChatInputBlockProps>> = ({
    isLoading,
    label,
    placeholder,
    typeKey,
    uploadButtonLabel,
    uploadButtonIcon,
}) => {
    const { productImage, infographicsImage, isGenerationInProgress, productPrompt, infographicsPrompt } = useAppSelector((state) => state.cardInfographics);
    const { unregisterReferenceFile, registerReferenceFile } = useReferenceFiles();
    const dispatch = useAppDispatch();
    const handleRemoveImage = (id: string) => {
        unregisterReferenceFile(id);
        dispatch(cardInfographicsActions.removeImage({ key: typeKey }));
    }

    const currentImage = typeKey === 'product' ? productImage : infographicsImage;
    const currentPrompt = typeKey === 'product' ? productPrompt : infographicsPrompt;

    return (
        <div className={styles.chatInputBlock}>
            {currentImage && <div className={styles.widget__assets}>
                    <div className={styles.widget__assetItem}>
                        {!isGenerationInProgress && <button className={styles.widget__assetRemoveButton} onClick={() => handleRemoveImage(currentImage.id)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" fill="none">
                                <path fill="#fff" d="M1.0734.1842a.6288.6288 0 1 0-.8892.8892L2.1108 3 .1842 4.9266a.6288.6288 0 1 0 .8892.8892L3 3.8892l1.9266 1.9266a.6288.6288 0 1 0 .8892-.8892L3.8892 3l1.9266-1.9266a.6288.6288 0 1 0-.8892-.8892L3 2.1108z" />
                            </svg>
                        </button>}
                        <img src={currentImage.url} alt="asset" />
                    </div>
            </div>}
            <div className={styles.chatInputBlock__promptSection}>
                <label className={`${styles.chatInputBlock__promptSectionLabel} text_secondary`}>{label}</label>
                <RadarAntdInput.Textarea
                    placeholder={placeholder}
                    autoSize={{ minRows: 2, maxRows: 2 }}
                    allowClear={true}
                    disabled={isLoading}
                    value={currentPrompt}
                    onChange={(e) => {
                        dispatch(cardInfographicsActions.setPrompt({ key: typeKey, prompt: e.target.value }));
                    }}
                />
                <div className={styles.chatInputBlock__footer}>
                    <div className={styles.chatInputBlock__controls}>
                        <Uploader
                            radarSize='small'
                            style={{ width: '100%' }}
                            accept='.jpg,.jpeg,.JPEG,.JPG,.png,.webp'
                            fileList={[]}
                            limit={1}
                            filesCount={currentImage ? 1 : 0}
                            title='Загрузите изображение'
                            subtitle='Или перетащите файл'
                            disabled={isLoading}
                            beforeUpload={async (file) => {
                                try {
                                    await validateImageFile(file);
                                    const url = URL.createObjectURL(file);
                                    registerReferenceFile(url, file);
                                    if (typeKey === 'product') {
                                        dispatch(cardInfographicsActions.addImage({ key: 'product', image: { id: url, url } }));
                                    } else {
                                        dispatch(cardInfographicsActions.addImage({ key: 'infographics', image: { id: url, url } }));
                                    }
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
                                disabled={currentImage ? true : false || isLoading}
                            >
                                {uploadButtonIcon ??<svg width="14" height="11" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3.66667 4C4.21895 4 4.66667 3.55228 4.66667 3C4.66667 2.44772 4.21895 2 3.66667 2C3.11438 2 2.66667 2.44772 2.66667 3C2.66667 3.55228 3.11438 4 3.66667 4Z" fill="currentColor" />
                                    <path fillRule="evenodd" clipRule="evenodd" d="M2.66667 0H10.6667C12.1394 0 13.3333 1.19391 13.3333 2.66667V8C13.3333 9.47276 12.1394 10.6667 10.6667 10.6667H2.66667C1.19391 10.6667 0 9.47276 0 8V2.66667C0 1.19391 1.19391 0 2.66667 0ZM10.6667 1H2.66667C1.74619 1 1 1.74619 1 2.66667V8C1 8.25723 1.05827 8.50084 1.16233 8.71836L2.62287 6.71012C3.29482 5.78619 4.69188 5.84796 5.27966 6.8276C5.53396 7.25144 6.16435 7.19787 6.3435 6.73721L7.07921 4.84538C7.54873 3.63803 9.20647 3.51022 9.85553 4.63131L12.1934 8.66948C12.2834 8.46459 12.3333 8.23813 12.3333 8V2.66667C12.3333 1.74619 11.5871 1 10.6667 1ZM2.66667 9.66667C2.37414 9.66667 2.09921 9.5913 1.86024 9.45893L3.43161 7.29829C3.68214 6.95382 4.20302 6.97685 4.42216 7.34209C5.10423 8.47887 6.795 8.33521 7.2755 7.09965L8.01121 5.20783C8.17676 4.78213 8.76126 4.73707 8.9901 5.13235L11.4896 9.44966C11.2468 9.58778 10.966 9.66667 10.6667 9.66667H2.66667Z" fill="currentColor" />
                                </svg>}
                                {uploadButtonLabel ?? 'Загрузить референс'}
                            </button>
                        </Uploader>
                    </div>

                </div>
            </div>
        </div>
    );
};