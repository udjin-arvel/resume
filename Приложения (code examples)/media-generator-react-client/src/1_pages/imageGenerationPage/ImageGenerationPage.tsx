'use server'
import styles from './ImageGeneration.module.css'
import { GenerationControlWidget } from '@widgets'
import { PhotoGrid } from '@features'

export const ImageGenerationPage = () => {

    
    

    return (
        <>
            <section>
                <GenerationControlWidget generationType='image' />
            </section>
            <section className={styles.page__promoContent}>
                <div className={styles.page__textBlock}>
                    <h2 className="title_primary" style={{ textAlign: 'center' }}>
                        Создавайте профессиональные изображения с помощью AI
                    </h2>
                    <p className="text_secondary" style={{ textAlign: 'center', maxWidth: 380 }}>
                        Генерируйте уникальные визуалы или работайте с готовыми шаблонами – быстрый и качественный результат за секунды
                    </p>
                </div>
                <PhotoGrid />
            </section>
        </>
    )
}