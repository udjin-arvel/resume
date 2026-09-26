import { NavLink } from 'react-router'
import styles from './mainPageSidebarContent.module.css'
import { NAVIGATION_CONFIG, NAVIGATION_ICONS } from '@entities'

export const MainPageSidebarContent = () => {
    return (
        <nav>
            <ul className={styles.sidebar__navigationList}>
                {NAVIGATION_CONFIG.map(item => item.isActive && (
                    <li key={item.id} className={styles.sidebar__navigationItem}>
                        <NavLink
                            viewTransition
                            to={item.path}
                            className={({ isActive }) => isActive ? `${styles.sidebar__navigationLink} ${styles.sidebar__navigationLink_active}` : styles.sidebar__navigationLink}
                        >
                            <div className={styles.sidebar__navigationItemIcon}>
                                {NAVIGATION_ICONS[item.iconKey as keyof typeof NAVIGATION_ICONS]}
                            </div>
                            <span className={styles.sidebar__navigationItemText}>{item.label}</span>
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    )
}