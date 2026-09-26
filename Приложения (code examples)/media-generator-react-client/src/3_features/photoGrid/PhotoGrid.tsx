import { getTenDigitsRandomArray } from "@shared"
import styles from './PhotoGrid.module.css'

export const PhotoGrid = () => {

    return (
        <div className={styles.page__gallery}>
            {getTenDigitsRandomArray().map((_) => (
                <div className={styles.page__galleryItem} key={_}>
                    <img src={`/galleryBlockPics/${_}.avif`} srcSet={`/galleryBlockPics/${_}.jpg`} alt={`Gallery item ${_}`} />
                </div>
            ))}
        </div>
    )
}