import { AuthWidget } from '@widgets';
import { useEffect } from 'react';
export const SignUpPage = () => {
    useEffect(function redirectToMainPage() {
        window.location.href = 'https://radar-analytica.ru/signup'
    }, [])  
    return (
        <AuthWidget type="signup" />
    )
}