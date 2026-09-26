import { useContext, useEffect } from 'react'
import { AuthContext } from '@app'
import { Spinner } from '@shared'
import { Outlet } from 'react-router'
import styles from './ProtectedRoute.module.css'

export const ProtectedRoute = () => {
    const context = useContext(AuthContext)
    const authToken = context?.authToken
    useEffect(() => {
        if (!context || authToken || import.meta.env.VITE_IS_DEV) 
            return;
       
        window.location.assign(`${window.location.protocol}//${window.location.host}/signin`); // redirect to signin page if not authenticated and not in development
    }, [context, authToken])

    if (!context) return null

    if (!authToken) {
        return (
            <div
                className={styles.redirectLoader}
                role="status"
                aria-live="polite"
                aria-busy="true"
            >
                <Spinner />
            </div>
        )
    }

    return <Outlet />
}
