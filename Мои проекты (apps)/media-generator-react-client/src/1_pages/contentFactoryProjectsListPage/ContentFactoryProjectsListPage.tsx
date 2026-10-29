import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import styles from './ContentFactoryProjectsListPage.module.css'
import { CONTENT_FACTORY_API } from '@shared'
import { RadarAntdButton, RadarAntdInput } from '@shared'
import { ContentFactoryProjectCard } from '@features'
import { message } from 'antd'
import { useNavigate } from 'react-router'

const {
    useGetContentFactoryProjectsQuery,
    useCreateContentFactoryProjectMutation,
    useGetContentFactoryTemplatesQuery,
    useCreateContentFactoryProjectFromTemplateMutation
} = CONTENT_FACTORY_API

interface ICreateProjectModalProps {
    open: boolean
    value: string
    isLoading: boolean
    onClose: () => void
    onChange: (value: string) => void
    onCreate: () => void
}

const CreateProjectModal: React.FC<ICreateProjectModalProps> = ({
    open,
    value,
    isLoading,
    onClose,
    onChange,
    onCreate,
}) => {
    useEffect(function bodyOverflowHandler() {
        if (open) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'auto'
        }
        return () => { document.body.style.overflow = 'auto' }
    }, [open])

    useEffect(function hotKeysHandler() {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault()
                onClose()
            }
        }
        if (open) window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [open, onClose])

    const isCreateDisabled = !value.trim() || isLoading

    return createPortal(
        <div
            className={styles.page__createModalBackdrop}
            style={{ display: open ? 'flex' : 'none' }}
            id="create-project-backdrop"
            onClick={(e) => {
                if ((e.target as HTMLElement).id === 'create-project-backdrop') onClose()
            }}
        >
            <div className={styles.page__createModal}>
                <h2 className="title_secondary">Создание файла</h2>
                <RadarAntdInput
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Название файла"
                    disabled={isLoading}
                    allowClear={true}
                    onPressEnter={(e) => {
                        e.preventDefault()
                        onCreate()
                    }}
                />
                <div className={styles.page__createModalActions}>
                    <RadarAntdButton.Secondary
                        onClick={onClose}
                        disabled={isLoading}
                        style={{ fontWeight: 600 }}
                    >
                        Отменить
                    </RadarAntdButton.Secondary>
                    <RadarAntdButton
                        onClick={onCreate}
                        loading={isLoading}
                        shineAnimation={!isCreateDisabled}
                        disabled={isCreateDisabled}
                        style={{ fontWeight: 600 }}
                    >
                        Создать
                    </RadarAntdButton>
                </div>
            </div>
        </div>,
        document.body
    )
}

export const ContentFactoryProjectsListPage = () => {
    const [newProjectName, setNewProjectName] = useState('Новый проект')
    const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false)
    const [templateToCreateFrom, setTemplateToCreateFrom] = useState<string | null>(null)
    const [searchProjectName, setSearchProjectName] = useState('')
    const navigate = useNavigate()


    const { data: projects, isLoading: isFactoryProjectsLoading, isError: isFactoryProjectsError } = useGetContentFactoryProjectsQuery()
    const { data: templates, isLoading: isFactoryTemplatesLoading, isError: isFactoryTemplatesError } = useGetContentFactoryTemplatesQuery()
    const [createProject, { data: createProjectData, isLoading: isFactoryProjectsCreating, isError: isFactoryProjectsCreationError, isSuccess: isFactoryProjectsCreationSuccess, reset: resetFactoryProjectsCreation }] = useCreateContentFactoryProjectMutation()
    const [createProjectFromTemplate, { data: createProjectFromTemplateData, isLoading: isFactoryProjectsCreatingFromTemplate, isError: isFactoryProjectsCreationFromTemplateError, isSuccess: isFactoryProjectsCreationFromTemplateSuccess }] = useCreateContentFactoryProjectFromTemplateMutation()
    const isLoading = isFactoryProjectsLoading || isFactoryProjectsCreating || isFactoryTemplatesLoading || isFactoryProjectsCreatingFromTemplate


    const filteredProjects = useMemo(() => {
        return projects?.filter((project) => project.name.toLowerCase().includes(searchProjectName.toLowerCase())) ?? []
    }, [projects, searchProjectName])
    const handleCreateProjectModalClose = () => {
        setIsCreateProjectModalOpen(false)
        setTemplateToCreateFrom(null)
        setNewProjectName('')
    }

    const handleCreate = async () => {
        const trimmed = newProjectName.trim()
        if (!trimmed) return
        if (templateToCreateFrom) {
            await createProjectFromTemplate({ templateId: templateToCreateFrom, name: trimmed })
        } else {
            await createProject({ name: trimmed, canvasMetadata: JSON.stringify({ style: 'test', x: '0', y: '0' }) })
        }
        handleCreateProjectModalClose()
    }

    useEffect(function handleApiStatuses() {
        if (isFactoryProjectsCreationError || isFactoryProjectsCreationFromTemplateError) {
            message.error('Не удалось создать проект')
            resetFactoryProjectsCreation()
        }
        if (isFactoryProjectsError) {
            message.error('Не удалось загрузить проекты')
        }
        if (isFactoryTemplatesError) {
            message.error('Не удалось загрузить шаблоны')
        }

        if (isFactoryProjectsCreationSuccess) {
            const newProjectId = createProjectData?.id
            localStorage.setItem('CANVAS_ZOOM_STATE', '0.7')
            navigate(`/canvas/${newProjectId}`, { viewTransition: true })
        }
        if (isFactoryProjectsCreationFromTemplateSuccess) {
            const newProjectId = createProjectFromTemplateData?.id
            localStorage.setItem('CANVAS_ZOOM_STATE', '0.7')
            navigate(`/canvas/${newProjectId}`, { viewTransition: true })
        }
    }, [isFactoryProjectsCreationError, isFactoryProjectsError, isFactoryProjectsCreationFromTemplateError, isFactoryTemplatesError, isFactoryProjectsCreationSuccess, isFactoryProjectsCreationFromTemplateSuccess, createProjectData, createProjectFromTemplateData, navigate, resetFactoryProjectsCreation])

    return (
        <div className={styles.page}>
            <div className={styles.page__header}>
                <div className={styles.page__titleWrapper}>
                    <h1 className='title_primary'>Канвас</h1>
                    <p className="text_secondary">Создавайте, анализируйте, улучшайте — быстрее конкурентов</p>
                </div>
                <RadarAntdButton onClick={() => {
                    setIsCreateProjectModalOpen(true)
                    if (!newProjectName.trim()) {
                        setNewProjectName('Новый проект')
                    }
                }}>
                    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M8.33333 16.6667C12.9357 16.6667 16.6667 12.9357 16.6667 8.33333C16.6667 3.73096 12.9357 0 8.33333 0C3.73096 0 0 3.73096 0 8.33333C0 12.9357 3.73096 16.6667 8.33333 16.6667ZM8.95833 5C8.95833 4.65482 8.67851 4.375 8.33333 4.375C7.98816 4.375 7.70833 4.65482 7.70833 5V7.70833H5C4.65482 7.70833 4.375 7.98816 4.375 8.33333C4.375 8.67851 4.65482 8.95833 5 8.95833H7.70833V11.6667C7.70833 12.0118 7.98816 12.2917 8.33333 12.2917C8.67851 12.2917 8.95833 12.0118 8.95833 11.6667V8.95833H11.6667C12.0118 8.95833 12.2917 8.67851 12.2917 8.33333C12.2917 7.98816 12.0118 7.70833 11.6667 7.70833H8.95833V5Z" fill="currentColor" />
                    </svg>
                    <span className="text_primary" style={{ fontWeight: 700 }}>
                        Создать файл
                    </span>
                </RadarAntdButton>
            </div>
            {templates && templates.length > 0 &&
                <>
                    <div className={styles.page__blockTitleWrapper} style={{ marginTop: 56 }}>
                        <h2 className="title_secondary">
                            Шаблоны
                        </h2>
                    </div>
                    <ul className={styles.page__projectsList}>
                        {templates?.map((template) => (
                            <li
                                key={template.id}
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                    setTemplateToCreateFrom(template.id)
                                    if (!newProjectName.trim()) {
                                        setNewProjectName(`Новый проект`)
                                    }
                                    setIsCreateProjectModalOpen(true)
                                }}
                            >
                                <ContentFactoryProjectCard isTemplate={true} templateData={template} />
                            </li>
                        ))}
                    </ul>
                </>
            }

            {projects && projects.length > 0 &&
                <>
                    <div className={styles.page__blockTitleWrapper} style={{ marginTop: 56 }}>
                        <h2 className="title_secondary">
                            Ваши файлы
                        </h2>
                        <RadarAntdInput
                            value={searchProjectName}
                            onChange={(e) => setSearchProjectName(e.target.value)}
                            placeholder="Поиск по вашим файлам"
                            disabled={isLoading}
                            allowClear={true}
                            style={{ width: 316 }}
                            prefix={
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M10.7044 11.9719C9.58381 12.8261 8.18447 13.3333 6.66667 13.3333C2.98477 13.3333 0 10.3486 0 6.66667C0 2.98477 2.98477 0 6.66667 0C10.3486 0 13.3333 2.98477 13.3333 6.66667C13.3333 8.39273 12.6774 9.96559 11.6011 11.1495C11.6233 11.1646 11.6447 11.1813 11.6652 11.1995L15.4152 14.5329C15.6732 14.7622 15.6965 15.1572 15.4671 15.4152C15.2378 15.6732 14.8428 15.6965 14.5848 15.4671L10.8348 12.1338C10.7811 12.0861 10.7376 12.0312 10.7044 11.9719ZM12.0833 6.66667C12.0833 9.65821 9.65821 12.0833 6.66667 12.0833C3.67512 12.0833 1.25 9.65821 1.25 6.66667C1.25 3.67512 3.67512 1.25 6.66667 1.25C9.65821 1.25 12.0833 3.67512 12.0833 6.66667Z" fill="var(--color-text-muted)" />
                                </svg>

                            }
                            onPressEnter={(e) => {
                                e.preventDefault()
                                handleCreate()
                            }}
                        />
                    </div>

                    {filteredProjects.length > 0 && <ul className={styles.page__projectsList}>
                        {projects?.filter((project) => project.name.toLowerCase().includes(searchProjectName.toLowerCase()))?.map((project) => (
                            <li key={project.id}>
                                <ContentFactoryProjectCard project={project} />
                            </li>
                        ))}
                    </ul>}
                    {filteredProjects.length === 0 && <div className={styles.page__noProjects}>
                        <p className="text_secondary">Файлы не найдены</p>
                    </div>}
                </>
            }
            {(!projects || projects.length === 0) &&
                <div className={styles.page__noProjects}>
                    <p className="text_secondary">У вас пока нет файлов</p>
                </div>
            }
            <CreateProjectModal
                open={isCreateProjectModalOpen}
                value={newProjectName}
                isLoading={isLoading}
                onClose={handleCreateProjectModalClose}
                onChange={setNewProjectName}
                onCreate={handleCreate}
            />
        </div>
    )
}