import styles from './ImageUpscaling.module.css'
import { UpscalingWidget } from '@widgets'

export const ImageUpscalingPage = () => {

    return (
        <>
            <section>
                <UpscalingWidget />
            </section>
            <section className={styles.page__promoContent}>
                <div className={styles.page__textBlock}>
                    <h2 className="title_primary" style={{ textAlign: 'center' }}>
                        Повышайте качество
                        изображений&nbsp;в&nbsp;один клик
                    </h2>
                    <p className="text_secondary" style={{ textAlign: 'center', maxWidth: 600 }}>
                        Увеличивайте разрешение в 2, 4 или 8 раз без потери четкости. Современные нейросети восстанавливают детали, устраняют шум и делают картинку более резкой — без эффекта размытия
                    </p>
                </div>
                <div className={styles.page__gallery}>
                    <div className={styles.page__galleryItem}>
                        <img src='/upscale_demo_1.avif' srcSet='/upscale_demo_1.png' alt="Image 1" />
                    </div>
                    <div className={styles.page__galleryItem}>
                        <img src='/upscale_demo_2.avif' srcSet='/upscale_demo_2.png' alt="Image 2" />
                    </div>
                </div>
            </section>
        </>
    )
}