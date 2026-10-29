import { useEffect, useCallback } from "react"
import { Select, ConfigProvider } from "antd"
import styles from './RadarModelSelect.module.css'
import type { SelectProps } from "antd"
import { RADAR_COLOR_SCHEME, useTheme, apiAssetUrl } from "@shared"
import type { TGenerationType } from "@shared/models/models"

export type TRadarModelSelectTaskType = Extract<
    TGenerationType,
    "edit_image" | "video_preview" | "improve_quality"
>

const STORAGE_KEY_PREFIX = "radar.selectedModel"

function getStoredModelId(taskType: TRadarModelSelectTaskType): string | null {
    try {
        return localStorage.getItem(`${STORAGE_KEY_PREFIX}:${taskType}`)
    } catch {
        return null
    }
}

function setStoredModelId(taskType: TRadarModelSelectTaskType, modelId: string) {
    try {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}:${taskType}`, modelId)
    } catch {
        /* ignore */
    }
}

const modelSelectLightTheme = {
    token: {
        borderRadius: 12,
    },
    components: {
        Select: {
            controlHeight: 60,
            colorBorder: RADAR_COLOR_SCHEME.light.borderMuted,
            activeBorderColor: RADAR_COLOR_SCHEME.light.borderMuted,
            hoverBorderColor: RADAR_COLOR_SCHEME.light.borderMuted,
            activeOutlineColor: 'transparent',
            optionPadding: 0,
            optionHeight: 40,
            optionActiveBg: 'transparent',
            optionSelectedBg: 'transparent',
        }
    }
}
const modelSelectDarkTheme = {
    token: {
        borderRadius: 12,
    },
    components: {
        Select: {
            controlHeight: 60,
            colorBorder: RADAR_COLOR_SCHEME.dark.borderMuted,
            activeBorderColor: RADAR_COLOR_SCHEME.dark.borderMuted,
            hoverBorderColor: RADAR_COLOR_SCHEME.dark.borderMuted,
            activeOutlineColor: 'transparent',
            optionPadding: 0,
            optionHeight: 40,
            optionActiveBg: 'transparent',
            optionSelectedBg: 'transparent',
            boxShadowSecondary: '0 6px 16px 0 rgba(0, 0, 0, 0.18), 0 3px 6px -4px rgba(0, 0, 0, 0.22), 0 9px 28px 8px rgba(0, 0, 0, 0.15)'
        }
    }
}

interface IRadarModelSelectProps extends SelectProps {
    options: { label: string, value: string, image?: string, price?: number | null, icon: string | null }[] | undefined
    taskType: TRadarModelSelectTaskType
}

export const RadarModelSelect: React.FC<IRadarModelSelectProps> = (props) => {
    const { theme } = useTheme()
    const { taskType, onChange, value, options, ...restProps } = props

    useEffect(() => {
        if (!onChange || !options?.length) return
        const stored = getStoredModelId(taskType)
        const match = stored ? options.find((o) => o.value === stored) : undefined
        if (match && value !== stored) onChange(stored, match)
    }, [taskType, options, value, onChange])

    const handleChange = useCallback<NonNullable<SelectProps["onChange"]>>(
        (nextValue, option) => {
            if (taskType && typeof nextValue === "string") {
                setStoredModelId(taskType, nextValue)
            }
            onChange?.(nextValue, option)
        },
        [taskType, onChange]
    )

    return (
        <ConfigProvider theme={theme === 'light' ? modelSelectLightTheme : modelSelectDarkTheme}>
            <Select
                style={{ padding: 4, paddingRight: 12 }}
                {...restProps}
                disabled={options?.length === 1 || restProps.disabled}
                options={options}
                value={value}
                onChange={handleChange}
                labelRender={(label) => {
                    const { price, icon } = props.options?.find(opt => opt.value === label.value) ?? {}
                    return (
                        <LabelRender
                            label={label}
                            image={icon}
                            price={price ?? 0}
                            theme={theme}
                        />
                    )
                }}
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
                suffixIcon={options?.length === 1 ? false : (
                    <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg" className='ant-select-arrow'>
                        <path d="M0.75 0.75L5.75 5.75L10.75 0.75" stroke="#8C8C8C" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                )}
                getPopupContainer={(triggerNode) => triggerNode.parentElement as HTMLElement}
            />
        </ConfigProvider>
    )
}

const LabelRender = ({ label, image, price, theme }: { label: any, image?: string | null, price?: number, theme: "light" | "dark" }) => {
    const { label: labelText } = label
    return (
        <div className={styles.labelRender}>
            <div className={styles.labelRender__image}>
                <img src={image ? apiAssetUrl(image) : ''} alt={labelText} style={{ filter: theme === 'light' ? 'invert(1)' : 'invert(0)' }} />
            </div>
            <div className={styles.labelRender__textBlock}>
                <span className={`text_primary ${styles.labelRender__title}`} style={{ fontWeight: 600 }} title={labelText}>{labelText}</span>
                <span className={`text_secondary ${styles.labelRender__price}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none">
                        <path fill="#5329ff" fillRule="evenodd" d="M4.4894 5.674c-.1681-.4542-.8107-.4542-.9788 0l-.2327.629a.522.522 0 0 1-.3083.3082l-.6289.2327c-.4543.1682-.4543.8107 0 .9788l.629.2327a.522.522 0 0 1 .3082.3083l.2327.6289c.1681.4543.8107.4543.9788 0l.2327-.6289a.522.522 0 0 1 .3083-.3083l.6289-.2327c.4543-.168.4543-.8106 0-.9788l-.629-.2327a.522.522 0 0 1-.3082-.3083zM4 7.043a1.52 1.52 0 0 1-.2905.2904c.1095.0833.2073.181.2905.2905a1.52 1.52 0 0 1 .2905-.2905A1.52 1.52 0 0 1 4 7.043" clipRule="evenodd" />
                        <path fill="#5329ff" fillRule="evenodd" d="M7.9447 8h.0275C10.1967 8 12 6.2091 12 4s-1.8033-4-4.0278-4C5.9764 0 4.3197 1.4415 4 3.3333c-2.2091 0-4 1.7909-4 4s1.7909 4 4 4c1.982 0 3.6274-1.4415 3.9447-3.3334m.0416-1c1.6619-.0076 3.0067-1.3478 3.0067-3 0-1.6568-1.3524-3-3.0208-3-1.4825 0-2.7156 1.0606-2.972 2.4594C6.6214 3.8768 7.8448 5.285 7.9863 7M4 10.3333c1.6569 0 3-1.3431 3-3s-1.3431-3-3-3-3 1.3432-3 3 1.3432 3 3 3" clipRule="evenodd" />
                    </svg>
                    {price ?? '—'}
                </span>
            </div>

        </div>
    )
}

const OptionRender = ({ option, image, price, theme }: { option: any; image?: string | null; price?: number, theme: "light" | "dark" }) => {
    const { label: labelText } = option
    return (
        <div className={styles.optionRender}>
            <div className={styles.optionRender__image}>
                <img src={image ? apiAssetUrl(image) : ''} alt={labelText} style={{ filter: theme === 'light' ? 'invert(1)' : 'invert(0)' }} />
            </div>
            <div className={styles.optionRender__textBlock}>
                <div className={styles.optionRender__header}>
                    <span className={`text_primary ${styles.optionRender__title}`} style={{ fontWeight: 600 }} title={labelText}>{labelText}</span>
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