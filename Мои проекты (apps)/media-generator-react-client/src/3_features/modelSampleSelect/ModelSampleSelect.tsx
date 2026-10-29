import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './ModelSampleSelect.module.css'
import { API, Spinner, apiAssetUrl } from '@shared'
import { useAppDispatch, useAppSelector } from '@app'
import { imageGenerationActions } from '@entities'
import type { ISample, SampleGender } from '@shared/models/models'
import { Button, ConfigProvider } from 'antd'

const FEMALE_PLACEHOLDER = 'female.png'
const MALE_PLACEHOLDER = 'male.png'

const LABELS: Record<SampleGender, string> = {
    female: 'Женщина',
    male: 'Мужчина',
}

const getSampleImageUrl = (path: string | null | undefined): string => {
    if (!path) return ''
    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('/storage/')) {
        return apiAssetUrl(path)
    }
    return apiAssetUrl(`/storage/${path}`)
}

const getGenderPlaceholder = (gender: SampleGender) => {
    return gender === 'female' ? FEMALE_PLACEHOLDER : MALE_PLACEHOLDER
}

interface IModelSampleSelectProps {
    disabled?: boolean;
}

export const ModelSampleSelect: React.FC<IModelSampleSelectProps> = ({ disabled = false }) => {
    const dispatch = useAppDispatch()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [loadedSampleIds, setLoadedSampleIds] = useState<Record<number, boolean>>({})
    const [triggerGetSamples, { data: samples = [], isFetching, isUninitialized }] = API.useLazyGetSamplesQuery()
    const { selectedSampleGender, selectedSample } = useAppSelector((state) => state.imageGeneration)

    useEffect(() => {
        if (!isModalOpen) return
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = 'auto'
        }
    }, [isModalOpen])

    const selectedGenderLabel = LABELS[selectedSampleGender]

    const openModal = () => {
        if (disabled) return
        setIsModalOpen(true)
        if (isUninitialized) {
            triggerGetSamples({ skip: 0, limit: 200 })
        }
    }

    const closeModal = () => setIsModalOpen(false)

    const filteredSamples = useMemo(() => {
        return samples.filter((sample) => sample.gender === selectedSampleGender)
    }, [samples, selectedSampleGender])

    useEffect(() => {
        setLoadedSampleIds((prev) => {
            const next: Record<number, boolean> = {}
            filteredSamples.forEach((sample) => {
                next[sample.id] = prev[sample.id] ?? false
            })
            return next
        })
    }, [filteredSamples])

    const onGenderChange = (gender: SampleGender) => {
        dispatch(imageGenerationActions.setSelectedSampleGender(gender))
        if (selectedSample?.gender !== gender) {
            dispatch(imageGenerationActions.setSelectedSample(null))
        }
    }

    const onSampleSelect = (sample: ISample) => {
        dispatch(imageGenerationActions.setSelectedSample(sample))
        dispatch(imageGenerationActions.setSelectedSampleGender(sample.gender))
        setIsModalOpen(false)
    }

    const previewImage = selectedSample
        ? getSampleImageUrl(selectedSample.path_thumbnail || selectedSample.path)
        : getGenderPlaceholder(selectedSampleGender)

    return (
        <>
            <ConfigProvider theme={{
                token: {
                    borderRadius: 12,
                },
                components: {
                    Button: {
                        colorPrimary: 'var(--color-bg-alt)',
                        colorPrimaryHover: 'var(--color-bg-alt)',
                        colorPrimaryActive: 'var(--color-bg-alt)',
                        paddingInlineLG: 0,
                        primaryShadow: 'transparent',
                    }
                }
            }}
                wave={{ disabled: true }}
            >
                <Button
                    type="primary"
                    size="large"
                    onClick={openModal}
                    disabled={disabled}
                    style={{ flex: '1 1 auto', height: 'auto' }}
                >
                    <div

                        className={styles.modelSampleSelect}
                    >
                        <img
                            className={styles.modelSampleSelect__preview}
                            src={previewImage}
                            alt={selectedGenderLabel}
                        />
                        <div className={styles.modelSampleSelect__labels}>
                            <span className='text_secondary'>Выбрать модель</span>
                            <span className="text_primary">{selectedGenderLabel}</span>
                        </div>
                        <span className={styles.modelSampleSelect__arrow} aria-hidden>
                            <img src="/right-arrow.svg" alt="" />
                        </span>
                    </div>
                </Button>
            </ConfigProvider>
            {createPortal(
                <div
                    className={styles.modelSampleSelectModal__backdrop}
                    style={{ display: isModalOpen ? 'flex' : 'none' }}
                    onClick={(e) => {
                        if ((e.target as HTMLElement).dataset.backdrop) {
                            closeModal()
                        }
                    }}
                    data-backdrop
                >
                    <div className={styles.modelSampleSelectModal}>
                        <div className={styles.modelSampleSelectModal__inner}>
                            <div className={styles.modelSampleSelectModal__leftColumn}>
                                {(['female', 'male'] as SampleGender[]).map((gender) => {
                                    const isActive = selectedSampleGender === gender
                                    return (
                                        <button
                                            key={gender}
                                            type="button"
                                            className={`${styles.modelSampleSelectModal__genderButton} ${isActive ? styles.modelSampleSelectModal__genderButton_active : ''}`}
                                            onClick={() => onGenderChange(gender)}
                                        >
                                            <img src={getGenderPlaceholder(gender)} alt={LABELS[gender]} />
                                            <span className="text_primary">{LABELS[gender]}</span>
                                        </button>
                                    )
                                })}
                            </div>
                            <div className={styles.modelSampleSelectModal__rightColumn}>
                                <div className={styles.modelSampleSelectModal__header}>
                                    <h3 className="text_primary">Выберите модель</h3>
                                    <button type="button" className={styles.modelSampleSelectModal__closeButton} onClick={closeModal}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none">
                                            <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                </div>
                                {isFetching && samples.length === 0 && (
                                    <div className={styles.modelSampleSelectModal__loader}>
                                        <Spinner />
                                    </div>
                                )}
                                {!isFetching && filteredSamples.length === 0 && (
                                    <div className={`${styles.modelSampleSelectModal__empty} text_secondary`}>
                                        Пока нет доступных моделей
                                    </div>
                                )}
                                {filteredSamples.length > 0 && (
                                    <div className={styles.modelSampleSelectModal__cards}>
                                        {filteredSamples.map((sample) => {
                                            const isSelected = sample.id === selectedSample?.id
                                            const isImageLoaded = loadedSampleIds[sample.id] === true
                                            return (
                                                <button
                                                    key={sample.id}
                                                    type="button"
                                                    className={`${styles.modelSampleSelectModal__card} ${isSelected ? styles.modelSampleSelectModal__card_selected : ''} ${isImageLoaded ? styles.modelSampleSelectModal__card_loaded : styles.modelSampleSelectModal__card_loading}`}
                                                    onClick={() => onSampleSelect(sample)}
                                                >
                                                    <img
                                                        className={`${styles.modelSampleSelectModal__cardImage} ${isImageLoaded ? styles.modelSampleSelectModal__cardImage_loaded : ''}`}
                                                        src={getSampleImageUrl(sample.path_thumbnail || sample.path)}
                                                        alt={`Model ${sample.id}`}
                                                        onLoad={() => setLoadedSampleIds((prev) => ({ ...prev, [sample.id]: true }))}
                                                        onError={() => setLoadedSampleIds((prev) => ({ ...prev, [sample.id]: true }))}
                                                    />
                                                    <div className={styles.modelSampleSelectModal__cardPreload} aria-hidden />
                                                    <div
                                                        className={`${styles.modelSampleSelectModal__cardOverlay} ${isSelected ? styles.modelSampleSelectModal__cardOverlay_selected : ''}`}
                                                    >
                                                        <div className={styles.modelSampleSelectModal__cardSelectIcon}>
                                                            <img src="/select.svg" alt="" aria-hidden />
                                                        </div>
                                                        <span className={`text_secondary ${styles.modelSampleSelectModal__cardLabel}`}>
                                                            {isSelected ? 'Выбрано' : 'Выбрать'}
                                                        </span>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body,
            )}
        </>
    )
}
