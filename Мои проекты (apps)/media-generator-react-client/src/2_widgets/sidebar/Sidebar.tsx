import React, { useState } from 'react'
import styles from './Sidebar.module.css'
import { RADAR_COLOR_SCHEME, RadarSwitch, useTheme, MainLogo, API } from '@shared'
import { NavLink, useMatch } from 'react-router'
import { MainPageSidebarContent } from './sidebarContent/mainPageSidebarContent'
import { ImageGenerationSidebarContent } from './sidebarContent/ImageGenerationSidebarContent'
import { VideoGenerationSidebarContent } from './sidebarContent/VideoGenerationSidebarContent'
import { ImageUpscalingSidebarContent } from './sidebarContent/ImageUpscalingSidebarContent'
import { CardInfographicsSidebarContent } from './sidebarContent/CardInfographicsSidebarContent'
import { AiChatSidebarContent } from './sidebarContent/AiChatSidebarContent'

interface ISidebarProps {
    style?: React.CSSProperties
    defaultSidebarState?: 'collapsed' | 'expanded'
}

export const Sidebar: React.FC<ISidebarProps> = ({ style, defaultSidebarState = 'expanded' }) => {
    const { data: userData } = API.useGetUserDataQuery();
    const { theme, toggle } = useTheme()
    const [isCollapsed, setIsCollapsed] = useState(defaultSidebarState === 'collapsed')
    const isMainPage = Boolean(useMatch('/'))
    const isImageGeneration = Boolean(useMatch('/image-generation'))
    const isImageUpscaling = Boolean(useMatch('/image-upscaling'))
    const isVideoGeneration = Boolean(useMatch('/video-generation'))
    const isAiChat = Boolean(useMatch('/ai-chat'))
    const isCardInfographics = Boolean(useMatch('/card-infographics'))
    const isMainSidebarNav =
        !isImageGeneration && !isImageUpscaling && !isVideoGeneration && !isAiChat && !isCardInfographics

    return (
        <aside className={styles.sidebar} data-collapsed={isCollapsed} style={style}>
            <div className={styles.sidebar__topWrapper}>
                {/* --- sidebar headers */}
                <header className={styles.sidebar__header}>
                    <div className={styles.sidebar__logoWrapper} data-collapsed={isCollapsed}>
                        <div className={styles.sidebar__logo}>
                            <NavLink to='/' viewTransition={!isMainPage}>
                                {/* <Logo /> */}
                                <MainLogo />
                            </NavLink>
                        </div>
                        <button
                            className={styles.sidebar__button}
                            onClick={() => setIsCollapsed(v => !v)}
                            aria-label={isCollapsed ? 'Развернуть меню' : 'Свернуть меню'}
                        >
                            <svg width="17" height="12" viewBox="0 0 17 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M0 0.625C0 0.279822 0.279822 0 0.625 0C0.970178 0 1.25 0.279822 1.25 0.625V10.625C1.25 10.9702 0.970178 11.25 0.625 11.25C0.279822 11.25 0 10.9702 0 10.625V0.625Z" fill="currentColor" />
                                <path fillRule="evenodd" clipRule="evenodd" d="M6.69752 1.71424C6.93106 1.81098 7.08334 2.03888 7.08334 2.29167V5H15.625C15.9702 5 16.25 5.27982 16.25 5.625C16.25 5.97018 15.9702 6.25 15.625 6.25H7.08334V8.95834C7.08334 9.21113 6.93106 9.43903 6.69752 9.53576C6.46397 9.6325 6.19515 9.57903 6.0164 9.40028L3.86157 7.24545C2.96662 6.3505 2.96662 4.8995 3.86157 4.00455L6.0164 1.84972C6.19515 1.67098 6.46397 1.6175 6.69752 1.71424ZM5.83333 5.625L5.83334 5.62785V7.44946L4.74545 6.36157C4.33866 5.95477 4.33866 5.29523 4.74545 4.88843L5.83334 3.80055V5.62215L5.83333 5.625Z" fill="currentColor" />
                            </svg>
                        </button>
                    </div>
                    {userData && <div className={styles.sidebar__footerCard} data-collapsed={isCollapsed} style={{ cursor: 'default' }}>
                        <div className={styles.sidebar__footerCardIcon} data-collapsed={isCollapsed}>
                            <svg width="14" height="17" viewBox="0 0 14 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M10.8333 4.16667C10.8333 6.46785 8.96785 8.33333 6.66667 8.33333C4.36548 8.33333 2.5 6.46785 2.5 4.16667C2.5 1.86548 4.36548 0 6.66667 0C8.96785 0 10.8333 1.86548 10.8333 4.16667ZM9.58333 4.16667C9.58333 5.7775 8.2775 7.08333 6.66667 7.08333C5.05584 7.08333 3.75 5.7775 3.75 4.16667C3.75 2.55584 5.05584 1.25 6.66667 1.25C8.2775 1.25 9.58333 2.55584 9.58333 4.16667Z" fill="currentColor" />
                                <path fillRule="evenodd" clipRule="evenodd" d="M13.3333 12.9167C13.3333 14.9877 10.3486 16.6667 6.66667 16.6667C2.98477 16.6667 0 14.9877 0 12.9167C0 10.8456 2.98477 9.16667 6.66667 9.16667C10.3486 9.16667 13.3333 10.8456 13.3333 12.9167ZM12.0833 12.9167C12.0833 13.3 11.7939 13.9017 10.7679 14.4788C9.78106 15.0339 8.3336 15.4167 6.66667 15.4167C4.99974 15.4167 3.55228 15.0339 2.56545 14.4788C1.53944 13.9017 1.25 13.3 1.25 12.9167C1.25 12.5333 1.53944 11.9316 2.56545 11.3545C3.55228 10.7994 4.99974 10.4167 6.66667 10.4167C8.3336 10.4167 9.78106 10.7994 10.7679 11.3545C11.7939 11.9316 12.0833 12.5333 12.0833 12.9167Z" fill="currentColor" />
                            </svg>
                        </div>

                        <div className={styles.sidebar__footerCardInfo} data-collapsed={isCollapsed}>
                            <span className={styles.sidebar__footerCardLabel}>{userData.email ?? ''}</span>
                            <span className={styles.sidebar__footerCardValue}>
                                {userData.name ?? ''}
                            </span>
                        </div>
                    </div>}
                </header>
                {/* --- navigation */}
                {isMainSidebarNav && !isCollapsed && <MainPageSidebarContent />}
                {isImageGeneration && !isCollapsed && <ImageGenerationSidebarContent />}
                {isImageUpscaling && !isCollapsed && <ImageUpscalingSidebarContent />}
                {isVideoGeneration && !isCollapsed && <VideoGenerationSidebarContent />}
                {isAiChat && !isCollapsed && <AiChatSidebarContent />}
                {isCardInfographics && !isCollapsed && <CardInfographicsSidebarContent />}
            </div>

            <footer className={styles.sidebar__footer}>
                {/* theme toggle card */}
                <div className={styles.sidebar__footerCard} onClick={(e) => { isCollapsed && toggle(e) }} data-collapsed={isCollapsed} title='Сменить тему (shift+T)'>
                    <div className={styles.sidebar__footerCardIcon} data-collapsed={isCollapsed}>
                        {theme === 'dark' ? (
                            <svg width="13" height="15" viewBox="0 0 13 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M11.6476 1.25025C11.6475 1.25017 11.6474 1.2501 11.6473 1.25003C10.4594 0.460202 9.03344 0 7.5 0C3.35786 0 0 3.35786 0 7.5C0 11.6421 3.35786 15 7.5 15C9.03344 15 10.4594 14.5398 11.6473 13.75C11.6474 13.7499 11.6475 13.7498 11.6476 13.7498C11.654 13.7455 11.6603 13.7413 11.6667 13.737C11.8237 13.6319 11.9766 13.521 12.125 13.4046C12.5057 13.1059 12.1506 12.5 11.6667 12.5C11.5807 12.5 11.4953 12.4978 11.4104 12.4935C11.3673 12.4914 11.3243 12.4886 11.2814 12.4854C11.278 12.4851 11.2746 12.4849 11.2712 12.4846C8.69462 12.283 6.66667 10.1283 6.66667 7.5C6.66667 4.87169 8.69462 2.71704 11.2712 2.51542C11.2746 2.51515 11.278 2.51488 11.2814 2.51462C11.3243 2.51136 11.3673 2.50863 11.4104 2.50645C11.4953 2.50217 11.5807 2.5 11.6667 2.5C12.1506 2.5 12.5057 1.89406 12.125 1.59541C11.9766 1.47902 11.8237 1.3681 11.6667 1.26296C11.6603 1.25871 11.654 1.25447 11.6476 1.25025ZM9.58384 1.60546C7.15609 2.4633 5.41667 4.77852 5.41667 7.5C5.41667 10.2215 7.15609 12.5367 9.58384 13.3945C8.93245 13.6248 8.23129 13.75 7.5 13.75C4.04822 13.75 1.25 10.9518 1.25 7.5C1.25 4.04822 4.04822 1.25 7.5 1.25C8.23129 1.25 8.93245 1.37521 9.58384 1.60546Z" fill="currentColor" />
                            </svg>
                        ) : (
                            <svg width="15" height="17" viewBox="0 0 15 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7.29177 0C7.63695 0 7.91677 0.279822 7.91677 0.625V1.45833C7.91677 1.80351 7.63695 2.08333 7.29177 2.08333C6.94659 2.08333 6.66677 1.80351 6.66677 1.45833V0.625C6.66677 0.279822 6.94659 0 7.29177 0Z" fill="currentColor" />
                                <path fillRule="evenodd" clipRule="evenodd" d="M7.29177 13.125C10.0532 13.125 12.2918 10.8864 12.2918 8.125C12.2918 5.36358 10.0532 3.125 7.29177 3.125C4.53035 3.125 2.29177 5.36358 2.29177 8.125C2.29177 10.8864 4.53035 13.125 7.29177 13.125ZM7.29177 11.875C9.36284 11.875 11.0418 10.1961 11.0418 8.125C11.0418 6.05393 9.36284 4.375 7.29177 4.375C5.2207 4.375 3.54177 6.05393 3.54177 8.125C3.54177 10.1961 5.2207 11.875 7.29177 11.875Z" fill="currentColor" />
                                <path d="M7.91677 14.7917C7.91677 14.4465 7.63695 14.1667 7.29177 14.1667C6.94659 14.1667 6.66677 14.4465 6.66677 14.7917V15.625C6.66677 15.9702 6.94659 16.25 7.29177 16.25C7.63695 16.25 7.91677 15.9702 7.91677 15.625V14.7917Z" fill="currentColor" />
                                <path d="M14.4997 4.09584C14.6723 4.39477 14.5699 4.77702 14.2709 4.94961L13.5492 5.36627C13.2503 5.53886 12.8681 5.43644 12.6955 5.13751C12.5229 4.83857 12.6253 4.45633 12.9243 4.28374L13.6459 3.86707C13.9449 3.69449 14.3271 3.79691 14.4997 4.09584Z" fill="currentColor" />
                                <path d="M0.312604 4.94961C0.0136715 4.77702 -0.0887505 4.39477 0.0838385 4.09584C0.256427 3.79691 0.638671 3.69449 0.937604 3.86707L1.65929 4.28374C1.95822 4.45633 2.06065 4.83857 1.88806 5.13751C1.71547 5.43644 1.33322 5.53886 1.03429 5.36627L0.312604 4.94961Z" fill="currentColor" />
                                <path d="M0.0838385 12.2708C-0.0887505 11.9719 0.0136715 11.5897 0.312604 11.4171L1.03429 11.0004C1.33322 10.8278 1.71547 10.9302 1.88806 11.2292C2.06065 11.5281 1.95822 11.9103 1.65929 12.0829L0.937604 12.4996C0.638671 12.6722 0.256427 12.5698 0.0838385 12.2708Z" fill="currentColor" />
                                <path d="M14.2709 11.4171C14.5699 11.5897 14.6723 11.9719 14.4997 12.2708C14.3271 12.5698 13.9449 12.6722 13.6459 12.4996L12.9243 12.0829C12.6253 11.9103 12.5229 11.5281 12.6955 11.2292C12.8681 10.9302 13.2503 10.8278 13.5492 11.0004L14.2709 11.4171Z" fill="currentColor" />
                            </svg>

                        )}
                    </div>
                    <div className={styles.sidebar__footerCardInfo} data-collapsed={isCollapsed}>
                        <span className={styles.sidebar__footerCardLabel}>Тема</span>
                        <span className={styles.sidebar__footerCardValue}>
                            {theme === 'dark' ? 'Темная' : 'Светлая'}
                        </span>
                    </div>
                    <div className={styles.sidebar__switch} data-collapsed={isCollapsed}>
                        <RadarSwitch
                            checked={theme === 'dark'}
                            onChange={(_, e) => toggle(e as unknown as React.MouseEvent)}
                            style={{
                                backgroundColor: RADAR_COLOR_SCHEME.common.primary,
                            }}
                        />
                    </div>
                </div>
                {/* support */}
                <a href='https://t.me/radar_analytica_support' target='_blank' rel='noopener noreferrer' style={{ cursor: 'pointer' }}>
                    <div className={styles.sidebar__footerCard} data-collapsed={isCollapsed}>
                        <div className={styles.sidebar__footerCardIcon} data-collapsed={isCollapsed}>
                            <svg width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M8.95833 1.25C5.62161 1.25 2.91667 3.95495 2.91667 7.29167V11.4583C2.91667 12.2637 2.26375 12.9167 1.45833 12.9167C0.652918 12.9167 0 12.2637 0 11.4583V9.79167C0 8.74269 0.70479 7.85832 1.66667 7.58626V7.29167C1.66667 3.26459 4.93126 0 8.95833 0C12.9854 0 16.25 3.26459 16.25 7.29167V7.58626C17.2119 7.85832 17.9167 8.74269 17.9167 9.79167V11.4583C17.9167 12.2637 17.2637 12.9167 16.4583 12.9167C16.2277 12.9167 16.0096 12.8631 15.8157 12.7678C14.9624 13.9023 13.0128 15.2422 9.63333 15.401C9.41951 15.7833 9.01076 16.0417 8.54167 16.0417C7.85131 16.0417 7.29167 15.482 7.29167 14.7917C7.29167 14.1013 7.85131 13.5417 8.54167 13.5417C8.9977 13.5417 9.39669 13.7859 9.61501 14.1507C13.167 13.9741 14.6734 12.3849 15.0192 11.6959C15.0066 11.6186 15 11.5392 15 11.4583V7.29167C15 3.95495 12.2951 1.25 8.95833 1.25ZM16.25 8.95826V11.4583C16.25 11.5734 16.3433 11.6667 16.4583 11.6667C16.5734 11.6667 16.6667 11.5734 16.6667 11.4583V9.79167C16.6667 9.45087 16.503 9.1483 16.25 8.95826ZM1.66667 11.4583V8.95826C1.41366 9.1483 1.25 9.45087 1.25 9.79167V11.4583C1.25 11.5734 1.34327 11.6667 1.45833 11.6667C1.57339 11.6667 1.66667 11.5734 1.66667 11.4583Z" fill="currentColor" />
                            </svg>
                        </div>

                        <div className={styles.sidebar__footerCardInfo} data-collapsed={isCollapsed}>
                            <span className={styles.sidebar__footerCardLabel}>Поддержка</span>
                            <span className={styles.sidebar__footerCardValue}>
                                Напишите нам
                            </span>
                        </div>
                    </div>
                </a>
            </footer>
        </aside>
    )
}