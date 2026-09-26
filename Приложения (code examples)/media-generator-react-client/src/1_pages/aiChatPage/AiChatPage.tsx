import styles from './AiChatPage.module.css'
import { AiChatInputWidget, AiChatMessagesWidget } from '@widgets'
import { Popover } from 'antd'
import { useAppSelector } from '@app'

const availableFormats = [
    { title: 'pdf', desc: 'До 10 МБ' },
    { title: 'jpeg', desc: 'До 5 МБ' },
    { title: 'png', desc: 'До 5 МБ' },
]

export const AiChatPage = () => {
    const { currentChatId, userMessage } = useAppSelector(state => state.aiChat);
    return (
        <section className={styles.aiChatPage}>
            {/* --------------------------------------------------------------dev info -------------------------------------------------------------- */}
            {import.meta.env.DEV &&
                <DevInfo
                    currentChatId={currentChatId}
                    userMessage={userMessage}
                />
            }
            {/* -------------------------------------------------------------------------------------------------------------------------------------- */}
            <div className={styles.aiChatPage__messages}>
                <AiChatMessagesWidget />
            </div>
            <div className={styles.page__inputWrapper}>
                <AiChatInputWidget />
                <p className={`text_secondary ${styles.page__inputDescription}`}>
                    Можно прикрепить до 5 файлов.&nbsp;
                    <Popover
                        arrow={false}
                        content={(
                            <div className={styles.page__popoverContent}>
                                {availableFormats.map((_, idx) => {
                                    return (
                                        <div key={idx} className={styles.page__popoverItem}>
                                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path fillRule="evenodd" clipRule="evenodd" d="M5 10C7.76142 10 10 7.76142 10 5C10 2.23858 7.76142 0 5 0C2.23858 0 0 2.23858 0 5C0 7.76142 2.23858 10 5 10ZM7.39016 3.89017C7.53661 3.74372 7.53661 3.50628 7.39016 3.35983C7.24372 3.21339 7.00628 3.21339 6.85983 3.35983L4.375 5.84467L3.14017 4.60984C2.99372 4.46339 2.75628 4.46339 2.60983 4.60984C2.46339 4.75628 2.46339 4.99372 2.60983 5.14017L4.10983 6.64017C4.25628 6.78661 4.49372 6.78661 4.64017 6.64017L7.39016 3.89017Z" fill="currentColor" />
                                            </svg>
                                            <p className='text_secondary' style={{ textTransform: 'uppercase' }}>{_.title}</p>
                                            <span className='text_secondary'>{_.desc}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    >
                        <span>Доступные форматы</span>
                    </Popover>
                </p>
            </div>
        </section>
    )
}

const DevInfo = (props: any) => {
    return (
        <div className={styles.devInfo}>
            {Object.keys(props).map((_, idx) => {
                return (
                    <span className='text_tertiary' key={idx}>{_}: {props[_]}</span>
                )
            })}
        </div>
    )
}