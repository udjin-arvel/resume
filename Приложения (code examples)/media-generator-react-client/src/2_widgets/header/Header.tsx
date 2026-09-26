import React, { useState } from 'react'
import styles from './Header.module.css'
import { Breadcrumbs, HeaderMessagesFeed } from '@features'
import { useBreadcrumbs, API, numberFormatter } from '@shared'
import { Badge, Popover } from 'antd'
import { TopUpModal } from './TopUpModal'

interface IHeaderProps {
    breadcrumbsTailsOnly?: boolean,
    hasBillingDataBlock?: boolean,
    hasNotificationsBlock?: boolean,
}

const popoverOptions = {
    arrow: false,
    trigger: 'click' as const,
    placement: 'bottomLeft' as const
};


export const Header: React.FC<IHeaderProps> = ({
    breadcrumbsTailsOnly = false,
    hasBillingDataBlock = true,
    hasNotificationsBlock = true
}) => {
    const [isMessagesFeedPopoverVisible, setIsMessagesFeedPopoverVisible] = useState(false);
    const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
    const [messagesLimit, setMessagesLimit] = useState(10);
    const { data: billingData } = API.useGetUserDataQuery();
    const breadcrumbsConfig = useBreadcrumbs(breadcrumbsTailsOnly)
    const { data: messages } = API.useGetMessagesQuery({ limit: messagesLimit }, { pollingInterval: 10000, skipPollingIfUnfocused: true, });

    const menuPopoverOpenHandler = (open: boolean): void => {
        setIsMessagesFeedPopoverVisible(open);
    };

    return (
        <header className={styles.header}>
            <Breadcrumbs config={breadcrumbsConfig} />
            <div className={styles.header__blocks}>
                {hasBillingDataBlock &&
                    <>
                        <BillingCard
                            label='Токены: '
                            value={numberFormatter(billingData?.tokens ?? '—', 'токенов')}
                            icon={(
                                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="28" height="28" rx="8.13953" fill="currentColor" fillOpacity="0.1" />
                                    <path fillRule="evenodd" clipRule="evenodd" d="M12.1117 13.9261C11.9016 13.3582 11.0984 13.3582 10.8883 13.9261L10.5974 14.7122C10.5313 14.8907 10.3905 15.0315 10.212 15.0975L9.42591 15.3884C8.85803 15.5986 8.85803 16.4018 9.42591 16.6119L10.212 16.9028C10.3905 16.9688 10.5313 17.1096 10.5974 17.2882L10.8883 18.0743C11.0984 18.6421 11.9016 18.6421 12.1117 18.0743L12.4026 17.2882C12.4687 17.1096 12.6095 16.9688 12.788 16.9028L13.5741 16.6119C14.142 16.4018 14.142 15.5986 13.5741 15.3884L12.788 15.0975C12.6095 15.0315 12.4687 14.8907 12.4026 14.7122L12.1117 13.9261ZM11.5 15.6371C11.3959 15.7739 11.2738 15.8961 11.1369 16.0002C11.2738 16.1042 11.3959 16.2264 11.5 16.3633C11.6041 16.2264 11.7262 16.1042 11.8631 16.0002C11.7262 15.8961 11.6041 15.7739 11.5 15.6371Z" fill="currentColor" />
                                    <path fillRule="evenodd" clipRule="evenodd" d="M16.4309 16.8334C16.4423 16.8335 16.4538 16.8335 16.4652 16.8335C19.2459 16.8335 21.5 14.5949 21.5 11.8335C21.5 9.07207 19.2459 6.8335 16.4652 6.8335C13.9705 6.8335 11.8996 8.6354 11.5001 11.0002C11.5001 11.0002 11.5001 11.0002 11.5001 11.0002C8.73866 11.0002 6.5 13.2387 6.5 16.0002C6.5 18.7616 8.73858 21.0002 11.5 21.0002C13.9775 21.0002 16.0342 19.1982 16.4309 16.8334ZM16.4829 15.5835C18.5602 15.574 20.2413 13.8987 20.2413 11.8335C20.2413 9.76243 18.5507 8.0835 16.4652 8.0835C14.6121 8.0835 13.0707 9.40922 12.7503 11.1578C14.7768 11.6795 16.306 13.4397 16.4829 15.5835ZM11.5 19.7502C13.5711 19.7502 15.25 18.0712 15.25 16.0002C15.25 13.9291 13.5711 12.2502 11.5 12.2502C9.42893 12.2502 7.75 13.9291 7.75 16.0002C7.75 18.0712 9.42893 19.7502 11.5 19.7502Z" fill="currentColor" />
                                </svg>
                            )}
                            actionLabel='Пополнить'
                            action={() => setIsTopUpModalOpen(true)}
                        />
                        {isTopUpModalOpen &&
                            <TopUpModal
                                open={isTopUpModalOpen}
                                onClose={() => setIsTopUpModalOpen(false)}
                            />
                        }
                    </>
                }
                {hasNotificationsBlock &&
                    <Popover
                        {...popoverOptions}
                        open={isMessagesFeedPopoverVisible}
                        onOpenChange={menuPopoverOpenHandler}
                        className={styles.header__popover}
                        content={<HeaderMessagesFeed messages={messages?.items} closeHandler={() => setIsMessagesFeedPopoverVisible(false)} showMoreHandler={() => setMessagesLimit(messagesLimit + 10)} listLength={messagesLimit} unreadCount={messages?.unread_count ?? 0} />}
                    >
                        <span className={styles.header__alertTrigger}>
                            <Badge count={messages?.unread_count} size="default" offset={[-10, 4]}>
                                <button type="button" className={styles.header__alertButton}>
                                    <svg width="14" height="17" viewBox="0 0 14 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M5.54023 1.00739C2.92226 1.6526 0.980744 4.01648 0.980744 6.83361V7.91667C0.980743 9.38761 0.522806 11.2302 0.0802982 12.6674C-0.267504 13.797 0.556724 15 1.73863 15H5.09979C5.09979 15.2189 5.1429 15.4356 5.22666 15.6378C5.31042 15.84 5.43318 16.0237 5.58795 16.1785C5.74271 16.3333 5.92644 16.456 6.12865 16.5398C6.33086 16.6236 6.54759 16.6667 6.76646 16.6667C6.98533 16.6667 7.20205 16.6236 7.40426 16.5398C7.60647 16.456 7.7902 16.3333 7.94497 16.1785C8.09973 16.0237 8.2225 15.84 8.30626 15.6378C8.39001 15.4356 8.43312 15.2189 8.43312 15H12.0243C13.1414 15 13.9526 13.92 13.6974 12.8325C13.3533 11.3668 12.9807 9.43011 12.9807 7.91667V6.83361C12.9807 3.85708 10.8133 1.38656 7.97062 0.914611C7.95711 0.866104 7.94066 0.818358 7.92131 0.771646C7.85849 0.619989 7.76641 0.48219 7.65034 0.366117C7.53427 0.250043 7.39647 0.157969 7.24481 0.0951505C7.09316 0.032332 6.93061 0 6.76646 0C6.60231 0 6.43976 0.0323322 6.2881 0.0951507C6.13645 0.157969 5.99865 0.250043 5.88257 0.366117C5.7665 0.48219 5.67443 0.619989 5.61161 0.771646C5.58003 0.84787 5.55616 0.926845 5.54023 1.00739ZM2.23074 6.83361V7.91667C2.23074 9.58676 1.72269 11.5811 1.27495 13.0352C1.22223 13.2064 1.25532 13.3916 1.35883 13.539C1.45932 13.6821 1.59529 13.75 1.73863 13.75H12.0243C12.29 13.75 12.5621 13.4661 12.4804 13.1181C12.1336 11.6406 11.7307 9.58432 11.7307 7.91667V6.83361C11.7307 4.21018 9.60402 2.08333 6.98074 2.08333C4.35747 2.08333 2.23074 4.21018 2.23074 6.83361Z" fill="currentColor" />
                                    </svg>
                                </button>
                            </Badge>
                        </span>
                    </Popover>
                }
            </div>
        </header>
    )
}

interface IBillingCardProps {
    label: string,
    value: string,
    icon?: React.ReactNode
    actionLabel?: string
    action?: () => void
}

const BillingCard: React.FC<IBillingCardProps> = ({
    label,
    icon,
    value,
    actionLabel,
    action,
}) => {
    return (
        <div className={styles.header__billingCard}>
            {icon ?? null}
            <p className="text_secondary">{label}<span className='text_primary'>{value}</span></p>
            {actionLabel && action &&
                <button onClick={action} className={`${styles.billingCard__actionButton} text_primary`}>
                    {actionLabel}
                </button>
            }
        </div>
    )
}