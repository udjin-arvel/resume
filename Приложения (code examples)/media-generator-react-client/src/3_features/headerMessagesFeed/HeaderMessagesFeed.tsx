import React from 'react'
import styles from './HeaderMessagesFeed.module.css';
import type { INotification } from '@shared/models/models';
import { API } from '@shared';

interface HeaderMessagesFeedProps {
    messages: INotification[] | undefined;
    closeHandler: () => void;
    showMoreHandler: () => void;
    listLength: number;
    unreadCount: number;
}

export const HeaderMessagesFeed: React.FC<HeaderMessagesFeedProps> = ({ messages, closeHandler, showMoreHandler, listLength, unreadCount }) => {
    const [readMessage] = API.usePatchMessagesMutation();
    const [readAllMessages] = API.useReadAllMessagesMutation();
    const onDeleteMsg = async (messageId: number) => {
        await readMessage({ notification_id: messageId });
    };

    const hasNewMessages = unreadCount > 0;

    return (
        <div className={styles.modal}>
            <div className={styles.modal__header}>
                <button className={styles.modal__closeButton} onClick={closeHandler}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 4.66688L10.6669 0L12 1.33312L7.33312 6L12 10.6669L10.6669 12L6 7.33312L1.33312 12L0 10.6669L4.66688 6L0 1.33312L1.33312 0L6 4.66688Z" fill="currentColor" fillOpacity="0.5" />
                    </svg>
                </button>
                <p className="title_secondary">Уведомления</p>
                {hasNewMessages && <button className={styles.modal__readAllButton} onClick={() => readAllMessages()}>
                    <span className="text_tertiary">Прочитать все</span>
                </button>}
            </div>
            <ul className={styles.list}>
                {messages && messages.length > 0 && messages.map(m => {
                    const isNew = m.status === 'new'

                    return (
                        <MessageItem
                            key={m.id}
                            m={m}
                            isNew={isNew}
                            onDeleteMsg={onDeleteMsg}
                        />
                    )
                }
                )}
                <div className={styles.modal__readAllButtonWrapper}>
                    {messages && messages.length > 0 && listLength === messages.length &&
                        <button
                            className={styles.modal__readAllButton}
                            onClick={() => {
                                showMoreHandler();
                            }}
                            disabled={listLength !== messages.length}
                        >
                            <span className="text_tertiary">Показать ещё</span>
                        </button>
                    }
                </div>
                {(!messages || (messages && messages.length === 0)) &&
                    <div className={styles.list__noMessages}>
                        <p className={styles.list__title}>Нет новых сообщений!</p>
                    </div>
                }
            </ul>
        </div>
    );
};


interface MessageItemProps {
    isNew: boolean | undefined;
    m: INotification;
    onDeleteMsg: (messageId: number) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({
    isNew,
    m,
    onDeleteMsg
}) => {

    return (
        <li
            id={`message_id_${m.id}`}
            className={isNew ? `${styles.list__item} ${styles.list__item_new}` : styles.list__item}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation()
                if (isNew) {
                    onDeleteMsg(m.id);
                }
            }}
        >
            {isNew &&
                <span className={`${styles.list__newLabel} text_secondary`}>Новое</span>
            }
            <div className={`${styles.list__itemBody} text_secondary`}>
                {m.text}
            </div>
            <div className={styles.list__itemHeader}>
                <div className={`${styles.list__itemHeaderWrapper} ${styles.list__itemHeaderWrapper_end}`}>
                    {/* <p className={styles.list__text}>{moment(`${m.created_at.split(' ').join('T')}+00:00`).locale('ru').local().format('DD MMMM, HH:mm')}</p> */}
                </div>
            </div>

            {isNew && <button
                className={styles.list__deleteButton}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation()
                    onDeleteMsg(m.id);
                }}
            >
                <svg width="6" height="6" viewBox="0 0 6 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.07337 0.184162C0.827825 -0.0613873 0.429711 -0.0613873 0.184162 0.184162C-0.0613873 0.429711 -0.0613873 0.827825 0.184162 1.07337L2.11079 3L0.184162 4.92663C-0.0613873 5.17218 -0.0613873 5.57029 0.184162 5.81584C0.429711 6.06139 0.827825 6.06139 1.07337 5.81584L3 3.88921L4.92663 5.81584C5.17217 6.06139 5.57029 6.06139 5.81584 5.81584C6.06139 5.57029 6.06139 5.17218 5.81584 4.92663L3.88921 3L5.81584 1.07337C6.06139 0.827825 6.06139 0.429711 5.81584 0.184162C5.57029 -0.0613873 5.17217 -0.0613869 4.92663 0.184162L3 2.11079L1.07337 0.184162Z" fill="currentColor" />
                </svg>
            </button>}
        </li>
    )
}
