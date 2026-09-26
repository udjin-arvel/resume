import { useEffect, useState } from 'react'
import styles from './AiChatSidebarContent.module.css'
import { NavLink } from 'react-router'
import { API, RadarAntdInput } from '@shared'
import { useAppSelector, useAppDispatch } from '@app'
import { aiChatActions } from '@entities'
import { App as AntdApp, Popover } from 'antd'

export const AiChatSidebarContent = () => {
    const { currentChatId } = useAppSelector(state => state.aiChat);
    const [isRenameChatState, setIsRenameChatState] = useState<{ isInProggress: boolean, value: string, chatId: number } | null>(null);
    const { message } = AntdApp.useApp();
    const dispatch = useAppDispatch();
    // API
    const { data: aiChatList, isError: isAiChatListError } = API.useGetAiChatListQuery();
    const [deleteChat, { isError: isDeleteChatError, isSuccess: isDeleteChatSuccess }] = API.useDeleteChatMutation();
    const [updateAiChat, { isLoading: isUpdateAiChatLoading, isError: isUpdateAiChatError, isSuccess: isUpdateAiChatSuccess }] = API.useUpdateAiChatMutation();
    // --- handlers
    const handleRenameChatStart = (chatId: number) => {
        const currentChat = aiChatList?.find(chat => chat.id === chatId);
        setIsRenameChatState({ isInProggress: true, value: currentChat?.title ?? '', chatId });
    }
    const handleRenameChatEnd = (chatId: number) => {
        updateAiChat({ chatId, data: { title: isRenameChatState?.value } });
    }
    const handleDeleteChat = (chatId: number) => {
        if (chatId === currentChatId) {
            dispatch(aiChatActions.setCurrentChatId(null));
        }
        deleteChat({ chatId });
    }

    useEffect(function getChatsQueryStatusHandler() {
        if (isAiChatListError) {
            message.error('Не удалось загрузить список чатов');
        }
        if (isUpdateAiChatError) {
            message.error('Не удалось переименовать чат');
            setIsRenameChatState(null);
        }
        if (isUpdateAiChatSuccess) {
            message.success('Чат переименован');
            setIsRenameChatState(null);
        }
    }, [isAiChatListError, isUpdateAiChatError, isUpdateAiChatSuccess]);
    useEffect(function handleApiStatuses() {
        if (isDeleteChatError) {
            message.error('Не удалось удалить чат');
        }
        if (isDeleteChatSuccess) {
            message.success('Чат удален');
        }
    }, [isDeleteChatError, isDeleteChatSuccess]);
    useEffect(function chatRenamingSideEffects() {
        if (!isRenameChatState || !isRenameChatState?.isInProggress) return;
        const keyDownHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                setIsRenameChatState(null);
            }
        };
        const globalClickHandler = (e: MouseEvent) => {
            if (e.target instanceof HTMLElement && e.target.id === 'chatRenameInput') return;
            setIsRenameChatState(null);
        }
        window.addEventListener('keydown', keyDownHandler);
        window.addEventListener('click', globalClickHandler);
        return () => {
            window.removeEventListener('keydown', keyDownHandler);
            window.removeEventListener('click', globalClickHandler);
        }
    }, [isRenameChatState]);
    return (
        <div className={styles.content}>
            <NavLink to='/' className={`${styles.content__backToMenuButton} text_secondary`} viewTransition>
                <svg xmlns="http://www.w3.org/2000/svg" width="5" height="8" fill="none">
                    <path fill="currentColor" fillRule="evenodd" d="M4.6414.1674a.5715.5715 0 0 1 0 .8082l-3.025 3.025 3.025 3.025a.5715.5715 0 1 1-.8082.8082L0 4.0006 3.8332.1674a.5715.5715 0 0 1 .8082 0" clipRule="evenodd" />
                </svg>
                Назад в меню
            </NavLink>

            <div className={styles.content__settings}>
                <span className={`text_primary ${styles.content__title}`}>
                    <svg width="18" height="19" viewBox="0 0 18 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M2.07709 0.468502C2.30824 -0.156168 3.19176 -0.156167 3.42291 0.468503L3.74288 1.33321C3.81555 1.5296 3.9704 1.68445 4.16679 1.75712L5.0315 2.07709C5.65617 2.30824 5.65617 3.19176 5.0315 3.42291L4.16679 3.74288C3.9704 3.81555 3.81555 3.9704 3.74288 4.16679L3.42291 5.0315C3.19176 5.65617 2.30824 5.65617 2.07709 5.0315L1.75712 4.16679C1.68445 3.9704 1.5296 3.81555 1.33321 3.74288L0.468502 3.42291C-0.156168 3.19176 -0.156167 2.30824 0.468503 2.07709L1.33321 1.75712C1.5296 1.68445 1.68445 1.5296 1.75712 1.33321L2.07709 0.468502ZM2.3506 2.75C2.50115 2.63553 2.63553 2.50115 2.75 2.3506C2.86447 2.50115 2.99885 2.63553 3.1494 2.75C2.99885 2.86447 2.86447 2.99885 2.75 3.1494C2.63553 2.99885 2.50115 2.86447 2.3506 2.75Z" fill="currentColor" />
                        <path fillRule="evenodd" clipRule="evenodd" d="M8.93128 11.7479C7.15573 12.3375 5.24 12.4037 3.41925 11.55C2.66293 13.7022 2.33835 15.8209 2.29139 17.4645C2.28054 17.844 1.96407 18.1429 1.58453 18.1321C1.20499 18.1212 0.906103 17.8048 0.916947 17.4252C0.973359 15.4508 1.3971 12.8745 2.41291 10.3162C2.77743 9.3982 3.21992 8.42478 3.752 7.45895C4.70563 5.7279 5.95832 4.00071 7.58453 2.66531C9.60317 1.00767 12.1849 -0.0334604 15.4164 0.260264C16.2419 0.3353 16.8933 0.715439 17.2117 1.41277C17.5024 2.04957 17.447 2.81093 17.2456 3.53421C16.838 4.99784 15.711 6.74858 14.2255 8.27085C12.7803 9.75181 10.9304 11.0841 8.93128 11.7479ZM8.45713 3.72794C10.2297 2.27237 12.4607 1.37227 15.2919 1.62962C15.7474 1.67102 15.8935 1.83636 15.9609 1.98388C16.0559 2.19192 16.0854 2.57476 15.921 3.16536C15.645 4.15633 14.9051 5.43105 13.8331 6.66756C13.5219 6.36862 13.0982 6.1341 12.5661 5.99167C11.582 5.72822 10.1997 5.76441 8.31242 6.23623C7.94406 6.32832 7.7201 6.70158 7.81219 7.06994C7.90428 7.4383 8.27755 7.66226 8.64591 7.57017C10.4253 7.12532 11.5462 7.14205 12.2106 7.3199C12.5497 7.41068 12.7575 7.5377 12.885 7.66376C11.6118 8.88376 10.0821 9.91697 8.49795 10.443C6.95688 10.9547 5.38835 10.9822 3.92005 10.2651C4.21813 9.56208 4.562 8.83822 4.95634 8.12242C5.85599 6.48936 7.00704 4.91871 8.45713 3.72794Z" fill="currentColor" />
                    </svg>
                    AI-чат
                </span>
                <button className={`text_secondary ${styles.content__newChatButton}`} disabled={!currentChatId} onClick={() => dispatch(aiChatActions.setCurrentChatId(null))}>Новый чат</button>
                <span className='text_secondary' style={{ fontWeight: 600, marginTop: 16 }}>Недавние</span>
                <ul className={styles.content__recentChats}>
                    {aiChatList?.map(_ => {
                        const isThisChatRenaming = isRenameChatState?.chatId === _.id && isRenameChatState?.isInProggress;

                        if (isThisChatRenaming) {
                            return (
                                <li className={`${styles.content__plainChatItem}`} key={_.id}>
                                    <RadarAntdInput
                                        value={isRenameChatState?.value}
                                        onChange={(e) => setIsRenameChatState({ ...isRenameChatState, value: e.target.value })}
                                        onPressEnter={() => handleRenameChatEnd(_.id)}
                                        disabled={isUpdateAiChatLoading}
                                        id='chatRenameInput'
                                        style={{ height: 32 }}
                                    />
                                </li>
                            )
                        } else {
                            return (
                                <li className={`${styles.content__recentChatItem} ${currentChatId === _.id ? styles.content__recentChatItem_selected : ''}`} key={_.id}>
                                    <button className={`${styles.content__recentChatItemButton}`} title={_.title} onClick={() => dispatch(aiChatActions.setCurrentChatId(_.id))}>
                                        <span className='text_secondary'>
                                            {_.title}
                                        </span>
                                    </button>
                                    <Popover
                                        trigger="click"
                                        placement="bottomLeft"
                                        arrow={false}
                                        styles={{
                                            container: {
                                                padding: 4,
                                            }
                                        }}
                                        content={
                                            <div className={styles.content__menuButtonItems}>
                                                <button className={`text_secondary ${styles.content__menuButtonItem}`} onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleRenameChatStart(_.id) }}>
                                                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path fillRule="evenodd" clipRule="evenodd" d="M4.29481 0.582464C4.04964 -0.194151 2.95063 -0.194158 2.70546 0.582463L1.14941 5.51154L0.0255297 8.90209C-0.0613552 9.16421 0.0806988 9.44713 0.342816 9.53401C0.604934 9.6209 0.887856 9.47885 0.974741 9.21673L1.98615 6.16547H5.01412L6.02553 9.21673C6.11241 9.47885 6.39534 9.6209 6.65745 9.53401C6.91957 9.44713 7.06163 9.16421 6.97474 8.90209L5.85088 5.51157L4.29481 0.582464ZM3.50014 1.38696L4.69297 5.16547H2.3073L3.50014 1.38696Z" fill="currentColor" />
                                                        <path fillRule="evenodd" clipRule="evenodd" d="M8.29774 5.64172C8.52666 5.06944 9.05644 4.85433 9.60366 4.89796C9.87774 4.91981 10.117 5.00714 10.2739 5.11634C10.4347 5.22822 10.4533 5.31711 10.4533 5.34842V5.68763C9.89252 5.66208 9.21318 5.69344 8.62912 5.86137C8.22964 5.97624 7.81273 6.17243 7.52971 6.51918C7.22518 6.89228 7.13092 7.37084 7.26564 7.91047C7.3901 8.409 7.62722 8.8053 7.99334 9.04752C8.35983 9.28997 8.7806 9.32845 9.17244 9.26142C9.60341 9.1877 10.044 8.9807 10.4533 8.7019V8.78936C10.4533 9.0655 10.6772 9.28936 10.9533 9.28936C11.2294 9.28936 11.4533 9.0655 11.4533 8.78936V5.34842C11.4533 4.87615 11.1653 4.51837 10.8452 4.29559C10.5213 4.07014 10.1057 3.93481 9.68314 3.90112C8.83713 3.83368 7.80702 4.17595 7.36927 5.27033C7.26671 5.52673 7.39142 5.81771 7.64781 5.92027C7.9042 6.02282 8.19519 5.89812 8.29774 5.64172ZM8.90547 6.82243C9.37193 6.68831 9.95963 6.66292 10.4533 6.6888V7.41612C9.96338 7.88624 9.42271 8.20408 9.00383 8.27574C8.78702 8.31282 8.64313 8.27836 8.54509 8.21351C8.4467 8.14842 8.31945 8.00305 8.23586 7.66825C8.16647 7.39028 8.22659 7.24686 8.30441 7.15151C8.40374 7.02981 8.59716 6.91108 8.90547 6.82243Z" fill="currentColor" />
                                                    </svg>
                                                    Переименовать
                                                </button>
                                                <button className={`text_secondary ${styles.content__menuButtonItem}`} onClick={() => handleDeleteChat(_.id)}>
                                                    <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path fillRule="evenodd" clipRule="evenodd" d="M2.4346 2.13763C2.39056 2.14345 2.34862 2.15483 2.30939 2.17098C1.78507 2.21194 1.32501 2.25266 0.993736 2.28339C0.824276 2.2991 0.688412 2.31221 0.594763 2.3214L0.486999 2.3321L0.44969 2.33587L0.44897 2.33595C0.174272 2.36415 -0.0255509 2.6097 0.0026539 2.8844C0.0308587 3.1591 0.27641 3.35892 0.551108 3.33072L0.550618 3.32593C0.551111 3.33072 0.551108 3.33072 0.551108 3.33072L0.587017 3.32708L0.692461 3.31662C0.784505 3.30758 0.918575 3.29465 1.08608 3.27911C1.42117 3.24804 1.88965 3.2066 2.42287 3.16516C3.49296 3.08202 4.81029 3 5.83337 3C6.85646 3 8.17379 3.08202 9.24388 3.16516C9.7771 3.2066 10.2456 3.24804 10.5807 3.27911C10.7482 3.29465 10.8822 3.30758 10.9743 3.31662L11.0797 3.32708L11.1152 3.33067C11.3899 3.35888 11.6359 3.1591 11.6641 2.8844C11.6923 2.6097 11.4925 2.36415 11.2178 2.33595L11.1797 2.3321L11.072 2.3214C10.9783 2.31221 10.8425 2.2991 10.673 2.28339C10.3417 2.25266 9.88165 2.21193 9.35732 2.17097C9.32291 2.15682 9.28638 2.14632 9.24811 2.14C8.91828 2.08558 8.64063 1.86327 8.5154 1.55333L8.45511 1.4041C8.11225 0.555528 7.28864 0 6.37342 0H5.47529C4.57219 0 3.75949 0.548168 3.42117 1.3855C3.25714 1.79149 2.8874 2.07786 2.4533 2.13517L2.4346 2.13763ZM5.47529 1C4.97983 1 4.53396 1.30074 4.34835 1.76012C4.30806 1.85984 4.26096 1.95561 4.20768 2.04693C4.77386 2.01858 5.33496 2 5.83337 2C6.3865 2 7.01684 2.02289 7.64566 2.0566C7.62507 2.01461 7.6059 1.9717 7.58822 1.92794L7.52793 1.77872C7.33778 1.3081 6.881 1 6.37342 1H5.47529Z" fill="currentColor" />
                                                        <path d="M10.3315 4.54331C10.3554 4.26821 10.1518 4.0258 9.87669 4.00188C9.60158 3.97796 9.35917 4.18158 9.33525 4.45669L8.79845 10.6299C8.73104 11.4051 8.08215 12 7.30409 12H4.09613C3.29305 12 2.63243 11.3675 2.59755 10.5652L2.3329 4.47828C2.32091 4.2024 2.08754 3.98848 1.81165 4.00047C1.53577 4.01247 1.32185 4.24584 1.33384 4.52172L1.59849 10.6086C1.65663 11.9458 2.75765 13 4.09613 13H7.30409C8.60085 13 9.68235 12.0085 9.79469 10.7166L10.3315 4.54331Z" fill="currentColor" />
                                                        <path d="M3.83337 10C3.55723 10 3.33337 10.2239 3.33337 10.5C3.33337 10.7761 3.55723 11 3.83337 11H7.83337C8.10952 11 8.33337 10.7761 8.33337 10.5C8.33337 10.2239 8.10952 10 7.83337 10H3.83337Z" fill="currentColor" />
                                                    </svg>
                                                    Удалить
                                                </button>
                                            </div>
                                        }
                                    >
                                        <button className={styles.content__menuButton}>
                                            <svg width="13" height="3" viewBox="0 0 13 3" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M1.13968 9.53674e-07C0.510252 9.53674e-07 0 0.510253 0 1.13968C0 1.76911 0.510252 2.27936 1.13968 2.27936H1.15311C1.78253 2.27936 2.29279 1.76911 2.29279 1.13968C2.29279 0.510253 1.78253 9.53674e-07 1.15311 9.53674e-07H1.13968Z" fill="currentColor" />
                                                <path d="M6.27936 9.53674e-07C5.64993 9.53674e-07 5.13968 0.510253 5.13968 1.13968C5.13968 1.76911 5.64993 2.27936 6.27936 2.27936H6.29279C6.92221 2.27936 7.43246 1.76911 7.43246 1.13968C7.43246 0.510253 6.92221 9.53674e-07 6.29279 9.53674e-07H6.27936Z" fill="currentColor" />
                                                <path d="M11.2928 0C10.6634 0 10.1531 0.510252 10.1531 1.13968C10.1531 1.76911 10.6634 2.27936 11.2928 2.27936H11.3062C11.9356 2.27936 12.4459 1.76911 12.4459 1.13968C12.4459 0.510252 11.9356 0 11.3062 0H11.2928Z" fill="currentColor" />
                                            </svg>
                                        </button>
                                    </Popover>
                                </li>
                            )
                        }

                    })}
                </ul>
            </div>
        </div>
    )
}