import { useEffect, useMemo, useState } from 'react';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import styles from './MessageBubble.module.css'
import type { IUploadAssetResponse } from '@shared/models/models';

interface IMessageBubbleProps {
    message: string;
    role: 'user' | 'assistant' | 'system';
    isTyping?: boolean;
    attachments?: IUploadAssetResponse[];
    messageId: number;
    disabled?: boolean;
    onRegenerateMessage: (messageId: number) => void;
}

const formatAiMessage = (message: string) => {
    const paragraphArray = message.split('\n');
    const normalizedParagraphArray = paragraphArray.map(p => {
        let newP = p;
        newP = newP.replaceAll('\n', '');
        // --- looking for the headlines
        const headlineBoundaryPattern = '**';
        const firstIndex = newP.indexOf(headlineBoundaryPattern);
        if (firstIndex !== -1) {
            const secondIndex = newP.indexOf(headlineBoundaryPattern, firstIndex + headlineBoundaryPattern.length);
            const headline = newP.slice(firstIndex + headlineBoundaryPattern.length, secondIndex);
            if (headline.trim()) {
                newP = newP.replace(headline, `<b>${headline}</b>`);
                newP = newP.replaceAll(headlineBoundaryPattern, '');
            }
        }
        return newP;
    })
    return normalizedParagraphArray;
}

type TSharePlatform = 'vk' | 'ok' | 'tg' | 'whatsapp' | 'max';

const getShareUrl = (platform: TSharePlatform, text: string) => {
    const encodedText = encodeURIComponent(text);
    const shareableUrl = 'https://app.radar-analytica.ru';
    const encodedShareableUrl = encodeURIComponent(shareableUrl);

    if (platform === 'vk') {
        return `https://vk.com/share.php?comment=${encodedText}`;
    }
    if (platform === 'ok') {
        return `https://connect.ok.ru/offer?url=${encodedShareableUrl}&description=${encodedText}`;
    }
    if (platform === 'tg') {
        return `https://t.me/share/url?url=${encodedShareableUrl}&text=${encodedText}`;
    }
    if (platform === 'max') {
        return `https://max.ru/:share?text=${encodedText}`;
    }

    return `https://api.whatsapp.com/send?text=${encodedText}`;
}

export const MessageBubble: React.FC<IMessageBubbleProps> = ({
    message,
    role,
    isTyping = false,
    attachments,
    messageId,
    disabled = false,
    onRegenerateMessage
}) => {
    // --- states
    const [visibleMessage, setVisibleMessage] = useState(message);
    const [isCopied, setIsCopied] = useState(false);
    // --- memos
    const imageAttachments = useMemo(() => {
        if (!attachments) return [];
        return attachments?.filter(attachment => attachment?.kind === 'image');
    }, [attachments]);
    const docsAttachments = useMemo(() => {
        if (!attachments) return [];
        return attachments?.filter(attachment => attachment?.kind === 'document');
    }, [attachments]);
    const messageClass = useMemo(() => {
        if (role === 'user') {
            return styles.messageBubble_user;
        } else {
            return styles.messageBubble_agent;
        }
    }, [role]);
    // --- handlers
    const handleCopyMessage = () => {
        navigator.clipboard.writeText(visibleMessage);
        setIsCopied(true);
        setTimeout(() => {
            setIsCopied(false);
        }, 1000);
    }
    const handleShareClick: MenuProps['onClick'] = ({ key }) => {
        const shareUrl = getShareUrl(key as TSharePlatform, visibleMessage);
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
    const shareMenuItems = useMemo<MenuProps['items']>(() => {
        return [
            { key: 'vk', label: 'VK' },
            { key: 'ok', label: 'Одноклассники' },
            { key: 'tg', label: 'Telegram' },
            { key: 'whatsapp', label: 'WhatsApp' },
            { key: 'max', label: 'Max' },
        ];
    }, []);

    // --- effects
    useEffect(() => {
        if (!isTyping) {
            setVisibleMessage(message);
            return;
        }

        setVisibleMessage((previousMessage) => {
            if (message.length < previousMessage.length) {
                return message;
            }
            return previousMessage;
        });
    }, [isTyping, message]);
    useEffect(() => {
        if (!isTyping) return;
        if (visibleMessage.length >= message.length) return;
        const timeoutId = window.setTimeout(() => {
            setVisibleMessage(message.slice(0, visibleMessage.length + 1));
        }, 10);

        return () => {
            window.clearTimeout(timeoutId);
        }
    }, [isTyping, message, visibleMessage]);

    return (
        <>

            {role === 'user' && imageAttachments && imageAttachments.length > 0 &&
                <div className={styles.messageBubble__imgAttachments}>
                    {imageAttachments.map((_, idx) => {
                        return (
                            <a href={_.url} target='_blank' className={styles.widget__assetItem} key={idx}>
                                <img src={_.url_thumbnail} alt="asset" />
                            </a>
                        )
                    })}
                </div>
            }
            {role === 'user' && docsAttachments && docsAttachments.length > 0 &&
                <div className={styles.messageBubble__docsAttachments}>
                    {docsAttachments.map((_, idx) => {
                        return (
                            <a href={_.url} target='_blank' className={`${styles.widget__assetItem} ${styles.widget__assetItem_document}`} key={idx}>
                                <svg width="11" height="13" viewBox="0 0 11 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M2.5 6.66667C2.22386 6.66667 2 6.89052 2 7.16667C2 7.44281 2.22386 7.66667 2.5 7.66667H7.83333C8.10948 7.66667 8.33333 7.44281 8.33333 7.16667C8.33333 6.89052 8.10948 6.66667 7.83333 6.66667H2.5Z" fill="var(--color-primary,#5329FF)" />
                                    <path d="M2 4.5C2 4.22386 2.22386 4 2.5 4H5.16667C5.44281 4 5.66667 4.22386 5.66667 4.5C5.66667 4.77614 5.44281 5 5.16667 5H2.5C2.22386 5 2 4.77614 2 4.5Z" fill="var(--color-primary,#5329FF)" />
                                    <path d="M2.5 9.33333C2.22386 9.33333 2 9.55719 2 9.83333C2 10.1095 2.22386 10.3333 2.5 10.3333H7.83333C8.10948 10.3333 8.33333 10.1095 8.33333 9.83333C8.33333 9.55719 8.10948 9.33333 7.83333 9.33333H2.5Z" fill="var(--color-primary,#5329FF)" />
                                    <path fillRule="evenodd" clipRule="evenodd" d="M3.16667 0C1.41777 0 0 1.41776 0 3.16667V9.83333C0 11.5822 1.41776 13 3.16667 13H7.16667C8.91557 13 10.3333 11.5822 10.3333 9.83333V4.27124C10.3333 3.43138 9.9997 2.62593 9.40584 2.03207L8.30127 0.927495C7.7074 0.33363 6.90195 0 6.0621 0H3.16667ZM1 3.16667C1 1.97005 1.97005 1 3.16667 1H6.0621C6.63673 1 7.18783 1.22827 7.59416 1.6346L8.69873 2.73917C9.10506 3.1455 9.33333 3.6966 9.33333 4.27124V9.83333C9.33333 11.03 8.36328 12 7.16667 12H3.16667C1.97005 12 1 11.03 1 9.83333V3.16667Z" fill="var(--color-primary,#5329FF)" />
                                </svg>
                                <div className={styles.widget__assetText}>
                                    <p className="text_secondary" style={{ fontWeight: 600 }}>{_.original_filename}</p>
                                    <span className="text_tertiary">{_.mime_type?.replace(/^.*\//, '').toUpperCase()}</span>
                                </div>
                            </a>
                        )
                    })}
                </div>
            }
            <div className={`text_primary ${styles.messageBubble} ${messageClass}`} style={{ marginTop: 8 }}>
                {role === 'user' && <span>{visibleMessage}</span>}
                {role !== 'user' &&
                    <>
                        <div className={styles.messageBubble__aiMessageWrapper}>
                            {formatAiMessage(visibleMessage).map((_, idx) => {
                                return (
                                    <div className={styles.messageBubble__aiMessageParagraph} dangerouslySetInnerHTML={{ __html: _ }} key={idx}></div>
                                )
                            })}
                        </div>
                        <aside className={styles.messageBubble__aiMessageControls}>
                            <button className={`${styles.messageBubble__aiMessageControlButton} text_secondary`} onClick={handleCopyMessage} disabled={disabled}>
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M0 2.5C0 1.11929 1.11929 0 2.5 0H4.34203C5.07185 0 5.76522 0.318907 6.24018 0.873022L7.0633 1.83333H5.74622L5.48092 1.52381C5.19595 1.19134 4.77992 1 4.34203 1H2.5C1.67157 1 1 1.67157 1 2.5V6.5C1 7.32843 1.67157 8 2.5 8H3.16667V9H2.5C1.11929 9 0 7.88071 0 6.5V2.5Z" fill="currentColor" />
                                    <path fillRule="evenodd" clipRule="evenodd" d="M6.5 2.66667C5.11929 2.66667 4 3.78595 4 5.16667V9.16667C4 10.5474 5.11929 11.6667 6.5 11.6667H9.16667C10.5474 11.6667 11.6667 10.5474 11.6667 9.16667V6.12874C11.6667 5.53196 11.4532 4.95487 11.0648 4.50176L10.2402 3.53969C9.76522 2.98557 9.07185 2.66667 8.34204 2.66667H6.5ZM5 5.16667C5 4.33824 5.67157 3.66667 6.5 3.66667H8.34204C8.77992 3.66667 9.19595 3.85801 9.48092 4.19048L10.3056 5.15255C10.5386 5.42441 10.6667 5.77067 10.6667 6.12874V9.16667C10.6667 9.99509 9.99509 10.6667 9.16667 10.6667H6.5C5.67157 10.6667 5 9.99509 5 9.16667V5.16667Z" fill="currentColor" />
                                </svg>
                                {isCopied ? 'Скопировано...' : 'Копировать'}
                            </button>
                            <div className={styles.messageBubble__aiMessageControlsWrapper}>
                                <Dropdown
                                    trigger={['click']}
                                    placement='bottomRight'
                                    disabled={disabled}
                                    classNames={{ root: styles.messageBubble__shareDropdown }}
                                    menu={{
                                        items: shareMenuItems,
                                        onClick: handleShareClick,
                                    }}
                                >
                                    <button className={`${styles.messageBubble__aiMessageControlButton} text_secondary`} disabled={disabled}>
                                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M6.85355 0.146447C6.65829 -0.0488155 6.34171 -0.0488155 6.14645 0.146447L4.81311 1.47978C4.61785 1.67504 4.61785 1.99162 4.81311 2.18689C5.00838 2.38215 5.32496 2.38215 5.52022 2.18689L6 1.70711V7.16667C6 7.44281 6.22386 7.66667 6.5 7.66667C6.77614 7.66667 7 7.44281 7 7.16667V1.70711L7.47978 2.18689C7.67504 2.38215 7.99162 2.38215 8.18689 2.18689C8.38215 1.99162 8.38215 1.67504 8.18689 1.47978L6.85355 0.146447Z" fill="currentColor" />
                                            <path d="M1 8.5C1 7.67157 1.67157 7 2.5 7C2.77614 7 3 6.77614 3 6.5C3 6.22386 2.77614 6 2.5 6C1.11929 6 0 7.11929 0 8.5V9.83333C0 11.5822 1.41777 13 3.16667 13H9.83333C11.5822 13 13 11.5822 13 9.83333V8.5C13 7.11929 11.8807 6 10.5 6C10.2239 6 10 6.22386 10 6.5C10 6.77614 10.2239 7 10.5 7C11.3284 7 12 7.67157 12 8.5V9.83333C12 11.03 11.03 12 9.83333 12H3.16667C1.97005 12 1 11.03 1 9.83333V8.5Z" fill="currentColor" />
                                        </svg>
                                    </button>
                                </Dropdown>
                                <button className={`${styles.messageBubble__aiMessageControlButton} text_secondary`} disabled={disabled} onClick={() => onRegenerateMessage(messageId)}>
                                    <svg width="15" height="12" viewBox="0 0 15 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M11.9377 5.44412C11.7395 2.95674 9.65814 1 7.11979 1C5.59366 1 4.23293 1.70674 3.34633 2.81274C3.19383 3.00298 3.05545 3.20495 2.93277 3.41703C2.79449 3.65606 2.48863 3.73774 2.2496 3.59947C2.01057 3.4612 1.92889 3.15533 2.06716 2.9163C2.21525 2.6603 2.3822 2.41665 2.56609 2.18726C3.63432 0.854694 5.27741 0 7.11979 0C10.2197 0 12.7548 2.41793 12.942 5.47065L13.4329 4.97978C13.6282 4.78452 13.9447 4.78452 14.14 4.97978C14.3353 5.17504 14.3353 5.49162 14.14 5.68689L12.8067 7.02022C12.6114 7.21548 12.2948 7.21548 12.0996 7.02022L10.7662 5.68689C10.571 5.49162 10.571 5.17504 10.7662 4.97978C10.9615 4.78452 11.2781 4.78452 11.4733 4.97978L11.9377 5.44412Z" fill="currentColor" />
                                        <path d="M0.146447 5.97978C-0.0488155 6.17504 -0.0488155 6.49162 0.146447 6.68689C0.341709 6.88215 0.658291 6.88215 0.853553 6.68689L1.34442 6.19602C1.53169 9.24874 4.06681 11.6667 7.16667 11.6667C9.00905 11.6667 10.6521 10.812 11.7204 9.4794C11.9043 9.25001 12.0712 9.00637 12.2193 8.75036C12.3576 8.51133 12.2759 8.20547 12.0369 8.0672C11.7978 7.92893 11.492 8.01061 11.3537 8.24964C11.231 8.46172 11.0926 8.66369 10.9401 8.85393C10.0535 9.95993 8.6928 10.6667 7.16667 10.6667C4.62831 10.6667 2.54698 8.70993 2.34878 6.22255L2.81311 6.68689C3.00838 6.88215 3.32496 6.88215 3.52022 6.68689C3.71548 6.49162 3.71548 6.17504 3.52022 5.97978L2.18689 4.64645C1.99162 4.45118 1.67504 4.45118 1.47978 4.64645L0.146447 5.97978Z" fill="currentColor" />
                                    </svg>
                                </button>
                            </div>
                        </aside>
                    </>
                }
            </div>
        </>
    )
}