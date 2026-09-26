import { useEffect, useRef } from 'react';
import { API, MessageBubble } from '@shared';
import styles from './AiChatMessagesWidget.module.css'
import { useAppDispatch, useAppSelector } from '@app'
import { skipToken } from '@reduxjs/toolkit/query';
import { App as AntdApp } from 'antd'
import { aiChatActions } from '@entities'

export const AiChatMessagesWidget = () => {
    const { message } = AntdApp.useApp();
    const dispatch = useAppDispatch();
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const shownStreamErrorRef = useRef<string | null>(null);
    const resumeAttemptRef = useRef<string>('');
    const prevChatIdRef = useRef<number | null>(null);
    const { currentChatId, streamRequestNonce, streamRequestChatId, streamError, isStreaming } = useAppSelector(state => state.aiChat);
    const { refetch: refetchChatList } = API.useGetAiChatListQuery();
    const { refetch: refetchUserData } = API.useGetUserDataQuery();
    const {
        data: currentChatMessagesData,
        isError: isCurrentChatMessagesError,
        isSuccess: isCurrentChatMessagesSuccess,
        fulfilledTimeStamp: currentChatMessagesFulfilledTimeStamp,
        refetch: refetchCurrentChatMessages,
    } = API.useGetCurrentChatMessagesQuery(currentChatId ?? skipToken);
    const lastMessage = currentChatMessagesData?.messages[currentChatMessagesData.messages.length - 1];
    const isWaitingForAssistant = Boolean(isStreaming && lastMessage?.role === 'user');
    const isTypingAssistantMessage = Boolean(isStreaming && lastMessage?.role === 'assistant');
    const [regenerateCurrentChatMessages, { isLoading: isRegenerateLoading }] = API.useRegenerateCurrentChatMessagesMutation();
    // Subscribe to SSE only when this chat explicitly requested a stream start.
    const streamQueryArg = (() => {
        if (!currentChatId) return skipToken;

        if (streamRequestChatId === currentChatId && streamRequestNonce > 0) {
            return { chatId: currentChatId, requestKey: streamRequestNonce };
        }

        return skipToken;
    })();
    API.useListenCurrentChatStreamQuery(streamQueryArg);
    // --- handlers
    const handleRegenerateMessage = async (messageId: number) => {
        if (!currentChatId) return;
        try {
            await regenerateCurrentChatMessages({ chatId: currentChatId, messageId }).unwrap();
            dispatch(aiChatActions.requestStreamStart(currentChatId));
        } catch {
            message.error('Не удалось регенерировать ответ');
        }
    }
    // --- effects
    // Handle initial/current chat messages query statuses.
    useEffect(function handleApiStatuses() {
        if (isCurrentChatMessagesError) {
            message.error('Не удалось загрузить сообщения чата');
        }
        if (isCurrentChatMessagesSuccess) {
            messagesContainerRef.current?.scrollTo({
                top: messagesContainerRef.current?.scrollHeight,
                behavior: 'smooth',
            });
            refetchChatList();
        }

    }, [isCurrentChatMessagesError, isCurrentChatMessagesSuccess]);
    useEffect(function refetchChatListOnNewMessage() {
        if (!currentChatId) return;
        refetchUserData();
        if (currentChatMessagesData?.messages && currentChatMessagesData.messages.filter(message => message.role === 'assistant').length !== 1) return;
        const timeout = setTimeout(() => {
            refetchChatList();
        }, 3000);
        return () => clearTimeout(timeout);
    }, [currentChatId, currentChatMessagesFulfilledTimeStamp, currentChatMessagesData]);
    useEffect(function scrollToBottom() {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTo({
                top: messagesContainerRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [currentChatMessagesData]);
    // Auto-resume stream once per last user message after reload/reconnect.
    useEffect(function resumeStreamOnceAfterReloadOrReconnect() {
        if (!currentChatId || !currentChatMessagesData) return;
        if (isStreaming) return;
        if (streamRequestChatId === currentChatId) return;
        if (lastMessage?.role !== 'user') return;
        const resumeKey = `${currentChatId}:${lastMessage.id}:${lastMessage.created_at}`;
        if (resumeAttemptRef.current === resumeKey) return;
        resumeAttemptRef.current = resumeKey;
        dispatch(aiChatActions.requestStreamStart(currentChatId));
    }, [currentChatId, currentChatMessagesData, isStreaming, streamRequestChatId, lastMessage]);
    // Show stream error toast only once per distinct error text.
    useEffect(function handleStreamErrorStatus() {
        if (!streamError) return;
        if (shownStreamErrorRef.current === streamError) return;

        shownStreamErrorRef.current = streamError;
        dispatch(aiChatActions.setIsStreaming(false));
        message.error('Поток ответа прервался, можно повторить запрос');
    }, [streamError]);
    // On real chat switch: reset local one-shot guards and stale stream flags.
    useEffect(function resetStatusRefsOnChatChange() {
        if (prevChatIdRef.current === null) {
            prevChatIdRef.current = currentChatId;
            return;
        }
        if (prevChatIdRef.current === currentChatId) return;

        prevChatIdRef.current = currentChatId;
        resumeAttemptRef.current = '';
        shownStreamErrorRef.current = null;
        dispatch(aiChatActions.setStreamError(null));
        if (streamRequestChatId !== currentChatId) {
            dispatch(aiChatActions.setIsStreaming(false));
        }
    }, [currentChatId, streamRequestChatId]);
    // On chat switch, fetch history unless this chat already has active/pending stream request.
    useEffect(function refetchCurrentChatMessagesOnChatChange() {
        if (!currentChatId) return;
        if (streamRequestChatId === currentChatId) return;
        refetchCurrentChatMessages();
    }, [currentChatId, streamRequestChatId]);
    return (
        <div className={`${styles.aiChatMessagesWidget} ${currentChatId ? styles.aiChatMessagesWidget_active : ''}`} ref={messagesContainerRef}>
            {!currentChatId && <EmptyBlock />}
            {currentChatId && currentChatMessagesData &&
                <ul className={styles.messagesList}>
                    {currentChatMessagesData.messages.map(item => {
                        const isCurrentLastAssistantMessage = item.id === lastMessage?.id && item.role === 'assistant';
                        let style = {};
                        if (item.role === 'user') {
                            style = { alignSelf: 'flex-end', maxWidth: '45%' };
                        } else {
                            style = { alignSelf: 'flex-start', maxWidth: '60%', width: '100%' };
                        }
                        return (
                            <li className={styles.messageItem} key={item.id} style={style}>
                                <MessageBubble
                                    message={item.content}
                                    attachments={item.attachments}
                                    role={item.role}
                                    isTyping={isCurrentLastAssistantMessage && isTypingAssistantMessage}
                                    messageId={item.id}
                                    disabled={isStreaming || isRegenerateLoading}
                                    onRegenerateMessage={handleRegenerateMessage}
                                />
                            </li>
                        )
                    })}
                    {isWaitingForAssistant &&
                        <li className={`${styles.messageItem} ${styles.streamLoadingState}`} style={{ padding: '50px 12px' }}>
                            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9.33521 1.27773C8.7048 -0.42591 6.2952 -0.425912 5.66479 1.27773L4.79215 3.63603C4.59395 4.17165 4.17165 4.59395 3.63603 4.79215L1.27773 5.66479C-0.425911 6.2952 -0.425912 8.7048 1.27773 9.33521L3.63603 10.2079C4.17165 10.4061 4.59395 10.8284 4.79215 11.364L5.66479 13.7223C6.2952 15.4259 8.7048 15.4259 9.33521 13.7223L10.2079 11.364C10.4061 10.8284 10.8284 10.4061 11.364 10.2079L13.7223 9.33521C15.4259 8.7048 15.4259 6.2952 13.7223 5.66479L11.364 4.79215C10.8284 4.59395 10.4061 4.17165 10.2079 3.63603L9.33521 1.27773Z" fill="var(--color-primary,#5329FF)" />
                            </svg>
                            <span className={`text_secondary ${styles.streamLoadingStateText}`}>
                                Генерация ответа
                                <span className={styles.loadingDots} aria-hidden="true">
                                    <span className={styles.loadingDot}>.</span>
                                    <span className={styles.loadingDot}>.</span>
                                    <span className={styles.loadingDot}>.</span>
                                </span>
                            </span>
                        </li>
                    }
                </ul>
            }
        </div>
    )
}

const EmptyBlock = () => {
    return (
        <div className={styles.emptyBlock}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M5.68919 3.34808C6.02541 2.43947 7.31053 2.43947 7.64675 3.34808L8.11216 4.60584C8.21786 4.8915 8.44309 5.11673 8.72876 5.22244L9.98651 5.68785C10.8951 6.02406 10.8951 7.30919 9.98651 7.6454L8.72876 8.11082C8.44309 8.21652 8.21786 8.44175 8.11216 8.72741L7.64675 9.98517C7.31053 10.8938 6.02541 10.8938 5.68919 9.98517L5.22378 8.72741C5.11807 8.44175 4.89285 8.21652 4.60718 8.11082L3.34943 7.6454C2.44082 7.30919 2.44082 6.02406 3.34943 5.68785L4.60718 5.22244C4.89285 5.11673 5.11807 4.8915 5.22378 4.60584L5.68919 3.34808ZM6.08702 6.66663C6.30601 6.50013 6.50147 6.30466 6.66797 6.08568C6.83446 6.30467 7.02993 6.50013 7.24892 6.66663C7.02993 6.83312 6.83447 7.02859 6.66797 7.24757C6.50147 7.02859 6.30601 6.83312 6.08702 6.66663Z" fill="#5329FF" />
                <path fillRule="evenodd" clipRule="evenodd" d="M15.6589 19.7546C13.0763 20.6121 10.2898 20.7083 7.64142 19.4666C6.54132 22.597 6.0692 25.6788 6.00089 28.0695C5.98512 28.6216 5.5248 29.0563 4.97274 29.0406C4.42068 29.0248 3.98594 28.5645 4.00171 28.0124C4.08376 25.1405 4.70012 21.3932 6.17766 17.672C6.70787 16.3367 7.35149 14.9208 8.12542 13.516C9.51253 10.9981 11.3346 8.48584 13.7 6.54344C16.6362 4.13233 20.3914 2.61796 25.0918 3.04519C26.2926 3.15433 27.24 3.70727 27.7031 4.72156C28.1261 5.64782 28.0454 6.75525 27.7524 7.8073C27.1596 9.93622 25.5204 12.4827 23.3596 14.697C21.2575 16.8511 18.5668 18.789 15.6589 19.7546ZM14.9693 8.08909C17.5475 5.97189 20.7926 4.66266 24.9108 5.03698C25.5733 5.0972 25.7858 5.3377 25.8838 5.55227C26.022 5.85487 26.0649 6.41174 25.8257 7.27079C25.4243 8.71219 24.3481 10.5663 22.7888 12.3649C22.3362 11.9301 21.7199 11.589 20.946 11.3818C19.5145 10.9986 17.5039 11.0512 14.7588 11.7375C14.223 11.8714 13.8972 12.4144 14.0312 12.9502C14.1651 13.486 14.708 13.8117 15.2438 13.6778C17.8321 13.0307 19.4624 13.0551 20.4288 13.3138C20.922 13.4458 21.2243 13.6305 21.4097 13.8139C19.5579 15.5885 17.3329 17.0913 15.0286 17.8565C12.7871 18.6008 10.5056 18.6408 8.36986 17.5977C8.80342 16.5751 9.30361 15.5222 9.87718 14.4811C11.1858 12.1057 12.86 9.82112 14.9693 8.08909Z" fill="#5329FF" />
            </svg>
            <h2 className="title_secondary" style={{ marginTop: 24 }}>
                Какой у тебя запрос?
            </h2>
            <p className={`text_primary ${styles.emptyBlock__description}`}>
                Можно создать описание товара или проанализировать что-то*
            </p>
        </div>
    )
}