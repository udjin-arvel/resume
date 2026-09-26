import styles from './PhotoEditorPage.module.css'
import { PhotoEditorWidget } from '@widgets'

export const PhotoEditorPage = () => {
    return (
        <>
            <section>
                <PhotoEditorWidget />
            </section>
            <section className={styles.page__promoContent}>
                <div className={styles.page__textBlock}>
                    <h2 className="title_primary" style={{ textAlign: 'center' }}>
                        Редактирование<br />
                        изображений
                    </h2>
                    <p className="text_secondary" style={{ textAlign: 'center', maxWidth: 600 }}>
                        Изменяйте любую часть фотографии с помощью ИИ – выделите нужную область и опишите, что хотите поменять. Воспользуйтесь быстрой функцией удаления фона с фотографии
                    </p>
                </div>
                <div className={styles.page__gallery}>
                    <div className={styles.page__galleryItem}>
                        <img src='/photo_editor_demo_1.avif' srcSet='/photo_editor_demo_1.jpg' alt="Image 1" />
                    </div>
                    <div className={styles.page__galleryItem}>
                        <img src='/photo_editor_demo_2.avif' srcSet='/photo_editor_demo_2.jpg' alt="Image 2" />
                    </div>
                </div>
            </section>
        </>
    )
}