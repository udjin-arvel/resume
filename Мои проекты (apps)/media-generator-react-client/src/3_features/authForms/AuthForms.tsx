import { useEffect, useMemo, useState } from 'react'
import styles from './AuthForms.module.css'
import { Input, Form, ConfigProvider, theme as antTheme } from 'antd'
import { RadarAntdButton } from '@shared'
import { NavLink } from 'react-router'


// --- SIGNIN FORM / ВХОД
interface SignInFormProps {
    onSubmit: (fields: { email: string, password: string }) => void,
    isLoading: boolean,
}
export const SignInForm: React.FC<SignInFormProps> = ({ onSubmit, isLoading }) => {
    const [form] = Form.useForm()
    const email = Form.useWatch('email', form)
    const password = Form.useWatch('password', form)
    const [canSubmit, setCanSubmit] = useState(false)

    useEffect(function validateForm() {
        form
            .validateFields({ validateOnly: true })
            .then(() => setCanSubmit(true))
            .catch(() => setCanSubmit(false))
    }, [email, password, form])

    return (
        <div className={styles.formBlock}>
            <h1 className={`title_secondary ${styles.formBlock__title}`}>Вход</h1>
            <ConfigProvider theme={{ algorithm: antTheme.darkAlgorithm }}>
                <Form
                    form={form}
                    layout="vertical"
                    className={styles.formBlock__form}
                    onFinish={onSubmit}
                    disabled={isLoading}
                >
                    <Form.Item
                        name="email"
                        style={{ marginBottom: 0 }}
                        rules={[
                            { required: true, message: 'Это обязательное поле' },
                            { type: 'email', message: 'Введите корректный email' }
                        ]}
                        normalize={(value) => value?.trim()}
                    >
                        <Input
                            placeholder="Email"
                            style={{ height: '50px' }}
                        />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        style={{ marginBottom: 0 }}
                        rules={[
                            { required: true, message: 'Это обязательное поле' },
                            { min: 6, message: 'Пароль должен быть не менее 6 символов' }
                        ]}
                    >
                        <Input.Password
                            placeholder="Пароль"
                            style={{ height: '50px' }}
                        />
                    </Form.Item>
                    <NavLink to="/reset-password" className={`${styles.formBlock__textButton} text_secondary`}>Восстановить пароль</NavLink>
                    <div className={styles.formBlock__buttons}>
                        <RadarAntdButton
                            type="primary"
                            htmlType="submit"
                            style={{
                                width: '100%',
                                fontWeight: 600,
                                height: '40px',
                                opacity: canSubmit ? 1 : 0.5,
                            }}
                            shineAnimation={canSubmit}
                            loading={isLoading}
                        >
                            <span className="text_secondary">Войти</span>
                        </RadarAntdButton>
                        <NavLink to="/signup" viewTransition className={`${styles.formBlock__darkButton} text_secondary`}>Регистрация</NavLink>
                    </div>
                </Form>
            </ConfigProvider>
        </div>
    )
}

// --- SIGNUP FORM / РЕГИСТРАЦИЯ
interface SignUpFormProps {
    onSubmit: (fields: { name: string, email: string, password: string }) => void,
    isLoading: boolean,
}
export const SignUpForm: React.FC<SignUpFormProps> = ({
    onSubmit,
    isLoading
}) => {
    const [form] = Form.useForm()
    const name = Form.useWatch('name', form)
    const email = Form.useWatch('email', form)
    const password = Form.useWatch('password', form)
    const [canSubmit, setCanSubmit] = useState(false)

    useEffect(function validateForm() {
        form
            .validateFields({ validateOnly: true })
            .then(() => setCanSubmit(true))
            .catch(() => setCanSubmit(false))
    }, [name, email, password, form])

    return (
        <div className={styles.formBlock}>
            <h1 className={`title_secondary ${styles.formBlock__title}`}>Регистрация</h1>
            <ConfigProvider theme={{ algorithm: antTheme.darkAlgorithm }}>
                <Form
                    form={form}
                    layout="vertical"
                    className={styles.formBlock__form}
                    onFinish={onSubmit}
                    disabled={isLoading}
                >
                    <Form.Item
                        name="name"
                        style={{ marginBottom: 0 }}
                        rules={[
                            { required: true, message: 'Это обязательное поле' },
                            { min: 2, message: 'Имя должно быть не менее 2 символов' }
                        ]}
                        normalize={(value) => value?.trim()}
                    >
                        <Input
                            placeholder="Имя"
                            style={{ height: '50px' }}
                        />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        style={{ marginBottom: 0 }}
                        rules={[
                            { required: true, message: 'Это обязательное поле' },
                            { type: 'email', message: 'Введите корректный email' }
                        ]}
                        normalize={(value) => value?.trim()}
                    >
                        <Input
                            placeholder="Email"
                            style={{ height: '50px' }}
                        />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        style={{ marginBottom: 0 }}
                        rules={[
                            { required: true, message: 'Это обязательное поле' },
                            { min: 6, message: 'Пароль должен быть не менее 6 символов' }
                        ]}
                    >
                        <Input.Password
                            placeholder="Пароль"
                            style={{ height: '50px' }}
                        />
                    </Form.Item>
                    <div className={styles.formBlock__buttons} style={{ gap: 8 }}>
                        <RadarAntdButton
                            type="primary"
                            htmlType="submit"
                            style={{
                                width: '100%',
                                fontWeight: 600,
                                height: '40px',
                                opacity: canSubmit ? 1 : 0.5,
                            }}
                            shineAnimation={canSubmit}
                            loading={isLoading}
                        >
                            <span className="text_secondary">Регистрация</span>
                        </RadarAntdButton>
                        {/* <span className={`text_secondary ${styles.formBlock__text_gray}`}>Продолжая, вы соглашаетесь с <NavLink to='/privacy-policy' viewTransition style={{ color: 'var(--color-primary)' }}>Политикой конфиденциальности</NavLink></span> */}
                        <NavLink to='/signin' viewTransition className={`${styles.formBlock__darkButton} text_secondary`} style={{ marginTop: 12 }}>Вход</NavLink>
                    </div>
                </Form>
            </ConfigProvider>
        </div>
    )
}

// --- OTP FORM / ОДНОРАЗОВЫЙ КОД
interface OtpFormProps {
    email?: string,
    title?: string,
    onStepBack?: () => void,
    isLoading: boolean,
    onSubmit: (code: string) => void,
    isError: boolean,
    isSuccess: boolean,
    retryTimerTrigger: boolean,
    onRetry: () => void,
}
export const OtpForm: React.FC<OtpFormProps> = ({
    email,
    title,
    onStepBack,
    isLoading,
    onSubmit,
    isError,
    retryTimerTrigger,
    onRetry
}) => {
    const [otp, setOtp] = useState('')
    const [retryTimer, setRetryTimer] = useState(60)
    const canSubmit = useMemo(() => otp.length === 6, [otp])

    useEffect(function handleRetryTimer() {
        let interval: ReturnType<typeof setInterval> | null = null
        if (retryTimer > 0 && retryTimerTrigger) {
            interval = setInterval(() => {
                if (retryTimer <= 0) {
                    if (interval) clearInterval(interval)
                    return
                }
                setRetryTimer(retryTimer - 1)
            }, 1000)
        }

        if (!retryTimerTrigger) {
            setRetryTimer(60)
            if (interval) clearInterval(interval)
            return
        }


        return () => {
            if (interval) clearInterval(interval)
        }
    }, [retryTimer, retryTimerTrigger])
    return (
        <div className={styles.formBlock}>
            <ConfigProvider theme={{ algorithm: antTheme.darkAlgorithm }}>
                <h1 className={`title_secondary ${styles.formBlock__title}`}>{title ?? 'Подтверждение'}</h1>
                <span
                    className={`text_primary ${styles.formBlock__text}`}
                    style={{
                        textAlign: 'center',
                        lineHeight: '1.5',
                    }}
                >
                    Отправили код подтверждения на <br />
                    <span style={{ color: 'var(--color-primary)' }}>{email ?? 'ваш email'}</span>
                </span>

                <Input.OTP
                    size="large"
                    status={(isError) ? 'error' : undefined}
                    value={otp}
                    disabled={isLoading}
                    onChange={(value) => setOtp(value)}
                    onInput={(value) => {
                        setOtp(value.join(''))
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            onSubmit(otp)
                        }
                    }}
                    styles={{
                        input: {
                            height: '50px',
                            width: '44px',
                            fontWeight: 700
                        },
                    }}
                />
                {retryTimer > 0 && <span className="text_secondary" style={{ color: 'var(--color-text-muted)' }}>Отправить код повторно через {retryTimer}</span>}
                {retryTimer <= 0 && <button className="text_secondary" style={{ color: 'var(--color-text-muted)' }} onClick={() => { onRetry(); setOtp(''); setRetryTimer(60); }}>Отправить код повторно</button>}
                <div className={styles.formBlock__buttons} style={{ margin: 0 }}>
                    <RadarAntdButton
                        type="primary"
                        style={{
                            width: '100%',
                            fontWeight: 600,
                            height: '40px',
                            opacity: canSubmit ? 1 : 0.5,
                        }}
                        loading={isLoading}
                        onClick={() => onSubmit(otp)}
                        shineAnimation={canSubmit}
                    >
                        <span className="text_secondary">Подтвердить</span>
                    </RadarAntdButton>
                    <button className={`${styles.formBlock__darkButton} text_secondary`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onStepBack?.() }}>Назад</button>
                </div>
            </ConfigProvider>
        </div>
    )
}

// --- CHANGE PASSWORD FORM / СМЕНА ПАРОЛЯ (ПРОСТАЯ, НЕ ВОССТАНОВЛЕНИЕ)
interface ChangePasswordFormProps {
    onSubmit: (fields: { password_old: string, password_new: string, password_confirm: string }) => void,
    isLoading: boolean,
}
export const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
    onSubmit,
    isLoading
}) => {
    const [form] = Form.useForm()
    const password_old = Form.useWatch('password_old', form)
    const password_new = Form.useWatch('password_new', form)
    const password_confirm = Form.useWatch('password_confirm', form)
    const [canSubmit, setCanSubmit] = useState(false)

    useEffect(function validateForm() {
        form
            .validateFields({ validateOnly: true })
            .then(() => setCanSubmit(true))
            .catch(() => setCanSubmit(false))
    }, [password_old, password_new, password_confirm, form])
    return (
        <div className={styles.formBlock}>
            <h1 className={`title_secondary ${styles.formBlock__title}`}>Смена пароля</h1>
            <ConfigProvider theme={{ algorithm: antTheme.darkAlgorithm }}>
                <Form
                    form={form}
                    layout="vertical"
                    className={styles.formBlock__form}
                    onFinish={onSubmit}
                    disabled={isLoading}
                >
                    <Form.Item
                        name="password_old"
                        style={{ marginBottom: 0 }}
                        rules={[
                            { required: true, message: 'Введите старый пароль' },
                            { min: 6, message: 'Пароль должен быть не менее 6 символов' },
                        ]}
                    >
                        <Input.Password
                            placeholder="Старый пароль"
                            style={{ height: '50px' }}
                        />
                    </Form.Item>
                    <Form.Item
                        name="password_new"
                        style={{ marginBottom: 0 }}
                        rules={[
                            { required: true, message: 'Введите новый пароль' },
                            { min: 6, message: 'Пароль должен быть не менее 6 символов' },
                        ]}
                    >
                        <Input.Password
                            placeholder="Новый пароль"
                            style={{ height: '50px' }}
                        />
                    </Form.Item>
                    <Form.Item
                        name="password_confirm"
                        style={{ marginBottom: 0 }}
                        dependencies={['password_new']}
                        rules={[
                            { required: true, message: 'Подтвердите пароль' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password_new') === value) {
                                        return Promise.resolve()
                                    }
                                    return Promise.reject(new Error('Пароли не совпадают'))
                                },
                            }),
                        ]}
                    >
                        <Input.Password
                            placeholder="Подтвердите пароль"
                            style={{ height: '50px' }}
                        />
                    </Form.Item>
                    <div className={styles.formBlock__buttons} style={{ gap: 8 }}>
                        <RadarAntdButton
                            type="primary"
                            htmlType="submit"
                            style={{ width: '100%', fontWeight: 600, height: '40px', opacity: canSubmit ? 1 : 0.5, }}
                            shineAnimation={canSubmit}
                            loading={isLoading}
                        >
                            <span className="text_secondary">Сменить пароль</span>
                        </RadarAntdButton>
                    </div>
                </Form>
            </ConfigProvider>
        </div>
    )
}

// --- RESTORE PASSWORD FORM / ВОССТАНОВЛЕНИЕ ПАРОЛЯ
interface IRestorePasswordFormProps {
    onSubmit: (fields: { email: string }) => void,
    isLoading: boolean,
}
export const RestorePasswordForm: React.FC<IRestorePasswordFormProps> = ({
    onSubmit,
    isLoading
}) => {
    const [form] = Form.useForm()
    const email = Form.useWatch('email', form)
    const [canSubmit, setCanSubmit] = useState(false)

    useEffect(function validateForm() {
        form
            .validateFields({ validateOnly: true })
            .then(() => setCanSubmit(true))
            .catch(() => setCanSubmit(false))
    }, [email, form])
    return (
        <div className={styles.formBlock}>
            <h1 className={`title_secondary ${styles.formBlock__title}`}>Восстановление пароля</h1>
            <ConfigProvider theme={{ algorithm: antTheme.darkAlgorithm }}>
                <Form
                    form={form}
                    layout="vertical"
                    className={styles.formBlock__form}
                    onFinish={onSubmit}
                    disabled={isLoading}
                >
                    <Form.Item
                        name="email"
                        style={{ marginBottom: 0 }}
                        rules={[
                            { required: true, message: 'Это обязательное поле' },
                            { type: 'email', message: 'Введите корректный email' }
                        ]}
                        normalize={(value) => value?.trim()}
                    >
                        <Input
                            placeholder="Email"
                            style={{ height: '50px' }}
                        />
                    </Form.Item>
                    <div className={styles.formBlock__buttons} style={{ gap: 8 }}>
                        <RadarAntdButton
                            type="primary"
                            htmlType="submit"
                            style={{
                                width: '100%',
                                fontWeight: 600,
                                height: '40px',
                                opacity: canSubmit ? 1 : 0.5,
                            }}
                            shineAnimation={canSubmit}
                            loading={isLoading}
                        >
                            <span className="text_secondary">Отправить код</span>
                        </RadarAntdButton>
                    </div>
                </Form>
            </ConfigProvider>
        </div>
    )
}

// --- RESTORE SET PASSWORD FORM / ПРИДУМАЙТЕ НОВЫЙ ПАРОЛЬ (ПОСЛЕ ВОССТАНОВЛЕНИЯ)
interface IRestoreSetPasswordFormProps {
    onSubmit: (fields: { password_new: string, password_confirm: string }) => void,
    isLoading: boolean,
    onStepBack: () => void,
}
export const Restore_SetPasswordForm: React.FC<IRestoreSetPasswordFormProps> = ({
    onSubmit,
    isLoading,
    onStepBack
}) => {
    const [form] = Form.useForm()
    const password_new = Form.useWatch('password_new', form)
    const password_confirm = Form.useWatch('password_confirm', form)
    const [canSubmit, setCanSubmit] = useState(false)

    useEffect(function validateForm() {
        form
            .validateFields({ validateOnly: true })
            .then(() => setCanSubmit(true))
            .catch(() => setCanSubmit(false))
    }, [password_new, password_confirm, form])
    return (
        <div className={styles.formBlock}>
            <h1 className={`title_secondary ${styles.formBlock__title}`}>Придумайте новый пароль</h1>
            <ConfigProvider theme={{ algorithm: antTheme.darkAlgorithm }}>
                <Form
                    form={form}
                    layout="vertical"
                    className={styles.formBlock__form}
                    onFinish={onSubmit}
                    disabled={isLoading}
                >
                    <Form.Item
                        name="password_new"
                        style={{ marginBottom: 0 }}
                        rules={[
                            { required: true, message: 'Введите новый пароль' },
                            { min: 6, message: 'Пароль должен быть не менее 6 символов' },
                        ]}
                    >
                        <Input.Password
                            placeholder="Новый пароль"
                            style={{ height: '50px' }}
                        />
                    </Form.Item>
                    <Form.Item
                        name="password_confirm"
                        style={{ marginBottom: 0 }}
                        rules={[
                            { required: true, message: 'Повторите новый пароль' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password_new') === value) {
                                        return Promise.resolve()
                                    }
                                    return Promise.reject(new Error('Пароли не совпадают'))
                                },
                            }),
                        ]}
                    >
                        <Input.Password
                            placeholder="Повторите новый пароль"
                            style={{ height: '50px' }}
                        />
                    </Form.Item>
                    <div className={styles.formBlock__buttons} style={{ gap: 8 }}>
                        <RadarAntdButton
                            type="primary"
                            htmlType="submit"
                            style={{ width: '100%', fontWeight: 600, height: '40px', opacity: canSubmit ? 1 : 0.5, }}
                            shineAnimation={canSubmit}
                            loading={isLoading}
                        >
                            <span className="text_secondary">Сохранить</span>
                        </RadarAntdButton>
                        <button className={`${styles.formBlock__darkButton} text_secondary`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onStepBack() }}>Назад</button>
                    </div>
                </Form>
            </ConfigProvider>
        </div>
    )
}