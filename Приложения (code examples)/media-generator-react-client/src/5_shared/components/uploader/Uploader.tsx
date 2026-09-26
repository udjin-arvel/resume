import { MAX_IMAGES_LIMIT } from '@shared'
import styles from './Uploader.module.css'
import { Upload } from 'antd'
import type { UploadProps } from 'antd'

type TPrettify<T> = {
    [K in keyof T]: T[K]
} & {}
interface IUploaderProps extends UploadProps {
    children?: React.ReactNode,
    radarSize: 'small' | 'large',
    filesCount?: number,
    limit?: number,
    disabled?: boolean,
    title?: string,
    subtitle?: string,
}
export const Uploader: React.FC<TPrettify<IUploaderProps>> = ({
    children,
    radarSize = 'small',
    filesCount = 0,
    limit = MAX_IMAGES_LIMIT,
    disabled = false,
    title,
    subtitle,
    ...rest
}) => {
    return (
        <Upload {...rest} disabled={disabled}>
            {children && children}
            {!children && radarSize === 'small' &&
                <div className={disabled ? `${styles.uploader_wrapper} ${styles.uploader_wrapper_disabled}` : styles.uploader_wrapper}>
                    <div className={disabled ? `${styles.uploader_small} ${styles.uploader_small_disabled}` : styles.uploader_small}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="18" fill="none">
                            <path fill="currentColor" d="M4.0062 8.1637c-.4833-1.7944-.1445-3.265.6016-4.3587.757-1.1097 1.9649-1.8755 3.2775-2.1708 1.3117-.2951 2.6763-.11 3.7581.6087 1.0667.7086 1.9449 1.9935 2.1922 4.074a.75.75 0 0 0 .7448.6615c2.1346 0 3.3106 1.4751 3.4125 3.0861.1009 1.5973-.8676 3.3578-3.2837 3.8372a.75.75 0 1 0 .2919 1.4713c3.1705-.6291 4.6361-3.0731 4.4888-5.4031-.1355-2.144-1.6489-4.167-4.259-4.4562-.3876-2.1146-1.3991-3.6179-2.7575-4.5202-1.4737-.979-3.27-1.1933-4.9173-.8227-1.6465.3704-3.196 1.3356-4.1875 2.789-.9045 1.3258-1.3193 3.0222-.9564 4.9572C1.578 8.3283.95 8.8793.5413 9.5274c-.5047.8005-.6447 1.7035-.469 2.5586.3507 1.7062 1.9142 3.1142 4.0897 3.3713a.75.75 0 0 0 .176-1.4897c-1.6339-.193-2.595-1.2043-2.7964-2.1836-.1002-.4877-.023-.9941.2686-1.4566.2936-.4656.8346-.932 1.7329-1.2655a.75.75 0 0 0 .4631-.8982" />
                            <path fill="currentColor" d="M9.2196 9.974a.75.75 0 0 1 1.0607 0l2 2a.75.75 0 0 1-1.0607 1.0607L10.5 12.315v4.1894a.75.75 0 0 1-1.5 0V12.315l-.7197.7197a.75.75 0 1 1-1.0607-1.0607z" />
                        </svg>
                        <div className={styles.uploader__textBlock}>
                            <p className="text_secondary" style={{ fontWeight: 600 }}>{title ?? 'Загрузите фото предмета или модели'}</p>
                            <div className={styles.textBlock__footer}>
                                <span className="text_tertiary" style={{ opacity: disabled ? 0.5 : 1 }}>{subtitle ?? 'Или перетащите файл'}</span>
                                <span className="text_tertiary" style={{ flex: '0 0 auto', opacity: disabled ? 0.5 : 1 }}>{filesCount}&nbsp;/&nbsp;{limit}</span>
                            </div>
                        </div>
                    </div>
                </div>
            }
            {!children && radarSize === 'large' &&
                <div className={disabled ? `${styles.uploader_large} ${styles.uploader_large_disabled}` : styles.uploader_large}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="18" fill="none">
                        <path fill="currentColor" d="M4.0062 8.1637c-.4833-1.7944-.1445-3.265.6016-4.3587.757-1.1097 1.9649-1.8755 3.2775-2.1708 1.3117-.2951 2.6763-.11 3.7581.6087 1.0667.7086 1.9449 1.9935 2.1922 4.074a.75.75 0 0 0 .7448.6615c2.1346 0 3.3106 1.4751 3.4125 3.0861.1009 1.5973-.8676 3.3578-3.2837 3.8372a.75.75 0 1 0 .2919 1.4713c3.1705-.6291 4.6361-3.0731 4.4888-5.4031-.1355-2.144-1.6489-4.167-4.259-4.4562-.3876-2.1146-1.3991-3.6179-2.7575-4.5202-1.4737-.979-3.27-1.1933-4.9173-.8227-1.6465.3704-3.196 1.3356-4.1875 2.789-.9045 1.3258-1.3193 3.0222-.9564 4.9572C1.578 8.3283.95 8.8793.5413 9.5274c-.5047.8005-.6447 1.7035-.469 2.5586.3507 1.7062 1.9142 3.1142 4.0897 3.3713a.75.75 0 0 0 .176-1.4897c-1.6339-.193-2.595-1.2043-2.7964-2.1836-.1002-.4877-.023-.9941.2686-1.4566.2936-.4656.8346-.932 1.7329-1.2655a.75.75 0 0 0 .4631-.8982" />
                        <path fill="currentColor" d="M9.2196 9.974a.75.75 0 0 1 1.0607 0l2 2a.75.75 0 0 1-1.0607 1.0607L10.5 12.315v4.1894a.75.75 0 0 1-1.5 0V12.315l-.7197.7197a.75.75 0 1 1-1.0607-1.0607z" />
                    </svg>
                    <div className={`${styles.uploader__textBlock} ${styles.uploader__textBlock_large}`}>
                        <p className="title_secondary">{title ?? 'Загрузите фото предмета или модели'}</p>
                        <span className="text_tertiary">{subtitle ?? 'Или перетащите файл'}</span>
                    </div>
                </div>
            }
        </Upload>
    )
}
<source src="/videos/pages/home/hero/hero.webm?updated=20240607144404" type="video/webm"></source>
