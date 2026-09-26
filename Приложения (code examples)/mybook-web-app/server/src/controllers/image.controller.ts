import type { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { saveImageInSizes, deleteImageAllSizes, getPosterPath, getAllPosterPaths, type ImageSize } from '../utils/upload.js';

// Типы контента, к которым можно добавить изображение
type ContentType = 'notion' | 'lore' | 'note' | 'fragment';

/**
 * Добавление изображения к контенту (notion, lore, note, fragment)
 */
export const addImageToContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentType, contentId } = req.params;
    const { title } = req.body;
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
      res.status(400).json({
        success: false,
        error: 'No image file provided',
      });
      return;
    }

    // Валидация типа контента
    const validContentTypes: ContentType[] = ['notion', 'lore', 'note', 'fragment'];
    if (!validContentTypes.includes(contentType as ContentType)) {
      res.status(400).json({
        success: false,
        error: 'Invalid content type. Must be one of: notion, lore, note, fragment',
      });
      return;
    }

    // Проверка существования контента и прав доступа
    let content: any = null;
    const id = Number(contentId);

    switch (contentType as ContentType) {
      case 'notion':
        content = await prisma.notion.findFirst({
          where: { id, userId },
        });
        break;
      case 'lore':
        content = await prisma.loreItem.findFirst({
          where: { id, userId },
        });
        break;
      case 'note':
        content = await prisma.note.findFirst({
          where: { id, userId },
        });
        break;
      case 'fragment':
        content = await prisma.fragment.findFirst({
          where: { id },
          include: {
            story: true,
          },
        });
        // Для фрагментов проверяем владельца истории
        if (content && content.story.userId !== userId) {
          content = null;
        }
        break;
    }

    if (!content) {
      res.status(404).json({
        success: false,
        error: 'Content not found or access denied',
      });
      return;
    }

    // Сохраняем изображение
    const savedPaths = await saveImageInSizes(file, 'images', `${contentType}-${contentId}`);

    // Создаём запись в таблице images
    const imageData: any = {
      path: savedPaths.medium, // Сохраняем medium как основной путь
      title: title || null,
      userId,
    };

    // Устанавливаем связь с соответствующим контентом
    switch (contentType as ContentType) {
      case 'notion':
        imageData.notionId = id;
        break;
      case 'lore':
        imageData.loreItemId = id;
        break;
      case 'note':
        imageData.noteId = id;
        break;
      case 'fragment':
        imageData.fragmentId = id;
        break;
    }

    const image = await prisma.image.create({
      data: imageData,
      include: {
        user: {
          select: {
            id: true,
            login: true,
          },
        },
      },
    });

    // Возвращаем изображение с путями ко всем размерам
    const imageWithPaths = {
      ...image,
      path: getPosterPath(image.path, 'medium'),
      paths: getAllPosterPaths(image.path),
    };

    res.status(201).json({
      success: true,
      data: imageWithPaths,
      message: 'Image uploaded successfully',
    });
  } catch (error) {
    console.error('Add image error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload image',
    });
  }
};

/**
 * Получение всех изображений для контента
 */
export const getContentImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentType, contentId } = req.params;
    const { posterSize = 'medium' } = req.query;

    const id = Number(contentId);

    // Строим условие where в зависимости от типа контента
    let where: any = {};
    switch (contentType) {
      case 'notion':
        where.notionId = id;
        break;
      case 'lore':
        where.loreItemId = id;
        break;
      case 'note':
        where.noteId = id;
        break;
      case 'fragment':
        where.fragmentId = id;
        break;
      default:
        res.status(400).json({
          success: false,
          error: 'Invalid content type',
        });
        return;
    }

    const images = await prisma.image.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            login: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Преобразуем пути изображений
    const imagesWithPaths = images.map(image => ({
      ...image,
      path: getPosterPath(image.path, posterSize as ImageSize),
      paths: getAllPosterPaths(image.path),
    }));

    res.json({
      success: true,
      data: imagesWithPaths,
    });
  } catch (error) {
    console.error('Get content images error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get images',
    });
  }
};

/**
 * Удаление изображения
 */
export const deleteImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userStatus = req.user!.status;

    const image = await prisma.image.findUnique({
      where: { id: Number(id) },
    });

    if (!image) {
      res.status(404).json({
        success: false,
        error: 'Image not found',
      });
      return;
    }

    // Проверка прав: владелец, модератор или админ
    const isOwner = image.userId === userId;
    const isModeratorOrAdmin = userStatus === 'ADMIN' || userStatus === 'MODERATOR';

    if (!isOwner && !isModeratorOrAdmin) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    // Удаляем файлы изображения
    if (image.path) {
      await deleteImageAllSizes(image.path);
    }

    // Удаляем запись из БД
    await prisma.image.delete({
      where: { id: Number(id) },
    });

    res.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete image',
    });
  }
};
