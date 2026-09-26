import styles from './VideoGeneration.module.css'
import { GenerationControlWidget } from '@widgets'
import { PhotoGrid } from '@features'

export const VideoGenerationPage = () => {

    return (
        <>
            <section>
                <GenerationControlWidget generationType='video' />
            </section>
            <section className={styles.page__promoContent}>
                <div className={styles.page__textBlock}>
                    <h2 className="title_primary" style={{ textAlign: 'center' }}>
                        Создавайте профессиональные видео с помощью AI
                    </h2>
                    <p className="text_secondary" style={{ textAlign: 'center', maxWidth: 600 }}>
                        Оживляйте фотографии, превращайте несколько изображений в стильные видеоролики или генерируйте уникальные видео за считанные секунды. Искусственный интеллект помогает легко создавать эффектный и динамичный контент
                    </p>
                </div>
                <PhotoGrid />
            </section>
        </>
    )
}