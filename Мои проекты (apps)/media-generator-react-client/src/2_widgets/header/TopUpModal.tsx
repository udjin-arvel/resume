import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import styles from './TopUpModal.module.css'
import { usePayment, API, RadarAntdButton } from '@shared'
import { message } from 'antd'

interface ITopUpModalProps {
    open: boolean;
    onClose: () => void;
}

interface IPackage {
    id: number;
    label: string;
    price: number;
    tokens: number;
    bonus?: string;
    popular?: boolean;
}

const PACKAGES: IPackage[] = [
    { id: 1, label: 'Старт', price: 590, tokens: 500 },
    { id: 2, label: 'Базовый', price: 990, tokens: 1000 },
    { id: 3, label: 'Стандарт', price: 2290, tokens: 2500, popular: true },
    { id: 4, label: 'Про', price: 3990, tokens: 5000 },
    { id: 5, label: 'Про+', price: 6990, tokens: 10000 },
    // { id: 6, label: 'Test', price: 1, tokens: 100 },
];

export const TopUpModal: React.FC<ITopUpModalProps> = ({ open, onClose }) => {
    const [selectedPackage, setSelectedPackage] = useState<IPackage | null>(null);
    const { refetch: refetchUserData } = API.useGetUserDataQuery();
    const { pay, isLoading, isSuccess, reset } = usePayment({ onSuccess: () => refetchUserData(), onError: () => message.error('Что-то пошло не так, попробуйте позже') });

    useEffect(function bodyOverflowHandler() {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
            setSelectedPackage(null);
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [open]);

    useEffect(function hotKeysHandler() {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { e.preventDefault(); onClose(); }
        };
        if (open) window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onClose]);

    useEffect(function paymentStatusHandler() {
        if (isSuccess) {
            reset();
            onClose();
        }
    }, [isSuccess])

    const handlePackageSelect = (pkg: IPackage) => {
        setSelectedPackage(pkg);
    };

    const handlePay = () => {
        if (selectedPackage) {
            pay(selectedPackage.price, selectedPackage.tokens);
        }
    };

    const displayAmount = (selectedPackage ? String(selectedPackage.price) : '');
    const canPay = displayAmount.length > 0 && Number(displayAmount) > 0;


    

    return createPortal(
        <div
            className={styles.topUpModal__backdrop}
            style={{ display: open ? 'flex' : 'none' }}
            id="topup-backdrop"
            onClick={(e) => {
                if ((e.target as HTMLElement).id === 'topup-backdrop') onClose();
            }}
        >
            <div className={styles.topUpModal} data-open={open}>
                <div className={styles.topUpModal__header}>
                    <div className={styles.topUpModal__titleBlock}>
                        <svg width="20" height="20" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="28" height="28" rx="8.14" fill="currentColor" fillOpacity="0.12" />
                            <path d="M8.9974 15.8752C8.65222 15.8752 8.3724 16.155 8.3724 16.5002C8.3724 16.8453 8.65222 17.1252 8.9974 17.1252H9.83073C10.1759 17.1252 10.4557 16.8453 10.4557 16.5002C10.4557 16.155 10.1759 15.8752 9.83073 15.8752H8.9974Z" fill="currentColor" />
                            <path d="M11.7057 16.5002C11.7057 16.155 11.9856 15.8752 12.3307 15.8752H13.1641C13.5092 15.8752 13.7891 16.155 13.7891 16.5002C13.7891 16.8453 13.5092 17.1252 13.1641 17.1252H12.3307C11.9856 17.1252 11.7057 16.8453 11.7057 16.5002Z" fill="currentColor" />
                            <path d="M15.6641 15.8752C15.3189 15.8752 15.0391 16.155 15.0391 16.5002C15.0391 16.8453 15.3189 17.1252 15.6641 17.1252H18.9974C19.3426 17.1252 19.6224 16.8453 19.6224 16.5002C19.6224 16.155 19.3426 15.8752 18.9974 15.8752H15.6641Z" fill="currentColor" />
                            <path fillRule="evenodd" clipRule="evenodd" d="M18.9974 7.3335H8.9974C7.15645 7.3335 5.66406 8.82588 5.66406 10.6668V17.3335C5.66406 19.1744 7.15645 20.6668 8.9974 20.6668H18.9974C20.8383 20.6668 22.3307 19.1744 22.3307 17.3335V10.6668C22.3307 8.82588 20.8383 7.3335 18.9974 7.3335ZM8.9974 8.5835H18.9974C20.148 8.5835 21.0807 9.51624 21.0807 10.6668V17.3335C21.0807 18.4841 20.148 19.4168 18.9974 19.4168H8.9974C7.8468 19.4168 6.91406 18.4841 6.91406 17.3335V10.6668C6.91406 9.51624 7.8468 8.5835 8.9974 8.5835Z" fill="currentColor" />
                        </svg>
                        <h2 className="text_primary">Пополнение баланса</h2>
                    </div>
                    <button className={styles.topUpModal__closeButton} onClick={onClose} type="button" aria-label="Закрыть">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none">
                            <path fill="currentColor" d="M1.789.307C1.3797-.1024.7162-.1024.307.307s-.4093 1.0727 0 1.482L3.518 5 .307 8.211c-.4093.4093-.4093 1.0728 0 1.482s1.0727.4093 1.482 0L5 6.482l3.211 3.211c.4093.4093 1.0728.4093 1.482 0s.4093-1.0727 0-1.482L6.482 5l3.211-3.211c.4093-.4093.4093-1.0728 0-1.482s-1.0727-.4093-1.482 0L5 3.518z" />
                        </svg>
                    </button>
                </div>

                <div className={styles.topUpModal__packages}>
                    {PACKAGES.map((pkg) => (
                        <button
                            key={pkg.id}
                            type="button"
                            className={`${styles.topUpModal__package} ${selectedPackage?.id === pkg.id ? styles.topUpModal__package_active : ''}`}
                            onClick={() => handlePackageSelect(pkg)}
                        >
                            {pkg.popular && <span className={styles.topUpModal__badge}>Популярный</span>}
                            <span className={styles.topUpModal__packageLabel}>{pkg.label}</span>
                            <span className={styles.topUpModal__packageTokens}>
                                {pkg.tokens.toLocaleString('ru-RU')}
                                &nbsp;
                                <svg width="18" height="18" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M4.48939 5.67406C4.32128 5.21976 3.67872 5.21976 3.51061 5.67406L3.27791 6.30294C3.22505 6.44577 3.11244 6.55839 2.96961 6.61124L2.34073 6.84394C1.88642 7.01205 1.88642 7.65461 2.34073 7.82272L2.96961 8.05543C3.11244 8.10828 3.22505 8.2209 3.27791 8.36373L3.51061 8.9926C3.67872 9.44691 4.32128 9.44691 4.48939 8.99261L4.7221 8.36373C4.77495 8.2209 4.88756 8.10828 5.03039 8.05543L5.65927 7.82272C6.11358 7.65461 6.11358 7.01205 5.65927 6.84394L5.03039 6.61124C4.88756 6.55839 4.77495 6.44577 4.7221 6.30294L4.48939 5.67406ZM4 7.04286C3.91675 7.15235 3.81902 7.25009 3.70953 7.33333C3.81902 7.41658 3.91675 7.51431 4 7.62381C4.08325 7.51431 4.18098 7.41658 4.29047 7.33333C4.18098 7.25009 4.08325 7.15235 4 7.04286Z" fill="#5329FF" />
                                    <path fillRule="evenodd" clipRule="evenodd" d="M7.94471 7.99991C7.95386 7.99997 7.96302 8 7.97219 8C10.1967 8 12 6.20914 12 4C12 1.79086 10.1967 0 7.97219 0C5.97641 0 4.31966 1.44152 4.00006 3.33333C4.00004 3.33333 4.00008 3.33333 4.00006 3.33333C1.79092 3.33333 0 5.12419 0 7.33333C0 9.54247 1.79086 11.3333 4 11.3333C5.98203 11.3333 7.62736 9.89176 7.94471 7.99991ZM7.98631 6.99997C9.64819 6.99242 10.993 5.65218 10.993 4C10.993 2.34315 9.64056 1 7.97219 1C6.48966 1 5.25656 2.06058 5.00024 3.45941C6.62143 3.87679 7.84481 5.28499 7.98631 6.99997ZM4 10.3333C5.65685 10.3333 7 8.99019 7 7.33333C7 5.67648 5.65685 4.33333 4 4.33333C2.34315 4.33333 1 5.67648 1 7.33333C1 8.99019 2.34315 10.3333 4 10.3333Z" fill="#5329FF" />
                                </svg>

                                {/* <span className={styles.topUpModal__packageTokensUnit}> токенов</span> */}
                                {/* {pkg.bonus && <span className={styles.topUpModal__packageBonus}>{pkg.bonus}</span>} */}
                            </span>
                            <span className={styles.topUpModal__packagePrice}>
                                {pkg.price.toLocaleString('ru-RU')} ₽
                            </span>
                        </button>
                    ))}
                </div>

                <RadarAntdButton
                    disabled={!canPay}
                    onClick={() => { handlePay() }}
                    loading={isLoading}
                    style={{ width: '100%' }}
                >
                    <span className={styles.topUpModal__payButtonText}>
                        Оплатить{canPay ? ` ${Number(displayAmount).toLocaleString('ru-RU')} ₽` : ''}
                    </span>
                </RadarAntdButton>
                <div className={`text_tertiary ${styles.topUpModal__footerText}`}>
                    Автосписаний и продлений нет — это разовая оплата. Мы не сохраняем данные Вашей карты.
                </div>
            </div>
        </div>,
        document.body
    );
};
