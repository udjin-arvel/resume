import {
    ALLOWED_IMAGE_TYPES,
    MAX_FILE_SIZE,
    //MIN_WIDTH,
    //MIN_HEIGHT
} from '@shared/сonstants/constants';

// --- image dimensions func
export const loadImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve({ width: img.naturalWidth, height: img.naturalHeight });
            URL.revokeObjectURL(img.src);
        };
        img.onerror = () => {
            URL.revokeObjectURL(img.src);
            reject(new Error('Не удалось загрузить изображение'));
        };
        img.src = URL.createObjectURL(file);
    });
};
// --- image validation func
export const validateImageFile = async (file: File): Promise<void> => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        throw new Error('Формат: только JPG, PNG, WEBP');
    }
    if (file.size > MAX_FILE_SIZE) {
        throw new Error('Размер файла: до 10 Мб');
    }
    // const { width, height } = await loadImageDimensions(file);
    // if (width < MIN_WIDTH || height < MIN_HEIGHT) {
    //     throw new Error(`Минимальное разрешение: ${MIN_WIDTH}×${MIN_HEIGHT}px`);
    // }
    // if (width >= height) {
    //     throw new Error('Изображение должно быть вертикально ориентировано');
    // }
};