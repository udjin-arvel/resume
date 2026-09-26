import React from 'react'
import { ConfigProvider, Select } from 'antd'
import type { SelectProps } from 'antd'
import styles from './RadarModelSelectSmall.module.css'
import { apiAssetUrl } from '@/5_shared/сonstants/constants'
import { useTheme } from '@shared'

interface IRadarModelSelectSmallProps extends SelectProps {
    options: { label: string, value: string, image?: string, price?: number | null, icon: string | null }[] | undefined,
    style?: React.CSSProperties
}

export const RadarModelSelectSmall: React.FC<IRadarModelSelectSmallProps> = (props) => {
    const { options, style, value, onChange, ...restProps } = props
    const { theme } = useTheme()
    return (
        <ConfigProvider
            theme={{
                components: {
                    Select: {
                        controlHeight: 24,
                        colorBorder: 'transparent',
                        activeBorderColor: 'transparent',
                        hoverBorderColor: 'transparent',
                        activeOutlineColor: 'transparent',
                        optionPadding: 0,
                        // optionHeight: 40,
                        optionActiveBg: 'transparent',
                        optionSelectedBg: 'transparent',
                    }
                }
            }}
        >
            <Select
                options={options}
                value={value}
                placeholder='Выберите модель'
                style={{ maxWidth: 100, padding: '0 8px', ...style }}
                className={styles.modelSelect}
                popupMatchSelectWidth={false}
                getPopupContainer={(triggerNode) => triggerNode.parentElement as HTMLElement}
                suffixIcon={
                    <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg" className='ant-select-arrow'>
                        <path d="M0.75 0.75L5.75 5.75L10.75 0.75" stroke="#8C8C8C" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                }
                optionRender={(option) => {
                    const { price, icon } = props.options?.find(opt => opt.value === option.value) ?? {}
                    return (
                        <OptionRender
                            option={option}
                            image={icon}
                            price={price ?? 0}
                            theme={theme}
                        />
                    )
                }}
                onChange={onChange}
                {...restProps}
            />
        </ConfigProvider>
    )
}

const OptionRender = ({ option, image, price, theme }: { option: any; image?: string | null; price?: number, theme: "light" | "dark" }) => {
    const { label: labelText } = option
    return (
        <div className={styles.optionRender}>
            <div className={styles.optionRender__image}>
                <img src={image ? apiAssetUrl(image) : ''} alt={labelText} width={16} height={16} style={{ filter: theme === 'light' ? 'invert(1)' : 'invert(0)' }} />
            </div>
            <div className={styles.optionRender__textBlock}>
                <div className={styles.optionRender__header}>
                    <span className={`text_secondary ${styles.optionRender__title}`} title={labelText}>{labelText}</span>
                    <span className={`text_secondary ${styles.optionRender__price}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none">
                            <path fill="#5329ff" fillRule="evenodd" d="M4.4894 5.674c-.1681-.4542-.8107-.4542-.9788 0l-.2327.629a.522.522 0 0 1-.3083.3082l-.6289.2327c-.4543.1682-.4543.8107 0 .9788l.629.2327a.522.522 0 0 1 .3082.3083l.2327.6289c.1681.4543.8107.4543.9788 0l.2327-.6289a.522.522 0 0 1 .3083-.3083l.6289-.2327c.4543-.168.4543-.8106 0-.9788l-.629-.2327a.522.522 0 0 1-.3082-.3083zM4 7.043a1.52 1.52 0 0 1-.2905.2904c.1095.0833.2073.181.2905.2905a1.52 1.52 0 0 1 .2905-.2905A1.52 1.52 0 0 1 4 7.043" clipRule="evenodd" />
                            <path fill="#5329ff" fillRule="evenodd" d="M7.9447 8h.0275C10.1967 8 12 6.2091 12 4s-1.8033-4-4.0278-4C5.9764 0 4.3197 1.4415 4 3.3333c-2.2091 0-4 1.7909-4 4s1.7909 4 4 4c1.982 0 3.6274-1.4415 3.9447-3.3334m.0416-1c1.6619-.0076 3.0067-1.3478 3.0067-3 0-1.6568-1.3524-3-3.0208-3-1.4825 0-2.7156 1.0606-2.972 2.4594C6.6214 3.8768 7.8448 5.285 7.9863 7M4 10.3333c1.6569 0 3-1.3431 3-3s-1.3431-3-3-3-3 1.3432-3 3 1.3432 3 3 3" clipRule="evenodd" />
                        </svg>
                        {price ?? '—'}
                    </span>
                </div>
                {/* --- waiting for the description */}
                {/* <span className={`text_tertiary ${styles.optionRender__description}`}>Описание модели, для чего подходит</span> */}
            </div>

        </div>
    )
}