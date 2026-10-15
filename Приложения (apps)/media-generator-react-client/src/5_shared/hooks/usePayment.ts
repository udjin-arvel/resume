import { useState, useCallback, useContext } from 'react';
import { AuthContext } from '@app/context/AuthContext';
import { payFunction } from '../utils/payFunction';

interface UsePaymentOptions {
    onSuccess?: (options: any) => void;
    onError?: (reason: any, options: any) => void;
}

export const usePayment = (hookOptions?: UsePaymentOptions) => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('AuthContext not found');
    }
    const { user } = context;
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isError, setIsError] = useState(false);

    const pay = useCallback(async (
        amountRubles: number,
        amountTokens: number,
        testPayment?: boolean,
    ) => {
        setIsLoading(true);
        setIsSuccess(false);
        setIsError(false);
        try {
            await payFunction(
                amountRubles,
                amountTokens,
                testPayment ?? false,
                { id: user?.id ?? 0, email: user?.email ?? '' },
                (opts) => {
                    setIsSuccess(true);
                    hookOptions?.onSuccess?.(opts);
                },
                (reason, opts) => {
                    setIsError(true);
                    hookOptions?.onError?.(reason, opts);
                },
            );
        } catch {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, [hookOptions, user]);

    const reset = useCallback(() => {
        setIsLoading(false);
        setIsSuccess(false);
        setIsError(false);
    }, []);

    return { pay, reset, isLoading, isSuccess, isError };
};
