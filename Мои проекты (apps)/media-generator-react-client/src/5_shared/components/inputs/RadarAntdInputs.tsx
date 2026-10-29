import { Input, ConfigProvider, Select, type SelectProps } from 'antd'
import type { TextAreaProps } from 'antd/es/input/TextArea'
import type { InputProps } from 'antd/es/input/Input'
import { RADAR_COLOR_SCHEME } from '../../сonstants/colorScheme'
import { useTheme } from '../../hooks/useTheme'

const textareaLightTheme = {
    components: {
        token: {
            fontSize: 14,
        },
        Input: {
            controlHeight: 50,
            colorBorder: RADAR_COLOR_SCHEME.light.borderMuted,
            activeBorderColor: RADAR_COLOR_SCHEME.light.borderMuted,
            hoverBorderColor: RADAR_COLOR_SCHEME.light.borderMuted,
            activeShadow: 'transparent'
        }
    }
}

const textareaDarkTheme = {
    components: {
        token: {
            fontSize: 14,
        },
        Input: {
            controlHeight: 50,
            colorBorder: RADAR_COLOR_SCHEME.dark.borderMuted,
            activeBorderColor: RADAR_COLOR_SCHEME.dark.borderMuted,
            hoverBorderColor: RADAR_COLOR_SCHEME.dark.borderMuted,
            activeShadow: 'transparent'
        }
    }
}
const RadarAntdTextarea: React.FC<TextAreaProps> = (props) => {
    const { theme } = useTheme()
    return (
        <ConfigProvider theme={theme === 'light' ? textareaLightTheme : textareaDarkTheme}>
            <Input.TextArea {...props} />
        </ConfigProvider>
    )
}
const inputLightTheme = {
    components: {
        token: {
            fontSize: 14,
        },
        Input: {
            controlHeight: 50,
            colorBorder: RADAR_COLOR_SCHEME.light.borderMuted,
            activeBorderColor: RADAR_COLOR_SCHEME.light.borderMuted,
            hoverBorderColor: RADAR_COLOR_SCHEME.light.borderMuted,
            activeShadow: 'transparent'
        }
    }
}

const inputDarkTheme = {
    components: {
        token: {
            fontSize: 14,
        },
        Input: {
            controlHeight: 50,
            colorBorder: RADAR_COLOR_SCHEME.dark.borderMuted,
            activeBorderColor: RADAR_COLOR_SCHEME.dark.borderMuted,
            hoverBorderColor: RADAR_COLOR_SCHEME.dark.borderMuted,
            activeShadow: 'transparent'
        }
    }
}
const RadarAntdPlainInput: React.FC<InputProps> = (props) => {
    const { theme } = useTheme()
    return (
        <ConfigProvider theme={theme === 'light' ? inputLightTheme : inputDarkTheme}>
            <Input {...props} />
        </ConfigProvider>
    )
}

const selectLightTheme = {
    token: {
        borderRadius: 8,
    },
    components: {
        Select: {
            controlHeight: 27,
            colorBorder: RADAR_COLOR_SCHEME.light.borderMuted,
            activeBorderColor: RADAR_COLOR_SCHEME.light.borderMuted,
            hoverBorderColor: RADAR_COLOR_SCHEME.light.borderMuted,
            activeOutlineColor: 'transparent',
            optionActiveBg: 'transparent',
            optionSelectedBg: 'transparent',
        }
    }
}
const selectDarkTheme = {
    token: {
        borderRadius: 8,
    },
    components: {
        Select: {
            controlHeight: 27,
            colorBorder: RADAR_COLOR_SCHEME.dark.borderMuted,
            activeBorderColor: RADAR_COLOR_SCHEME.dark.borderMuted,
            hoverBorderColor: RADAR_COLOR_SCHEME.dark.borderMuted,
            activeOutlineColor: 'transparent',
            optionActiveBg: 'transparent',
            optionSelectedBg: 'transparent',
            boxShadowSecondary: '0 6px 16px 0 rgba(0, 0, 0, 0.18), 0 3px 6px -4px rgba(0, 0, 0, 0.22), 0 9px 28px 8px rgba(0, 0, 0, 0.15)'
        }
    }
}
const RadarAntdSelect: React.FC<SelectProps> = (props) => {
    const { theme } = useTheme()
    return (
        <ConfigProvider theme={theme === 'light' ? selectLightTheme : selectDarkTheme}>
            <Select
                suffixIcon={
                    <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg" className='ant-select-arrow'>
                        <path d="M0.75 0.75L5.75 5.75L10.75 0.75" stroke="#8C8C8C" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                }
                {...props}
            />
        </ConfigProvider>
    )
}



export const RadarAntdInput = Object.assign(RadarAntdPlainInput, { Textarea: RadarAntdTextarea, Select: RadarAntdSelect });
