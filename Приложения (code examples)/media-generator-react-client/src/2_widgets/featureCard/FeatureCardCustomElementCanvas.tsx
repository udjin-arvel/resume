import React from 'react'
import styles from './FeatureCardCustomElementCanvas.module.css'
import { NavLink } from 'react-router'

interface IFeatureCardProps {
    icon?: React.ReactNode,
    title?: string,
    text?: string,
    tags?: Array<{ label: string, icon?: string, backgroundColor?: string }>,
    photo?: string,
    additionalPhoto?: string,
    url?: string,
    style?: React.CSSProperties,
}

export const FeatureCardCustomElementCanvas: React.FC<IFeatureCardProps> = ({ title, text, tags, photo, additionalPhoto, icon, url, style }) => {
    return (
        <NavLink to={url ?? ''} className={styles.featureCard_customElementCanvas} style={style} viewTransition>
            <div className={styles.featureCard_customElementCanvas__wrapper}>
                <div className={styles.featureCard_customElementCanvas__content}>
                    {icon ?? null}
                    <div className={styles.featureCard_customElementCanvas__txtContent}>
                        <p className="title_secondary" style={{maxWidth: 245, color: 'var(--color-text-dk-primary)'}}>{title ?? ''}</p>
                        <p className="text_primary" style={{maxWidth: '90%', color: 'var(--color-text-dk-primary)'}}>{text ?? ''}</p>
                        {tags &&
                            <div className={styles.featureCard__tagsBlock}>
                                {tags?.map(_ => (
                                    <span
                                        key={_.label}
                                        className={`text_tertiary ${styles.featureCard__tag}`}
                                        style={{
                                            backgroundColor: _.backgroundColor ?? '',
                                            color: _.backgroundColor ? 'var(--color-text-lt-primary)' : ''
                                        }}
                                    >
                                        {_.icon && <img src={_.icon} alt='' width={16} height={16} />}
                                        {_.label}
                                    </span>
                                ))}
                            </div>
                        }
                    </div>
                </div>
                <div className={styles.featureCard__photo_customElementCanvas}>
                    <img src={photo} srcSet={additionalPhoto} alt={title} />
                </div>
            </div>
        </NavLink>
    )
}