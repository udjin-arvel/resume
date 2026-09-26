import React, { useContext } from 'react'
import styles from './ContentFactoryCanvasLayout.module.css'
import { Sidebar, Header } from '@widgets'
import { Outlet } from 'react-router'
import { AuthContext } from '@app'


export const ContentFactoryCanvasLayout: React.FC = () => {
    const ctx = useContext(AuthContext)
    const isUserExists = Boolean(ctx?.user)
    return (
        <div className={styles.layout}>
            <div className={styles.layout__container}>
                {isUserExists && <Sidebar style={{ zIndex: 2 }} defaultSidebarState='collapsed' />}
                <div className={styles.layout__wrapper}>
                    <Header
                        breadcrumbsTailsOnly={!isUserExists}
                        hasBillingDataBlock={isUserExists}
                        hasNotificationsBlock={isUserExists}
                    />
                </div>
            </div>
            <Outlet />
        </div>
    )
}