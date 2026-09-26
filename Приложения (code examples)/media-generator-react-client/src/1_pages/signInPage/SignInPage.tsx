import { useEffect, useContext } from 'react'
import { AuthWidget } from '@widgets';
import { AuthContext } from '@app';
import { useNavigate } from 'react-router';

export const SignInPage = () => {
    const context = useContext(AuthContext)
    const { user } = context || {}
    const navigate = useNavigate()

    useEffect(function redirectToMainPage() {
        if (user) {
            navigate('/', { viewTransition: true })
        } else {
            window.location.href = 'https://radar-analytica.ru/signin'
        }
    }, [user])

    return (
        <AuthWidget type="signin" />
    )
}