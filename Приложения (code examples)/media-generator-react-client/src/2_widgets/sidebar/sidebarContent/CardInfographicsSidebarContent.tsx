import { useMemo } from 'react'
import styles from './CardInfographicsSidebarContent.module.css'
import { NavLink } from 'react-router'
import { RadarSwitch, API, DEFAULT_IMAGE_PROCESSING_MODEL_ID } from '@shared'
import { useAppSelector, useAppDispatch } from '@app'
import { cardInfographicsActions } from '@entities'

// const ASPECT_RATIO_OPTIONS = [
//     '1:1',
//     '16:9',
//     '9:16',
//     '3:4',
//     '4:3',
//     '21:9'
// ]

export const CardInfographicsSidebarContent = () => {
    const { isGenerationInProgress, dimensions, needToEnchance } = useAppSelector(state => state.cardInfographics);
    const dispatch = useAppDispatch();
    const { data: modelTypes } = API.useGetModelsListQuery();
    const { images: imagesModels } = modelTypes ?? {};
    const modelType = useMemo(() => {
        const defaultModel = imagesModels?.find(model => model.id === DEFAULT_IMAGE_PROCESSING_MODEL_ID);
        if (defaultModel) {
            return defaultModel;
        } else {
            return imagesModels?.filter(model => model.task_type === 'edit_image')?.[0] ?? null;
        }
    }, [modelTypes]);
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
                    <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.7432 0C13.7943 5.51754e-05 15.4569 1.66276 15.457 3.71387V15.6943C15.4568 17.7454 13.7942 19.4081 11.7432 19.4082H3.71387C1.66298 19.408 0.000212945 17.7452 0 15.6943V3.71387C0.000103063 1.66288 1.66291 0.000248496 3.71387 0H11.7432ZM11.1904 11.1816C10.8757 10.6383 10.0714 10.7008 9.84375 11.2861L8.83301 13.8867C8.17236 15.5855 5.84711 15.7835 4.90918 14.2207C4.60785 13.7185 3.89135 13.6865 3.54688 14.1602L1.63965 16.8076C2.03696 17.5462 2.81648 18.0487 3.71387 18.0488H11.7432C12.8942 18.0488 13.8497 17.2224 14.0547 16.1309L11.1904 11.1816ZM3.71387 1.35938C2.41358 1.35962 1.35948 2.41354 1.35938 3.71387V14.8301L2.43555 13.3516C3.35941 12.0813 5.27958 12.166 6.08789 13.5127C6.43753 14.0954 7.30438 14.022 7.55078 13.3887L8.5625 10.7871C9.20818 9.12717 11.4875 8.95172 12.3799 10.4932L13.9873 13.2695L14.0977 13.4795V3.71387C14.0976 2.41342 13.0436 1.35943 11.7432 1.35938H3.71387ZM3.87012 6.875C4.62951 6.875 5.24512 7.49061 5.24512 8.25C5.2451 9.00938 4.6295 9.625 3.87012 9.625C3.11088 9.62483 2.49513 9.00928 2.49512 8.25C2.49512 7.49071 3.11087 6.87517 3.87012 6.875ZM11.7275 2.89258C12.1027 2.89273 12.4072 3.19703 12.4072 3.57227C12.407 3.9473 12.1026 4.25082 11.7275 4.25098H3.76172C3.38655 4.25096 3.08227 3.94738 3.08203 3.57227C3.08203 3.19694 3.3864 2.89259 3.76172 2.89258H11.7275Z" fill="currentColor" />
                    </svg>
                    Создание инфографики товара
                </span>
                <div className={styles.content__dimensions}>
                    <span className={`text_primary`} style={{ fontWeight: 600 }}>Соотношение сторон</span>
                    <div className={styles.content__dimensionsOptions}>
                        {modelType?.aspect_ratio_options?.map(_ => {
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
                                    onClick={() => dispatch(cardInfographicsActions.setCardInfographicsSettings({ key: 'dimensions', value: _ }))}
                                    disabled={isGenerationInProgress}
                                >
                                    <div className={styles.content__dimensionsIcon} style={{ width: actualWidth, height: actualHeight }}></div>
                                    <span className={`text_secondary`}>{_}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
                {/* switch */}
                <div className={styles.content__settingsItem}>
                    <span className={`text_primary`} style={{ fontWeight: 600 }}>Улучшать промпт</span>
                    <div className={styles.content__settingsItemContent}>
                        {/* waiting for the price source */}
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
                            onChange={(value) => dispatch(cardInfographicsActions.setCardInfographicsSettings({ key: 'needToEnchance', value: value }))}
                            disabled={isGenerationInProgress}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}