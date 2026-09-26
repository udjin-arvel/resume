import React from "react"
import { Button, ConfigProvider } from "antd"
import type { ButtonProps } from "antd"
import styles from './RadarAntdButtons.module.css'

const primaryButtonTheme = {
    components: {
        Button: {
            controlHeight: 46,
            paddingInline: 16,
            primaryShadow: 'transparent'
        }
    }
}

interface IRadarAntdButtonProps extends ButtonProps {
    children?: React.ReactNode
    shineAnimation?: boolean
}

const ButtonComp: React.FC<IRadarAntdButtonProps> = ({ children, shineAnimation, ...rest }) => {
    return (
        <ConfigProvider theme={primaryButtonTheme}>
            <div className={shineAnimation ? styles.shineWrapper : undefined}>
                <Button
                    type='primary'
                    {...rest}
                >
                    {children ?? null}
                </Button>
            </div>
        </ConfigProvider>
    )
}

export const secondaryButtonTheme = {
    token: {
        colorPrimary: '#E7E1FE',
        fontSize: 14,
        fontWeight: 600,
        controlHeight: 46,
        borderRadius: 8,
    },
    components: {
        Button: {
            colorPrimaryHover: '#E7E1FE',
            colorPrimaryActive: '#E7E1FE',
            boxShadow: 'none',
            fontWeight: 600,
            primaryColor: '#5329FF',
            primaryShadow: 'transparent'
        },
    },
}

const SecondaryButtonComp: React.FC<IRadarAntdButtonProps> = ({ children, ...rest }) => {
    return (
        <ConfigProvider theme={secondaryButtonTheme}>
            <Button
                type='primary'
                {...rest}
            >
                {children ?? null}
            </Button>
        </ConfigProvider>
    )
}

export const errorButtonTheme = {
    token: {
        colorPrimary: '#F93C65',
        fontSize: 14,
        fontWeight: 600,
        controlHeight: 46,
        borderRadius: 8,
    },
    components: {
        Button: {
            colorPrimaryHover: '#F93C65',
            colorPrimaryActive: '#F93C65',
            boxShadow: 'none',
            fontWeight: 600,
            primaryShadow: 'transparent'
        },
    },
}
const ErrorButtonComp: React.FC<IRadarAntdButtonProps> = ({ children, ...rest }) => {
    return (
        <ConfigProvider theme={errorButtonTheme}>
            <Button
                type='primary'
                {...rest}
            >
                {children ?? null}
            </Button>
        </ConfigProvider>
    )
}


export const RadarAntdButton = Object.assign(ButtonComp, {Secondary: SecondaryButtonComp, Error: ErrorButtonComp});