import { NavLink } from 'react-router'
import styles from './ContentFactoryProjectCard.module.css'
import type { IContentFactoryProject, IContentFactoryTemplate } from '@shared/models/models'
import { App as AntdApp, Popover } from 'antd'
import { useEffect, useState } from 'react'
import { RadarAntdInput, CONTENT_FACTORY_API } from '@shared'

interface IContentFactoryProjectCardProps {
    project?: IContentFactoryProject,
    isTemplate?: boolean
    templateData?: IContentFactoryTemplate
}

export const ContentFactoryProjectCard: React.FC<IContentFactoryProjectCardProps> = ({ project, isTemplate, templateData }) => {
    const { message } = AntdApp.useApp();
    const [isRenameProjectState, setIsRenameProjectState] = useState<{ isInProggress: boolean, value: string } | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [updateContentFactoryProjectName, { isLoading: isUpdateContentFactoryProjectNameLoading, isError: isUpdateContentFactoryProjectNameError, isSuccess: isUpdateContentFactoryProjectNameSuccess }] = CONTENT_FACTORY_API.useUpdateContentFactoryProjectNameMutation();
    const [deleteContentFactoryProject, { isLoading: isDeleteContentFactoryProjectLoading, isError: isDeleteContentFactoryProjectError, isSuccess: isDeleteContentFactoryProjectSuccess }] = CONTENT_FACTORY_API.useDeleteContentFactoryProjectMutation();
    const [duplicateContentFactoryProject, { isLoading: isDuplicateContentFactoryProjectLoading, isError: isDuplicateContentFactoryProjectError, isSuccess: isDuplicateContentFactoryProjectSuccess }] = CONTENT_FACTORY_API.useDuplicateContentFactoryProjectMutation();
    // --- handlers
    const handleRenameProjectStart = () => {
        setIsRenameProjectState({ isInProggress: true, value: project?.name ?? '' });
    }
    const handleRenameProjectEnd = () => {
        updateContentFactoryProjectName({ projectId: project?.id ?? '', name: isRenameProjectState?.value ?? '' });
    }
    const handleDeleteProject = () => {
        deleteContentFactoryProject({ projectId: project?.id ?? '' });
    }
    const handleDuplicateProject = () => {
        duplicateContentFactoryProject({ projectId: project?.id ?? '' });
    }
    const handleMenuClose = () => {
        setIsMenuOpen(false);
    }
    // --- effects
    useEffect(function renameStatusHandler() {
        if (isUpdateContentFactoryProjectNameError) {
            message.error('Не удалось переименовать файл');
            setIsRenameProjectState(null);
        }
        if (isUpdateContentFactoryProjectNameSuccess) {
            message.success('Файл переименован');
            setIsRenameProjectState(null);
        }
    }, [isUpdateContentFactoryProjectNameError, isUpdateContentFactoryProjectNameSuccess]);
    useEffect(function deleteStatusHandler() {
        if (isDeleteContentFactoryProjectError) {
            message.error('Не удалось удалить файл');
        }
        if (isDeleteContentFactoryProjectSuccess) {
            message.success('Файл удален');
        }
    }, [isDeleteContentFactoryProjectError, isDeleteContentFactoryProjectSuccess]);
    useEffect(function duplicateStatusHandler() {
        if (isDuplicateContentFactoryProjectError) {
            message.error('Не удалось дублировать файл');
        }
        if (isDuplicateContentFactoryProjectSuccess) {
            message.success('Файл дублирован');
        }
    }, [isDuplicateContentFactoryProjectError, isDuplicateContentFactoryProjectSuccess]);
    useEffect(function chatRenamingSideEffects() {
        if (!isRenameProjectState || !isRenameProjectState?.isInProggress) return;
        const keyDownHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                setIsRenameProjectState(null);
            }
        };
        const globalClickHandler = (e: MouseEvent) => {
            if (e.target instanceof HTMLElement && e.target.id === 'projectRenameInput') return;
            setIsRenameProjectState(null);
        }
        window.addEventListener('keydown', keyDownHandler);
        window.addEventListener('click', globalClickHandler);
        return () => {
            window.removeEventListener('keydown', keyDownHandler);
            window.removeEventListener('click', globalClickHandler);
        }
    }, [isRenameProjectState]);

    if (isTemplate) {
        return (
            <div className={styles.contentFactoryProjectCard}>
                <div className={styles.contentFactoryProjectCard__coverWrapper}>
                    {(templateData?.previewThumbnailUrl || templateData?.previewUrl) && <img src={templateData?.previewThumbnailUrl || templateData?.previewUrl} alt="Template Preview" />}
                </div>
                <div className={styles.contentFactoryProjectCard__info} title={templateData?.name}>
                    <p className={`text_primary ${styles.contentFactoryProjectCard__infoTitle}`}>{templateData?.name}</p>
                </div>
            </div>
        )
    }
    return (
        <div className={styles.contentFactoryProjectCard}>
            <Popover
                trigger="click"
                open={isMenuOpen}
                onOpenChange={setIsMenuOpen}
                placement="bottomLeft"
                arrow={false}
                styles={{
                    container: {
                        padding: 4,
                    }
                }}
                content={
                    <div className={styles.content__menuButtonItems}>
                        <button className={`text_secondary ${styles.content__menuButtonItem}`} onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleMenuClose(); handleDuplicateProject() }} disabled={isDuplicateContentFactoryProjectLoading || isDeleteContentFactoryProjectLoading || isUpdateContentFactoryProjectNameLoading}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M0 2.5C0 1.11929 1.11929 0 2.5 0H4.34203C5.07185 0 5.76522 0.318907 6.24018 0.873022L7.0633 1.83333H5.74622L5.48092 1.52381C5.19595 1.19134 4.77992 1 4.34203 1H2.5C1.67157 1 1 1.67157 1 2.5V6.5C1 7.32843 1.67157 8 2.5 8H3.16667V9H2.5C1.11929 9 0 7.88071 0 6.5V2.5Z" fill="currentColor" />
                                <path fillRule="evenodd" clipRule="evenodd" d="M6.5 2.66667C5.11929 2.66667 4 3.78595 4 5.16667V9.16667C4 10.5474 5.11929 11.6667 6.5 11.6667H9.16667C10.5474 11.6667 11.6667 10.5474 11.6667 9.16667V6.12874C11.6667 5.53196 11.4532 4.95487 11.0648 4.50176L10.2402 3.53969C9.76522 2.98557 9.07185 2.66667 8.34204 2.66667H6.5ZM5 5.16667C5 4.33824 5.67157 3.66667 6.5 3.66667H8.34204C8.77992 3.66667 9.19595 3.85801 9.48092 4.19048L10.3056 5.15255C10.5386 5.42441 10.6667 5.77067 10.6667 6.12874V9.16667C10.6667 9.99509 9.99509 10.6667 9.16667 10.6667H6.5C5.67157 10.6667 5 9.99509 5 9.16667V5.16667Z" fill="currentColor" />
                            </svg>
                            Дублировать
                        </button>
                        <button className={`text_secondary ${styles.content__menuButtonItem}`} onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleMenuClose(); handleRenameProjectStart() }} disabled={isDuplicateContentFactoryProjectLoading || isDeleteContentFactoryProjectLoading || isUpdateContentFactoryProjectNameLoading}>
                            <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M4.29481 0.582464C4.04964 -0.194151 2.95063 -0.194158 2.70546 0.582463L1.14941 5.51154L0.0255297 8.90209C-0.0613552 9.16421 0.0806988 9.44713 0.342816 9.53401C0.604934 9.6209 0.887856 9.47885 0.974741 9.21673L1.98615 6.16547H5.01412L6.02553 9.21673C6.11241 9.47885 6.39534 9.6209 6.65745 9.53401C6.91957 9.44713 7.06163 9.16421 6.97474 8.90209L5.85088 5.51157L4.29481 0.582464ZM3.50014 1.38696L4.69297 5.16547H2.3073L3.50014 1.38696Z" fill="currentColor" />
                                <path fillRule="evenodd" clipRule="evenodd" d="M8.29774 5.64172C8.52666 5.06944 9.05644 4.85433 9.60366 4.89796C9.87774 4.91981 10.117 5.00714 10.2739 5.11634C10.4347 5.22822 10.4533 5.31711 10.4533 5.34842V5.68763C9.89252 5.66208 9.21318 5.69344 8.62912 5.86137C8.22964 5.97624 7.81273 6.17243 7.52971 6.51918C7.22518 6.89228 7.13092 7.37084 7.26564 7.91047C7.3901 8.409 7.62722 8.8053 7.99334 9.04752C8.35983 9.28997 8.7806 9.32845 9.17244 9.26142C9.60341 9.1877 10.044 8.9807 10.4533 8.7019V8.78936C10.4533 9.0655 10.6772 9.28936 10.9533 9.28936C11.2294 9.28936 11.4533 9.0655 11.4533 8.78936V5.34842C11.4533 4.87615 11.1653 4.51837 10.8452 4.29559C10.5213 4.07014 10.1057 3.93481 9.68314 3.90112C8.83713 3.83368 7.80702 4.17595 7.36927 5.27033C7.26671 5.52673 7.39142 5.81771 7.64781 5.92027C7.9042 6.02282 8.19519 5.89812 8.29774 5.64172ZM8.90547 6.82243C9.37193 6.68831 9.95963 6.66292 10.4533 6.6888V7.41612C9.96338 7.88624 9.42271 8.20408 9.00383 8.27574C8.78702 8.31282 8.64313 8.27836 8.54509 8.21351C8.4467 8.14842 8.31945 8.00305 8.23586 7.66825C8.16647 7.39028 8.22659 7.24686 8.30441 7.15151C8.40374 7.02981 8.59716 6.91108 8.90547 6.82243Z" fill="currentColor" />
                            </svg>
                            Переименовать
                        </button>
                        <button className={`text_secondary ${styles.content__menuButtonItem}`} onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleMenuClose(); handleDeleteProject() }} disabled={isDuplicateContentFactoryProjectLoading || isDeleteContentFactoryProjectLoading || isUpdateContentFactoryProjectNameLoading}>
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
                <button className={styles.contentFactoryProjectCard__menu}>
                    <svg width="12" height="2" viewBox="0 0 12 2" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 0C0.447715 0 0 0.447715 0 1C0 1.55228 0.447715 2 1 2H1.01178C1.56407 2 2.01178 1.55228 2.01178 1C2.01178 0.447715 1.56407 0 1.01178 0H1Z" fill="currentColor" />
                        <path d="M4.63952 1C4.63952 0.447715 5.08723 0 5.63952 0H5.6513C6.20358 0 6.6513 0.447715 6.6513 1C6.6513 1.55228 6.20358 2 5.6513 2H5.63952C5.08723 2 4.63952 1.55228 4.63952 1Z" fill="currentColor" />
                        <path d="M9.27903 1C9.27903 0.447715 9.72675 0 10.279 0H10.2908C10.8431 0 11.2908 0.447715 11.2908 1C11.2908 1.55228 10.8431 2 10.2908 2H10.279C9.72675 2 9.27903 1.55228 9.27903 1Z" fill="currentColor" />
                    </svg>
                </button>
            </Popover>
            {project?.isPublic &&
                <button 
                title='Проект опубликован' 
                className={`text_tertiary ${styles.contentFactoryProjectCard__publicBadge}`}
                onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/canvas/${project?.publicId}`)
                    message.success('Ссылка скопирована')
                }}
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-Rule="evenodd" clipRule="evenodd" d="M10 4C11.1046 4 12 3.10457 12 2C12 0.895431 11.1046 0 10 0C8.89543 0 8 0.895431 8 2C8 2.09004 8.00595 2.17869 8.01748 2.26558L3.44306 4.55279C3.42935 4.55964 3.41609 4.56704 3.40329 4.57495C3.04226 4.21939 2.54675 4 2 4C0.895431 4 0 4.89543 0 6C0 7.10457 0.895431 8 2 8C2.54675 8 3.04226 7.7806 3.4033 7.42505C3.41609 7.43296 3.42935 7.44036 3.44306 7.44721L8.01748 9.73442C8.00595 9.82131 8 9.90996 8 10C8 11.1046 8.89543 12 10 12C11.1046 12 12 11.1046 12 10C12 8.89543 11.1046 8 10 8C9.3432 8 8.76035 8.3166 8.39573 8.80551L3.91852 6.56691C3.97154 6.38718 4 6.19691 4 6C4 5.80309 3.97154 5.61282 3.91852 5.43309L8.39573 3.19449C8.76035 3.6834 9.3432 4 10 4ZM10 3C10.5523 3 11 2.55228 11 2C11 1.44772 10.5523 1 10 1C9.44772 1 9 1.44772 9 2C9 2.55228 9.44772 3 10 3ZM2 7C2.55228 7 3 6.55229 3 6C3 5.44772 2.55228 5 2 5C1.44772 5 1 5.44772 1 6C1 6.55229 1.44772 7 2 7ZM10 11C10.5523 11 11 10.5523 11 10C11 9.44772 10.5523 9 10 9C9.44772 9 9 9.44772 9 10C9 10.5523 9.44772 11 10 11Z" fill="currentColor" />
                    </svg>
                   Поделиться
                </button>}
            <NavLink to={`/canvas/${project?.id}`}>
                <div className={styles.contentFactoryProjectCard__coverWrapper}>
                    <img src="/contentFactoryProjectCardCover.jpg" alt="Project Cover" />
                </div>
            </NavLink>
            {!isRenameProjectState?.isInProggress && <NavLink to={`/canvas/${project?.id}`}>
                <div className={styles.contentFactoryProjectCard__info} title={project?.name}>
                    <p className={`text_primary ${styles.contentFactoryProjectCard__infoTitle}`}>{project?.name}</p>
                </div>
            </NavLink>}
            {isRenameProjectState?.isInProggress &&
                <RadarAntdInput
                    autoFocus
                    value={isRenameProjectState?.value}
                    onChange={(e) => setIsRenameProjectState({ ...isRenameProjectState, value: e.target.value })}
                    onPressEnter={() => handleRenameProjectEnd()}
                    disabled={isUpdateContentFactoryProjectNameLoading}
                    id='projectRenameInput'
                    style={{ height: 32 }}
                />
            }
        </div>
    )
}