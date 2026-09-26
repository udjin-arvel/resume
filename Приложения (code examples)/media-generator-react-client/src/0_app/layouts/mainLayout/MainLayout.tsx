import React from 'react'
import styles from './MainLayout.module.css'
import { Sidebar, Header } from '@widgets'
import { useMatch } from 'react-router'
import { Outlet } from 'react-router'

interface IMainLayoutProps {
    children?: React.ReactNode
}

export const MainLayout: React.FC<IMainLayoutProps> = ({ children }) => {
    const isMainPage = Boolean(useMatch('/'))
    const isAiChatPage = Boolean(useMatch('/ai-chat'))

    return (
        <div className={styles.layout} style={{ maxHeight: isAiChatPage ? '100vh' : 'unset' }}>
            {isMainPage && <div className={styles.gradientBg}></div>}
            <Sidebar />
            <div className={styles.layout__wrapper}>
                <Header />
                <main className={isAiChatPage ? `${styles.layout__content} ${styles.layout__content_fullHeight}` : styles.layout__content}>
                    {children || <Outlet />}
                </main>
            </div>
            {!isMainPage && <div className={styles.gradientBottomBg}></div>}
        </div>
    )
}