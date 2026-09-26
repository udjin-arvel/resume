import { useNavigate } from 'react-router'
import { RadarAntdButton, useBreadcrumbLabel } from '@shared'
import styles from './UnderDevelopment.module.css'

export const UnderDevelopmentPage: React.FC = () => {
    const navigate = useNavigate()
    useBreadcrumbLabel('/under-development', 'Раздел в разработке')
    return (
        <section className={styles.underDev} aria-labelledby="under-dev-title">
            <div className={styles.underDev__iconBlock} aria-hidden>
                <span className={styles.underDev__accent} />
                <svg className={styles.underDev__icon} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="16" y="30" width="48" height="34" rx="6" stroke="currentColor" strokeWidth="3" fill="none" />
                    <path d="M28 47l8 8 16-16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
            <h1 id="under-dev-title" className={`${styles.underDev__title} title_secondary`}>
                Раздел в разработке
            </h1>
            <p className={`${styles.underDev__description} text_primary`}>
                Мы работаем над этим разделом. Скоро он будет доступен — возвращайтесь позже.
            </p>
            <div className={styles.underDev__actions}>
                <RadarAntdButton onClick={() => navigate('/')}>
                    <span style={{ fontWeight: 600 }}>На главную</span>
                </RadarAntdButton>
                <button
                    type="button"
                    className={styles.underDev__outlineBtn}
                    onClick={() => navigate(-1)}
                >
                    Назад
                </button>
            </div>
        </section>
    )
}
