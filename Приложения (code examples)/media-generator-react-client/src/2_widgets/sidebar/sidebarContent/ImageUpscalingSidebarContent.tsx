import { RadarModelSelect } from '@/3_features/modelSelect/RadarModelSelect'
import styles from './ImageUpscalingSidebarContent.module.css'
import { NavLink } from 'react-router'
import { useAppDispatch, useAppSelector } from '@app'
import { imageUpscalingActions } from '@entities'
import { API } from '@/5_shared/api/rtk-api'
import { useEffect } from 'react'

export const ImageUpscalingSidebarContent = () => {
    const dispatch = useAppDispatch();
    const { modelType, /*isGenerationInProgress*/ } = useAppSelector(state => state.imageUpscaling);
    const isGenerationInProgress = true;
    const { data: models, isLoading } = API.useGetModelsListQuery();
    const { images: improve_image_quality } = models ?? {};
    useEffect(() => {
        if (improve_image_quality) {
            const improveQualityModel = improve_image_quality?.find(model => model.task_type === 'improve_quality');
            dispatch(imageUpscalingActions.setImageUpscalingSettings({ key: 'modelType', value: improveQualityModel ?? improve_image_quality?.[0] ?? null }));
        }
    }, [improve_image_quality]);
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none">
                        <path fill="currentColor" d="M1.7892 1.7892c-.2348.235-.4142.6853-.4142 1.6483a.6875.6875 0 1 1-1.375 0C0 2.3755.1831 1.4508.817.817 1.4508.183 2.3754 0 3.4375 0a.6875.6875 0 1 1 0 1.375c-.963 0-1.4134.1794-1.6483.4142M5.6375 7.471c.6075 0 1.1-.4925 1.1-1.1s-.4925-1.1-1.1-1.1-1.1.4924-1.1 1.1c0 .6075.4925 1.1 1.1 1.1" />
                        <path fill="currentColor" fillRule="evenodd" d="M3.0637 14.0979a.685.685 0 0 1-.1942-.1893c-.7751-.6723-1.2653-1.6644-1.2653-2.771v-4.4c0-2.025 1.6416-3.6667 3.6666-3.6667h7.3334c2.025 0 3.6666 1.6417 3.6666 3.6667v4.4c0 1.1067-.4903 2.0989-1.2655 2.7712a.685.685 0 0 1-.3373.2599 3.65 3.65 0 0 1-2.0638.6356H5.2708a3.65 3.65 0 0 1-2.0636-.6354.7.7 0 0 1-.1435-.071m9.5405-9.652H5.2708c-1.2656 0-2.2916 1.026-2.2916 2.2917v4.4c0 .462.1367.8921.372 1.2521l1.2464-1.9245c.7396-1.1418 2.4332-1.0706 3.0743.1292.169.3163.6336.2796.751-.0592l.7708-2.2256c.504-1.4554 2.506-1.5984 3.2119-.2295l2.175 4.2182a2.28 2.28 0 0 0 .3152-1.1607v-4.4c0-1.2657-1.026-2.2917-2.2916-2.2917m0 8.9834c.3251 0 .6345-.0678.9147-.1899l-2.3354-4.5291c-.1517-.2943-.5821-.2636-.6905.0493l-.7709 2.2256c-.5099 1.4722-2.5286 1.6314-3.2629.2573-.1475-.2762-.5373-.2925-.7075-.0298l-1.3304 2.0539c.2627.105.5494.1627.8495.1627z" clipRule="evenodd" />
                        <path fill="currentColor" d="M14.4375 0a.6875.6875 0 1 0 0 1.375c.963 0 1.4134.1794 1.6483.4142.2348.235.4142.6853.4142 1.6483a.6875.6875 0 1 0 1.375 0c0-1.062-.1831-1.9867-.817-2.6205C16.4242.183 15.4995 0 14.4375 0m2.75 13.75a.6875.6875 0 0 1 .6875.6875c0 1.062-.1831 1.9867-.817 2.6205-.6338.6339-1.5585.817-2.6205.817a.6875.6875 0 1 1 0-1.375c.963 0 1.4134-.1794 1.6483-.4142.2348-.2349.4142-.6853.4142-1.6483a.6875.6875 0 0 1 .6875-.6875m-15.8125.6875a.6875.6875 0 1 0-1.375 0c0 1.062.1831 1.9867.817 2.6205.6338.6339 1.5584.817 2.6205.817a.6875.6875 0 1 0 0-1.375c-.963 0-1.4134-.1794-1.6483-.4142-.2348-.2349-.4142-.6853-.4142-1.6483" />
                    </svg>
                    Повышение качества
                </span>
                {/* model select */}
                <RadarModelSelect
                    taskType="improve_quality"
                    value={modelType?.id}
                    options={improve_image_quality?.filter(model => model.task_type === 'improve_quality')?.map(model => ({ label: model.name, value: model.id, price: model.tokens_per_request, icon: model.icon_path }))}
                    onChange={(value) => dispatch(imageUpscalingActions.setImageUpscalingSettings({ key: 'modelType', value: improve_image_quality?.find(model => model.id === value) ?? null }))}
                    loading={isLoading}
                    disabled={isGenerationInProgress}
                />
            </div>
        </div>
    )
}