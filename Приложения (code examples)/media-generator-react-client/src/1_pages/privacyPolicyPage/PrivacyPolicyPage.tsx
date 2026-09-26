import styles from './PrivacyPolicyPage.module.css'
import { MainLogo } from '@shared'

export const PrivacyPolicyPage = () => {
    return (
        <main className={styles.page}>
            <MainLogo />
            <span className="text_secondary">Тут будет политика конфиденциальности</span>
        </main>
    )
}
