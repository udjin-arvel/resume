import React from 'react'
import { Switch, ConfigProvider } from 'antd'
import type { SwitchProps as AntSwitchProps } from 'antd'
import { useTheme } from '../../hooks/useTheme'
import { RADAR_COLOR_SCHEME } from '@shared/сonstants/colorScheme'

const switchThemeLT = {
    components: {
        Switch: {
            handleBg: RADAR_COLOR_SCHEME.light.bgAlt,
            handleSize: 17,
            trackMinWidth: 32,
            trackHeight: 19,
            trackPadding: 1,
        },
    },
}

const switchThemeDK = {
    components: {
        Switch: {
            handleBg: RADAR_COLOR_SCHEME.dark.bgAlt,
            handleSize: 17,
            trackMinWidth: 32,
            trackHeight: 19,
            trackPadding: 1,
        },
    },
}


interface ISwitchProps extends AntSwitchProps {
}

export const RadarSwitch: React.FC<ISwitchProps> = ({
    checked,
    onChange,
    className,
    ...props
}) => {
    const { theme } = useTheme()
    const switchTheme = theme === 'dark' ? switchThemeDK : switchThemeLT
    return (
        <ConfigProvider theme={switchTheme}>
            <Switch
                checked={checked}
                onChange={onChange}
                {...props}
            />
        </ConfigProvider>
    )
}