import { useNavigate } from 'react-router'
import { RadarAntdButton } from '@shared'
import styles from './NotFoundPage.module.css'

export const NotFoundPage: React.FC = () => {
    const navigate = useNavigate()

    return (
        <section className={styles.notFound} aria-labelledby="not-found-title">
            <div className={styles.notFound__codeBlock}>
                <span className={styles.notFound__accent} aria-hidden />
                <span className={styles.notFound__code}>404</span>
            </div>
            <h1 id="not-found-title" className={`${styles.notFound__title} title_secondary`}>
                Страница не найдена
            </h1>
            <p className={`${styles.notFound__description} text_primary`}>
                Такой страницы нет или ссылка устарела. Вернитесь на главную или выберите раздел в меню.
            </p>
            <div className={styles.notFound__actions}>
                <RadarAntdButton onClick={() => navigate('/')}>
                    <span style={{ fontWeight: 600 }}>На главную</span>
                </RadarAntdButton>
                <button
                    type="button"
                    className={styles.notFound__outlineBtn}
                    onClick={() => navigate(-1)}
                >
                    Назад
                </button>
            </div>
        </section>
    )
}
