import { useState, useEffect } from 'react'
import styles from './AuthWidget.module.css'
import { SignInForm, SignUpForm, OtpForm, ChangePasswordForm, RestorePasswordForm, Restore_SetPasswordForm } from '@features'
import { MainLogo, API, PASSWORD_RESET_CHANGE_SECRET } from '@shared'
import { App as AntdApp } from 'antd'
import { NavLink, useNavigate } from 'react-router'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'

// --- models
interface AuthWidgetProps {
    type: 'signin' | 'signup' | 'reset-password' | 'change-password'
}

// --- helpers
const getRawDetail = (error: unknown): unknown =>
    typeof error === 'object' && error !== null && 'data' in error
        ? (error.data as any)?.detail
        : null
const formatDetail = (detail: unknown, generalMessage: string): string => {
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) return detail.map(d => d?.msg ?? JSON.stringify(d)).join(', ')
    return generalMessage
}
const {
    useSignInMutation,
    useSignUpMutation,
    useOtpSignupVerificationMutation,
    useOtpRetryMutation,
    useChangePasswordPlainMutation, // plain password change (not reset)
    useResetPasswordStepOneMutation,
    useOtpResetPasswordVerificationMutation,
    useSetNewPasswordAfterResetMutation
} = API

export const AuthWidget: React.FC<AuthWidgetProps> = ({ type }) => {
    // --- basics
    const { notification } = AntdApp.useApp()
    const navigate = useNavigate()
    const [step, setStep] = useState<'signin' | 'signup' | 'otp' | 'reset-password' | 'new-password' | 'change-password'>(type); // steps for signup, pass reset (main -> otp -> any next steps)
    const [userEmail, setUserEmail] = useState<string>(''); // email for otp block (used as a notification where we sent the code)
    // --- API
    const [signIn, { isLoading: isSigningInLoading, isError: isSigningInError, isSuccess: isSigningInSuccess, error: signingInError, reset: resetSigningIn }] = useSignInMutation()
    const [signUp, { isLoading: isSigningUpLoading, isError: isSigningUpError, isSuccess: isSigningUpSuccess, error: signingUpError, reset: resetSigningUp }] = useSignUpMutation()
    const [otpSignupVerification, { isLoading: isOtpSignupVerificationLoading, isError: isOtpSignupVerificationError, isSuccess: isOtpSignupVerificationSuccess, error: otpSignupVerificationError, reset: resetOtpSignupVerification }] = useOtpSignupVerificationMutation()
    const [otpRetry, { isLoading: isOtpRetryLoading, isError: isOtpRetryError, error: otpRetryError, reset: resetOtpRetry }] = useOtpRetryMutation()
    const [changePasswordPlain, { isLoading: isChangePasswordPlainLoading, isError: isChangePasswordPlainError, isSuccess: isChangePasswordPlainSuccess, error: changePasswordPlainError, reset: resetChangePasswordPlain }] = useChangePasswordPlainMutation()
    const [resetPasswordStepOne, { isLoading: isResetPasswordStepOneLoading, isError: isResetPasswordStepOneError, isSuccess: isResetPasswordStepOneSuccess, error: resetPasswordStepOneError, reset: resetResetPasswordStepOne }] = useResetPasswordStepOneMutation()
    const [otpResetPasswordVerification, { isLoading: isOtpResetPasswordVerificationLoading, isError: isOtpResetPasswordVerificationError, isSuccess: isOtpResetPasswordVerificationSuccess, error: otpResetPasswordVerificationError, reset: resetOtpResetPasswordVerification }] = useOtpResetPasswordVerificationMutation()
    const [setNewPasswordAfterReset, { isLoading: isSetNewPasswordAfterResetLoading, isError: isSetNewPasswordAfterResetError, isSuccess: isSetNewPasswordAfterResetSuccess, error: setNewPasswordAfterResetError, reset: resetSetNewPasswordAfterReset }] = useSetNewPasswordAfterResetMutation()
    // --- handlers
    const onSignInSubmit = (fields: { email: string, password: string }) => {
        signIn(fields)
    }
    const onSignUpSubmit = (fields: { email: string, password: string, name: string }) => {
        setUserEmail(fields.email)
        signUp(fields)
    }
    const onChangePasswordPlainSubmit = (fields: { password_old: string, password_new: string, password_confirm: string }) => {
        changePasswordPlain({ ...fields, secret: PASSWORD_RESET_CHANGE_SECRET })
    }
    const onOtpRetry = () => {
        otpRetry({ email: userEmail })
    }
    const onSignUpOtpSubmit = (code: string) => {
        otpSignupVerification({ code, email: userEmail })
    }
    const onResetPasswordStepOneSubmit = (fields: { email: string }) => {
        setUserEmail(fields.email)
        resetPasswordStepOne(fields)
    }
    const onOtpResetPasswordVerificationSubmit = (code: string) => {
        otpResetPasswordVerification({ confirmation_code: code, email: userEmail })
    }
    const onResetPasswordStepTwoSubmit = (fields: { password_new: string, password_confirm: string }) => {
        setNewPasswordAfterReset({ new_password: fields.password_new, secret: PASSWORD_RESET_CHANGE_SECRET, email: userEmail })
    }
    const requestErrorHandler = (error: FetchBaseQueryError | SerializedError | undefined, reset: () => void, generalMessage?: string) => {
        if (!error) return;
        const detail = formatDetail(getRawDetail(error), generalMessage ?? 'Что-то пошло не так :(')
        notification.error({
            title: `Ошибка ${'status' in error ? error.status : ''}`,
            description: detail
        })
        reset();
    }

    useEffect(function requestsStatusHandler() {
        // --- success
        if (isSigningInSuccess) {
            navigate('/', { viewTransition: true })
        }
        if (isSigningUpSuccess) {
            setStep('otp')
        }
        if (isOtpSignupVerificationSuccess) {
            navigate('/signin', { viewTransition: true })
            setUserEmail('')
        }
        if (isChangePasswordPlainSuccess) {
            navigate('/signin', { viewTransition: true })
        }
        if (isResetPasswordStepOneSuccess) {
            setStep('otp')
        }
        if (isOtpResetPasswordVerificationSuccess) {
            setStep('new-password')
        }
        if (isSetNewPasswordAfterResetSuccess) {
            navigate('/signin', { viewTransition: true })
            setUserEmail('')
        }
        // --- errors
        if (isSigningInError) requestErrorHandler(signingInError, resetSigningIn, 'Не удалось войти')
        if (isSigningUpError) requestErrorHandler(signingUpError, resetSigningUp, 'Не удалось зарегистрироваться')
        if (isOtpSignupVerificationError) requestErrorHandler(otpSignupVerificationError, resetOtpSignupVerification, 'Не удалось подтвердить код')
        if (isOtpRetryError) requestErrorHandler(otpRetryError, resetOtpRetry, 'Не удалось отправить код повторно')
        if (isChangePasswordPlainError) requestErrorHandler(changePasswordPlainError, resetChangePasswordPlain, 'Не удалось сменить пароль')
        if (isResetPasswordStepOneError) requestErrorHandler(resetPasswordStepOneError, resetResetPasswordStepOne, 'Не удалось отправить код восстановления')
        if (isOtpResetPasswordVerificationError) requestErrorHandler(otpResetPasswordVerificationError, resetOtpResetPasswordVerification, 'Не удалось подтвердить код')
        if (isSetNewPasswordAfterResetError) requestErrorHandler(setNewPasswordAfterResetError, resetSetNewPasswordAfterReset, 'Не удалось сменить пароль')
    }, [
        isSigningInLoading,
        isSigningInError,
        isSigningInSuccess,
        isSigningUpSuccess,
        isSigningUpError,
        isSigningUpLoading,
        isOtpSignupVerificationSuccess,
        isOtpSignupVerificationError,
        isOtpRetryError,
        isChangePasswordPlainSuccess,
        isChangePasswordPlainError,
        isResetPasswordStepOneSuccess,
        isResetPasswordStepOneError,
        isOtpResetPasswordVerificationSuccess,
        isOtpResetPasswordVerificationError,
        isSetNewPasswordAfterResetSuccess,
        isSetNewPasswordAfterResetError,
    ])
    return (
        <div className={styles.authWidget}>
            <div className={styles.authWidget__logo}>
                <MainLogo />
            </div>
            {type === 'signin' && <SignInForm onSubmit={onSignInSubmit} isLoading={isSigningInLoading} />}
            {type === 'signup' && (() => {
                const slides = ['signup', 'otp'] as const
                const slideCount = slides.length
                const index = Math.max(0, slides.indexOf(step as typeof slides[number]))
                const shift = index * (100 / slideCount)
                return (
                    <div className={styles.authWidget__slider}>
                        <div
                            className={styles.authWidget__sliderTrack}
                            style={{ width: `${slideCount * 100}%`, transform: `translateX(-${shift}%)` }}
                        >
                            <div className={styles.authWidget__sliderSlide} style={{ width: `${100 / slideCount}%` }}>
                                <SignUpForm onSubmit={onSignUpSubmit} isLoading={isSigningUpLoading} />
                            </div>
                            <div className={styles.authWidget__sliderSlide} style={{ width: `${100 / slideCount}%` }}>
                                <OtpForm
                                    title='Регистрация'
                                    onStepBack={() => setStep('signup')}
                                    email={userEmail}
                                    isLoading={isOtpSignupVerificationLoading || isOtpRetryLoading}
                                    onSubmit={onSignUpOtpSubmit}
                                    isError={isOtpSignupVerificationError}
                                    isSuccess={isOtpSignupVerificationSuccess}
                                    retryTimerTrigger={step === 'otp'}
                                    onRetry={onOtpRetry}
                                />
                            </div>
                        </div>
                    </div>
                )
            })()}
            {type === 'change-password' && <ChangePasswordForm onSubmit={onChangePasswordPlainSubmit} isLoading={isChangePasswordPlainLoading} />}
            {type === 'reset-password' && (() => {
                const slides = ['reset-password', 'otp', 'new-password'] as const
                const slideCount = slides.length
                const index = Math.max(0, slides.indexOf(step as typeof slides[number]))
                const shift = index * (100 / slideCount)
                return (
                    <div className={styles.authWidget__slider}>
                        <div
                            className={styles.authWidget__sliderTrack}
                            style={{ width: `${slideCount * 100}%`, transform: `translateX(-${shift}%)` }}
                        >
                            <div className={styles.authWidget__sliderSlide} style={{ width: `${100 / slideCount}%` }}>
                                <RestorePasswordForm onSubmit={onResetPasswordStepOneSubmit} isLoading={isResetPasswordStepOneLoading} />
                            </div>
                            <div className={styles.authWidget__sliderSlide} style={{ width: `${100 / slideCount}%` }}>
                                <OtpForm
                                    title='Восстановление пароля'
                                    onStepBack={() => setStep('reset-password')}
                                    email={userEmail}
                                    isLoading={isOtpResetPasswordVerificationLoading || isOtpRetryLoading}
                                    onSubmit={onOtpResetPasswordVerificationSubmit}
                                    isError={isOtpResetPasswordVerificationError}
                                    isSuccess={isOtpResetPasswordVerificationSuccess}
                                    retryTimerTrigger={step === 'otp'}
                                    onRetry={onOtpRetry}
                                />
                            </div>
                            <div className={styles.authWidget__sliderSlide} style={{ width: `${100 / slideCount}%` }}>
                                <Restore_SetPasswordForm
                                    onStepBack={() => setStep('otp')}
                                    onSubmit={onResetPasswordStepTwoSubmit}
                                    isLoading={isSetNewPasswordAfterResetLoading}
                                />
                            </div>
                        </div>
                    </div>
                )
            })()}
            {type === 'change-password' &&
                <div className={styles.authWidget__links}>
                   <NavLink to="/signup" className={`text_secondary ${styles.authWidget__link}`} style={{ fontWeight: 600}}>Регистрация</NavLink>
                   <NavLink to="/signin" className={`text_secondary ${styles.authWidget__link}`} style={{ fontWeight: 600}}>Вход</NavLink>
                </div>
            }
        </div>
    )
}