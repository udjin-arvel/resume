import styles from './VideoGenerationSidebarContent.module.css'
import { NavLink } from 'react-router'
import { API, RadarSwitch } from '@shared'
import { videoGenerationActions } from '@entities'
import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@app'
import { RadarModelSelect } from '@/3_features/modelSelect/RadarModelSelect'


export const VideoGenerationSidebarContent = () => {
    const { isGenerationInProgress } = useAppSelector(state => state.videoGeneration);
    const { data: models, isLoading } = API.useGetModelsListQuery();
    const { videos: create_video_preview } = models ?? {};
    const dispatch = useAppDispatch();
    const { quality, length, dimensions, hasSound, modelType, needToEnchance } = useAppSelector(state => state.videoGeneration);
    const durationOptions = modelType?.duration_options_by_resolution?.[quality ?? ''] ?? modelType?.duration_options;
    useEffect(() => {
        if (create_video_preview) {
            dispatch(videoGenerationActions.setVideoGenerationSettings({ key: 'modelType', value: create_video_preview?.[0] ?? null }));
        }
    }, [create_video_preview]);
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="19" height="18" fill="none">
                        <path fill="currentColor" fillRule="evenodd" d="M9.042 13.6512c-1.318.8568-3.0837-.0645-3.0837-1.6089v-4.376c0-1.5445 1.7656-2.4657 3.0837-1.609l3.3664 2.188a1.907 1.907 0 0 1 0 3.2179zm-1.7087-5.985v4.3761c0 .2067.1074.3809.3086.4859.2032.106.4415.1062.6508-.0298l3.3664-2.188c.3434-.2233.3434-.689 0-.9122l-3.3664-2.188c-.2093-.136-.4476-.1358-.6508-.0298-.2012.105-.3086.2791-.3086.4859" clipRule="evenodd" />
                        <path fill="currentColor" fillRule="evenodd" d="M5.8644.1046a.6875.6875 0 1 0-.7288 1.166l2.0006 1.2503H3.6667C1.6417 2.521 0 4.1626 0 6.1876v7.3333c0 2.0251 1.6416 3.6667 3.6667 3.6667h11c2.025 0 3.6666-1.6416 3.6666-3.6667V6.1876c0-2.025-1.6416-3.6667-3.6666-3.6667h-3.4695l2.0005-1.2503a.6874.6874 0 0 0 .2186-.9474.6874.6874 0 0 0-.9473-.2186l-3.3023 2.064zm11.0939 6.083c0-1.2657-1.026-2.2917-2.2916-2.2917h-11c-1.2657 0-2.2917 1.026-2.2917 2.2917v7.3333c0 1.2657 1.026 2.2917 2.2917 2.2917h11c1.2656 0 2.2916-1.026 2.2916-2.2917z" clipRule="evenodd" />
                    </svg>
                    Создание видеообложки
                </span>
                {/* model select */}
                <RadarModelSelect
                    taskType="video_preview"
                    value={modelType?.id}
                    options={create_video_preview?.map(model => ({ label: model.name, value: model.id, price: model.tokens_per_request, icon: model.icon_path }))}
                    onChange={(value) => dispatch(videoGenerationActions.setVideoGenerationSettings({ key: 'modelType', value: create_video_preview?.find(model => model.id === value) ?? null }))}
                    loading={isLoading}
                    disabled={isGenerationInProgress}
                />
                {/* video quality */}
                {modelType?.resolution_options &&
                    <div className={styles.content__settingsBlock}>
                        <span className={`text_primary`} style={{ fontWeight: 600 }}>Качество</span>
                        <div className={styles.content__buttonsGrid}>
                            {modelType.resolution_options.map(_ => (
                                <button
                                    className={`${styles.content__settingsButton} ${quality === _ ? styles.content__settingsButton_selected : ''}`}
                                    key={_}
                                    onClick={() => dispatch(videoGenerationActions.setVideoGenerationSettings({ key: 'quality', value: _ }))}
                                    disabled={isGenerationInProgress}
                                >
                                    <span className={`text_primary`}>{_}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                }
                {/* video duration */}
                {durationOptions &&
                    <div className={styles.content__settingsBlock}>
                        <span className={`text_primary`} style={{ fontWeight: 600 }}>Длительность</span>
                        <div className={styles.content__buttonsGrid}>
                            {durationOptions.map(_ => {
                                let durationPrice = 0;
                                if (modelType?.basic_video_duration && _ > modelType.basic_video_duration && modelType?.tokens_per_second) {
                                    durationPrice = modelType?.tokens_per_second * (_ - modelType.basic_video_duration);
                                }
                                return (
                                    <button
                                        className={`${styles.content__settingsButton} ${length === _ ? styles.content__settingsButton_selected : ''}`}
                                        key={_}
                                        onClick={() => dispatch(videoGenerationActions.setVideoGenerationSettings({ key: 'length', value: _ }))}
                                        disabled={isGenerationInProgress}
                                    >
                                        <span className={`text_primary`}>{_.toString()} сек</span>
                                        <span className={`${styles.content__priceBadge} text_tertiary`}>
                                            +
                                            {durationPrice}
                                            <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" fill="none">
                                                <path fill="currentColor" fillRule="evenodd" d="M3.367 4.2556c-.126-.3408-.608-.3408-.734 0l-.1746.4716a.391.391 0 0 1-.2312.2312l-.4716.1746c-.3408.126-.3408.608 0 .734l.4716.1746a.391.391 0 0 1 .2312.2312l.1746.4716c.126.3408.608.3408.734 0l.1746-.4716a.391.391 0 0 1 .2312-.2312l.4716-.1746c.3408-.126.3408-.608 0-.734l-.4716-.1746a.391.391 0 0 1-.2312-.2312zM3 5.282a1.14 1.14 0 0 1-.2178.2179c.082.0624.1554.1357.2178.2179A1.14 1.14 0 0 1 3.2179 5.5 1.14 1.14 0 0 1 3 5.2821" clipRule="evenodd" />
                                                <path fill="currentColor" fillRule="evenodd" d="M5.9585 6h.0206C7.6475 6 9 4.6569 9 3S7.6475 0 5.9791 0c-1.4968 0-2.7394 1.0811-2.979 2.5C1.343 2.5 0 3.8432 0 5.5s1.3432 3 3 3c1.4865 0 2.7205-1.0812 2.9585-2.5m.0312-.75c1.2464-.0057 2.255-1.011 2.255-2.25 0-1.2426-1.0143-2.25-2.2656-2.25-1.1119 0-2.0367.7954-2.229 1.8446 1.216.313 2.1335 1.3692 2.2396 2.6554M3 7.75c1.2426 0 2.25-1.0074 2.25-2.25S4.2426 3.25 3 3.25.75 4.2574.75 5.5 1.7574 7.75 3 7.75" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                }
                {/* dimensions */}
                {modelType?.aspect_ratio_options &&
                    <div className={styles.content__dimensions}>
                        <span className={`text_primary`} style={{ fontWeight: 600 }}>Соотношение сторон</span>
                        <div className={styles.content__dimensionsOptions}>
                            {modelType.aspect_ratio_options.map(_ => {
                                const isSelected = dimensions === _;
                                const [width, height] = _.split(':').map(Number);
                                const basicLength = 20
                                let actualWidth = 0;
                                let actualHeight = 0;
                                if (width >= height) {
                                    actualWidth = basicLength * (width / height);
                                    actualHeight = (actualWidth * height) / width;
                                } else {
                                    actualHeight = basicLength * (height / width);
                                    actualWidth = (actualHeight * width) / height;
                                }
                                return (
                                    <button
                                        className={`${styles.content__dimensionsOption} ${isSelected ? styles.content__dimensionsOption_selected : ''}`}
                                        key={_}
                                        onClick={() => dispatch(videoGenerationActions.setVideoGenerationSettings({ key: 'dimensions', value: _ }))}
                                        disabled={isGenerationInProgress}
                                    >
                                        <div className={styles.content__dimensionsIcon} style={{ width: actualWidth, height: actualHeight }}></div>
                                        <span className={`text_secondary`}>{_}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                }
                {/* audio toggle */}
                <div className={styles.content__settingsItem}>
                    <span className={`text_primary`} style={{ fontWeight: 600 }}>Звук в видео</span>
                    <div className={styles.content__settingsItemContent}>
                        <span className={`${styles.content__priceBadge} text_tertiary`} style={{ color: hasSound ? 'currentColor' : '#8C8C8C' }}>
                            +
                            {modelType?.tokens_per_sound ? modelType?.tokens_per_sound : 0}
                            <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" fill="none" style={{ color: hasSound ? '#5329ff' : '#8C8C8C' }}>
                                <path fill="currentColor" fillRule="evenodd" d="M3.367 4.2556c-.126-.3408-.608-.3408-.734 0l-.1746.4716a.391.391 0 0 1-.2312.2312l-.4716.1746c-.3408.126-.3408.608 0 .734l.4716.1746a.391.391 0 0 1 .2312.2312l.1746.4716c.126.3408.608.3408.734 0l.1746-.4716a.391.391 0 0 1 .2312-.2312l.4716-.1746c.3408-.126.3408-.608 0-.734l-.4716-.1746a.391.391 0 0 1-.2312-.2312zM3 5.282a1.14 1.14 0 0 1-.2178.2179c.082.0624.1554.1357.2178.2179A1.14 1.14 0 0 1 3.2179 5.5 1.14 1.14 0 0 1 3 5.2821" clipRule="evenodd" />
                                <path fill="currentColor" fillRule="evenodd" d="M5.9585 6h.0206C7.6475 6 9 4.6569 9 3S7.6475 0 5.9791 0c-1.4968 0-2.7394 1.0811-2.979 2.5C1.343 2.5 0 3.8432 0 5.5s1.3432 3 3 3c1.4865 0 2.7205-1.0812 2.9585-2.5m.0312-.75c1.2464-.0057 2.255-1.011 2.255-2.25 0-1.2426-1.0143-2.25-2.2656-2.25-1.1119 0-2.0367.7954-2.229 1.8446 1.216.313 2.1335 1.3692 2.2396 2.6554M3 7.75c1.2426 0 2.25-1.0074 2.25-2.25S4.2426 3.25 3 3.25.75 4.2574.75 5.5 1.7574 7.75 3 7.75" clipRule="evenodd" />
                            </svg>
                        </span>
                        <RadarSwitch
                            checked={hasSound}
                            onChange={() => dispatch(videoGenerationActions.setVideoGenerationSettings({ key: 'hasSound', value: !hasSound }))}
                            disabled={!modelType?.audio_toggle_param || isGenerationInProgress}
                        />
                    </div>
                </div>
                {/* switch */}
                <div className={styles.content__settingsItem}>
                    <span className={`text_primary`} style={{ fontWeight: 600 }}>Улучшать промпт</span>
                    <div className={styles.content__settingsItemContent}>
                        <span className={`${styles.content__priceBadge} text_tertiary`} style={{ color: needToEnchance ? 'currentColor' : '#8C8C8C' }}>
                            +
                            {modelType?.tokens_per_improvement ? modelType?.tokens_per_improvement : 0}
                            <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" fill="none" style={{ color: needToEnchance ? '#5329ff' : '#8C8C8C' }}>
                                <path fill="currentColor" fillRule="evenodd" d="M3.367 4.2556c-.126-.3408-.608-.3408-.734 0l-.1746.4716a.391.391 0 0 1-.2312.2312l-.4716.1746c-.3408.126-.3408.608 0 .734l.4716.1746a.391.391 0 0 1 .2312.2312l.1746.4716c.126.3408.608.3408.734 0l.1746-.4716a.391.391 0 0 1 .2312-.2312l.4716-.1746c.3408-.126.3408-.608 0-.734l-.4716-.1746a.391.391 0 0 1-.2312-.2312zM3 5.282a1.14 1.14 0 0 1-.2178.2179c.082.0624.1554.1357.2178.2179A1.14 1.14 0 0 1 3.2179 5.5 1.14 1.14 0 0 1 3 5.2821" clipRule="evenodd" />
                                <path fill="currentColor" fillRule="evenodd" d="M5.9585 6h.0206C7.6475 6 9 4.6569 9 3S7.6475 0 5.9791 0c-1.4968 0-2.7394 1.0811-2.979 2.5C1.343 2.5 0 3.8432 0 5.5s1.3432 3 3 3c1.4865 0 2.7205-1.0812 2.9585-2.5m.0312-.75c1.2464-.0057 2.255-1.011 2.255-2.25 0-1.2426-1.0143-2.25-2.2656-2.25-1.1119 0-2.0367.7954-2.229 1.8446 1.216.313 2.1335 1.3692 2.2396 2.6554M3 7.75c1.2426 0 2.25-1.0074 2.25-2.25S4.2426 3.25 3 3.25.75 4.2574.75 5.5 1.7574 7.75 3 7.75" clipRule="evenodd" />
                            </svg>
                        </span>
                        <RadarSwitch
                            checked={needToEnchance}
                            onChange={(value) => dispatch(videoGenerationActions.setVideoGenerationSettings({ key: 'needToEnchance', value: value }))}
                            disabled={isGenerationInProgress}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}