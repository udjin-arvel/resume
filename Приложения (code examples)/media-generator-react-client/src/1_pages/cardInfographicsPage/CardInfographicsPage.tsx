import styles from './CardInfographicsPage.module.css'
import { CardInfographicsWidget } from '@widgets'

export const CardInfographicsPage = () => {
    return (
        <>
            <section>
                <CardInfographicsWidget />
            </section>
            <section className={styles.page__promoContent}>
                <div className={styles.page__textBlock}>
                    <h2 className="title_primary" style={{ textAlign: 'center' }}>
                        Создание инфографики товара
                    </h2>
                    <p className="text_secondary" style={{ textAlign: 'center', maxWidth: 600 }}>
                        Создавайте продающую инфографику для карточек товара за минуты с помощью ИИ. <br/> Для этого достаточно добавить фото продукции и ключевые характеристики — остальное сделает ИИ
                    </p>
                </div>
                <div className={styles.page__gallery}>
                    <div className={styles.page__galleryItem}>
                        <img src='/card_infographics_demo_1.avif' srcSet='/card_infographics_demo_1.jpg' alt="Image 1" />
                    </div>
                    <div className={styles.page__galleryItem}>
                        <img src='/card_infographics_demo_2.avif' srcSet='/card_infographics_demo_2.jpg' alt="Image 2" />
                    </div>
                </div>
            </section>
        </>
    )
}