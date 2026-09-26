import { useEffect } from 'react'
import styles from './ImageGenerationSidebarContent.module.css'
import { NavLink } from 'react-router'
import { ModelSampleSelect, RadarModelSelect } from '@features'
import { RadarSwitch, API } from '@shared'
import { useAppSelector, useAppDispatch } from '@app'
import { imageGenerationActions } from '@entities'

export const ImageGenerationSidebarContent = () => {
    const { data: models, isLoading } = API.useGetModelsListQuery();
    const { isGenerationInProgress } = useAppSelector(state => state.imageGeneration);
    const { images: edit_image } = models ?? {};
    const dispatch = useAppDispatch();
    const { modelType, needToEnchance, dimensions } = useAppSelector(state => state.imageGeneration);
    useEffect(() => {
        if (edit_image) {
            dispatch(imageGenerationActions.setImageGenerationSettings({ key: 'modelType', value: edit_image?.[0] ?? null }));
        }
    }, [edit_image]);
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" fill="none">
                        <path fill="currentColor" d="M12.4774.3904c-.1926-.5205-.9289-.5205-1.1215 0l-.2666.7206a.598.598 0 0 1-.3533.3533l-.7206.2666c-.5205.1926-.5205.9289 0 1.1215l.7206.2667a.598.598 0 0 1 .3533.3532l.2666.7206c.1926.5206.9289.5206 1.1215 0l.2667-.7206a.598.598 0 0 1 .3532-.3532l.7206-.2667c.5206-.1926.5206-.9289 0-1.1215l-.7206-.2666a.598.598 0 0 1-.3532-.3533z" />
                        <path fill="currentColor" fillRule="evenodd" d="M7.5625 1.8333a.6875.6875 0 0 1 0 1.375H3.6667C2.401 3.2083 1.375 4.2343 1.375 5.5v7.3333c0 .3537.0801.6887.2232.9878l2.0083-2.7614c.9239-1.2704 2.8448-1.1854 3.653.1616.3497.5827 1.2165.5091 1.4628-.1243L9.734 8.4957c.6456-1.66 2.925-1.8358 3.8175-.2943l3.2146 5.5525a2.28 2.28 0 0 0 .1923-.9206V8.9375a.6875.6875 0 1 1 1.375 0v3.8958c0 2.0251-1.6416 3.6667-3.6666 3.6667h-11C1.6417 16.5 0 14.8584 0 12.8333V5.5c0-2.025 1.6416-3.6667 3.6667-3.6667zm8.2357 12.9933-3.4368-5.9363c-.3147-.5435-1.1184-.4816-1.346.1038l-1.0116 2.6012c-.6607 1.6989-2.9855 1.8965-3.9233.3334-.3014-.5022-1.0176-.5339-1.362-.0602l-2.1607 2.9709c.3286.182.7066.2856 1.1089.2856h11c.4115 0 .7977-.1085 1.1315-.2984" clipRule="evenodd" />
                        <path fill="currentColor" d="M6.4167 5.9583c0 .7594-.6156 1.375-1.375 1.375s-1.375-.6156-1.375-1.375.6156-1.375 1.375-1.375 1.375.6156 1.375 1.375" />
                        <path fill="currentColor" fillRule="evenodd" d="M14.9104 3.2185c.2312-.6247 1.1147-.6247 1.3458 0l.32.8647a.718.718 0 0 0 .4239.424l.8647.3199c.6247.2311.6247 1.1147 0 1.3458l-.8647.32a.718.718 0 0 0-.4239.4239l-.32.8647c-.2311.6247-1.1146.6247-1.3458 0l-.3199-.8647a.718.718 0 0 0-.424-.424l-.8647-.3199c-.6246-.2311-.6246-1.1147 0-1.3458l.8647-.32a.718.718 0 0 0 .424-.4239zM15.1839 5.5a2.1 2.1 0 0 0 .3994-.3994 2.1 2.1 0 0 0 .3994.3994 2.1 2.1 0 0 0-.3994.3994 2.1 2.1 0 0 0-.3994-.3994" clipRule="evenodd" />
                    </svg>
                    Генерация изображений
                </span>
                {/* model select */}
                <RadarModelSelect
                    taskType="edit_image"
                    value={modelType?.id}
                    options={edit_image?.filter(model => model.task_type === 'edit_image').map(model => ({ label: model.name, value: model.id, price: model.tokens_per_request, icon: model.icon_path }))}
                    onChange={(value) => dispatch(imageGenerationActions.setImageGenerationSettings({ key: 'modelType', value: edit_image?.find(model => model.id === value) ?? null }))}
                    loading={isLoading}
                    disabled={isGenerationInProgress}
                />
                <ModelSampleSelect disabled={isGenerationInProgress} />
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
                                        onClick={() => dispatch(imageGenerationActions.setImageGenerationSettings({ key: 'dimensions', value: _ }))}
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
                            onChange={(value) => dispatch(imageGenerationActions.setImageGenerationSettings({ key: 'needToEnchance', value: value }))}
                            disabled={isGenerationInProgress}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}