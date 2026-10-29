import React, { useRef } from "react";
import styles from './MainPage.module.css'
import { RadarAntdButton } from '@shared'
import { MAIN_PAGE_NAV_CARDS } from '@entities'
import { FeatureCard, FeatureCardCustomElementCanvas } from '@widgets'
import { NavLink } from "react-router";

export const MainPage: React.FC = () => {
    const startRef = useRef<HTMLDivElement>(null)
    return (
        <>
            {/* --- hero screen */}
            <section className={styles.mainPage__heroScreen}>
                <div className={styles.mainPage__heroTitleWrapper}>
                    <h1 className="title_primary" style={{ textAlign: 'center' }}>
                        ИИ-платформа для роста продаж и удобной работы
                        с контентом
                    </h1>
                    <p className="text_secondary">Создавайте, анализируйте, улучшайте — быстрее конкурентов</p>
                </div>
                <NavLink to="/image-generation" viewTransition>
                    <RadarAntdButton
                        shineAnimation
                        icon={
                            <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M8.33333 16.6667C12.9357 16.6667 16.6667 12.9357 16.6667 8.33333C16.6667 3.73096 12.9357 0 8.33333 0C3.73096 0 0 3.73096 0 8.33333C0 12.9357 3.73096 16.6667 8.33333 16.6667ZM8.22003 11.7851C7.02174 12.564 5.41667 11.7265 5.41667 10.3224V6.34424C5.41667 4.94017 7.02174 4.1027 8.22003 4.88154L11.2804 6.87063C12.351 7.56646 12.351 9.1002 11.2804 9.79604L8.22003 11.7851Z" fill="#F9F9F9" />
                            </svg>
                        }
                    // onClick={() =>
                    //     startRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    // }
                    >
                        <span className="text_primary" style={{ fontWeight: 600 }}>Начать работу</span>
                    </RadarAntdButton>
                </NavLink>
            </section>
            {/* --- cards block */}
            <section className={styles.mainPage__cardsBlock} ref={startRef}>
                {MAIN_PAGE_NAV_CARDS.map((_, i) => {
                    if (_.isCustomElement) {
                        return (
                            <FeatureCardCustomElementCanvas
                                key={_.title}
                                {..._}
                            />
                        )
                    }
                    return (
                        <FeatureCard
                            key={_.title}
                            style={{ '--i': i } as React.CSSProperties}
                            {..._}
                        />
                    )
                })}
            </section>
        </>
    )
}