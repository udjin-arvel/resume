import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Размеры изображений
export const IMAGE_SIZES = {
  small: { width: 150, height: 150 },
  medium: { width: 400, height: 400 },
  large: { width: 800, height: 800 },
} as const;

export type ImageSize = keyof typeof IMAGE_SIZES;

export const AVATAR_SIZE = 200;

// Базовая папка для загрузок
const UPLOAD_BASE_PATH = process.env.UPLOAD_PATH || path.join(__dirname, '../../uploads');

// Создание папки если не существует
const ensureDir = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Конфигурация multer для хранения в памяти
const storage = multer.memoryStorage();

// Фильтр файлов - только изображения
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback): void => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, png, gif, webp)'));
  }
};

// Middleware для загрузки одного файла
export const uploadSingle = (fieldName: string) => multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
}).single(fieldName);

const AUDIO_MIME_TO_EXT: Record<string, string> = {
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'audio/ogg': '.ogg',
};

const audioFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback): void => {
  const allowedMimeTypes = Object.keys(AUDIO_MIME_TO_EXT);

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only audio files are allowed (mpeg, wav, ogg)'));
  }
};

export const uploadAudioSingle = (fieldName: string) => multer({
  storage,
  fileFilter: audioFileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max
  },
}).single(fieldName);

/**
 * Сохраняет аудиофайл без обработки
 */
export const saveAudioFile = async (
  file: Express.Multer.File,
  subFolder: string,
  filename: string
): Promise<string> => {
  const uploadDir = path.join(UPLOAD_BASE_PATH, subFolder);
  ensureDir(uploadDir);

  const ext = AUDIO_MIME_TO_EXT[file.mimetype] || path.extname(file.originalname) || '.mp3';
  const baseName = `${filename}-${Date.now()}${ext}`;
  const filePath = path.join(uploadDir, baseName);

  await fs.promises.writeFile(filePath, file.buffer);

  return `/uploads/${subFolder}/${baseName}`;
};

/**
 * Удаляет аудиофайл с диска
 */
export const deleteAudioFile = async (audioPath: string): Promise<void> => {
  if (!audioPath?.includes('/uploads/')) return;

  const relativePath = audioPath.replace(/^\/uploads\/?/, '');
  const filePath = path.join(UPLOAD_BASE_PATH, relativePath);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(`Failed to delete audio ${filePath}:`, error);
  }
};

// Интерфейс результата сохранения
export interface SavedImagePaths {
  small: string;
  medium: string;
  large: string;
  original: string;
}

/**
 * Сохраняет изображение в нескольких размерах
 * @param file - файл из multer
 * @param subFolder - подпапка (например, 'notions')
 * @param filename - базовое имя файла (без расширения)
 * @returns объект с путями к файлам
 */
export const saveImageInSizes = async (
  file: Express.Multer.File,
  subFolder: string,
  filename: string
): Promise<SavedImagePaths> => {
  const uploadDir = path.join(UPLOAD_BASE_PATH, subFolder);
  ensureDir(uploadDir);

  const timestamp = Date.now();
  const baseName = `${filename}-${timestamp}`;
  const ext = '.webp'; // Конвертируем все в webp для оптимизации

  const paths: SavedImagePaths = {
    small: '',
    medium: '',
    large: '',
    original: '',
  };

  // Сохраняем оригинал
  const originalPath = path.join(uploadDir, `${baseName}-original${ext}`);
  await sharp(file.buffer)
    .webp({ quality: 90 })
    .toFile(originalPath);
  paths.original = `/uploads/${subFolder}/${baseName}-original${ext}`;

  // Создаём версии разных размеров
  for (const [size, dimensions] of Object.entries(IMAGE_SIZES)) {
    const filePath = path.join(uploadDir, `${baseName}-${size}${ext}`);
    
    await sharp(file.buffer)
      .resize(dimensions.width, dimensions.height, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 85 })
      .toFile(filePath);

    paths[size as ImageSize] = `/uploads/${subFolder}/${baseName}-${size}${ext}`;
  }

  return paths;
};

/**
 * Сохраняет аватар: вписывает изображение в квадрат AVATAR_SIZE×AVATAR_SIZE
 */
export const saveAvatar = async (
  file: Express.Multer.File,
  userId: number
): Promise<string> => {
  const subFolder = 'avatars';
  const uploadDir = path.join(UPLOAD_BASE_PATH, subFolder);
  ensureDir(uploadDir);

  const filename = `user-${userId}-${Date.now()}.webp`;
  const filePath = path.join(uploadDir, filename);

  await sharp(file.buffer)
    .resize(AVATAR_SIZE, AVATAR_SIZE, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 85 })
    .toFile(filePath);

  return `/uploads/${subFolder}/${filename}`;
};

/**
 * Удаляет файл аватара (поддерживает старый формат с несколькими размерами)
 */
export const deleteAvatar = async (avatarPath: string): Promise<void> => {
  if (!avatarPath?.includes('/uploads/avatars/')) return;

  if (/-(?:small|medium|large|original)\./.test(avatarPath)) {
    await deleteImageAllSizes(avatarPath);
    return;
  }

  const relativePath = avatarPath.replace(/^\/uploads\/?/, '');
  const filePath = path.join(UPLOAD_BASE_PATH, relativePath);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(`Failed to delete avatar ${filePath}:`, error);
  }
};

/**
 * Удаляет все версии изображения
 * @param posterPath - путь к любой версии изображения (например, medium)
 */
export const deleteImageAllSizes = async (posterPath: string): Promise<void> => {
  if (!posterPath) return;

  // Извлекаем базовое имя из пути (убираем размер)
  const match = posterPath.match(/^(.+)-(?:small|medium|large|original)(\.[^.]+)$/);
  if (!match) return;

  const [, basePath, ext] = match;
  if (!basePath || !ext) return;
  const sizes = ['small', 'medium', 'large', 'original'];
  
  // Убираем /uploads из начала пути, если есть
  const normalizedBasePath = basePath.replace(/^\/uploads/, '');

  for (const size of sizes) {
    const filePath = path.join(UPLOAD_BASE_PATH, `${normalizedBasePath}-${size}${ext}`.slice(1));
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error(`Failed to delete ${filePath}:`, error);
    }
  }
};

/**
 * Преобразует путь poster в нужный размер
 * @param posterPath - текущий путь (может быть любого размера)
 * @param targetSize - желаемый размер
 * @returns путь к изображению нужного размера
 */
export const getPosterPath = (posterPath: string | null, targetSize: ImageSize = 'medium'): string | null => {
  if (!posterPath) return null;

  // Заменяем размер в пути
  const match = posterPath.match(/^(.+)-(?:small|medium|large|original)(\.[^.]+)$/);
  if (!match) return posterPath;

  const [, basePath, ext] = match;
  if (!basePath || !ext) return posterPath;
  // Убеждаемся, что путь начинается с /uploads
  const normalizedBase = basePath.startsWith('/uploads') ? basePath : `/uploads${basePath}`;
  return `${normalizedBase}-${targetSize}${ext}`;
};

/**
 * Возвращает объект со всеми путями для poster
 * @param posterPath - путь к любой версии
 */
export const getAllPosterPaths = (posterPath: string | null): SavedImagePaths | null => {
  if (!posterPath) return null;

  const match = posterPath.match(/^(.+)-(?:small|medium|large|original)(\.[^.]+)$/);
  if (!match) return null;

  const [, basePath, ext] = match;
  if (!basePath || !ext) return null;
  // Убеждаемся, что путь начинается с /uploads
  const normalizedBase = basePath.startsWith('/uploads') ? basePath : `/uploads${basePath}`;
  return {
    small: `${normalizedBase}-small${ext}`,
    medium: `${normalizedBase}-medium${ext}`,
    large: `${normalizedBase}-large${ext}`,
    original: `${normalizedBase}-original${ext}`,
  };
};
