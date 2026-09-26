import type { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { saveImageInSizes, deleteImageAllSizes, getPosterPath, getAllPosterPaths, type ImageSize } from '../utils/upload.js';

export const getAllLoreItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, page = 1, limit = 10, posterSize = 'medium' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      isPublic: true,
    };

    if (title) {
      where.title = {
        contains: String(title),
        mode: 'insensitive',
      };
    }

    const [loreItems, total] = await Promise.all([
      prisma.loreItem.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              login: true,
            },
          },
          images: true,
        },
        skip,
        take: Number(limit),
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.loreItem.count({ where }),
    ]);

    // Преобразуем poster в нужный размер
    const loreItemsWithPoster = loreItems.map(item => ({
      ...item,
      poster: getPosterPath(item.poster, posterSize as ImageSize),
      posterAll: getAllPosterPaths(item.poster),
    }));

    res.json({
      success: true,
      data: {
        loreItems: loreItemsWithPoster,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get lore items error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get lore items',
    });
  }
};

export const getLoreItemById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { posterSize = 'medium' } = req.query;

    const loreItem = await prisma.loreItem.findFirst({
      where: {
        id: Number(id),
        isPublic: true,
      },
      include: {
        user: {
          select: {
            id: true,
            login: true,
          },
        },
        images: true,
      },
    });

    if (!loreItem) {
      res.status(404).json({
        success: false,
        error: 'Lore item not found',
      });
      return;
    }

    // Преобразуем poster в нужный размер
    const loreItemWithPoster = {
      ...loreItem,
      poster: getPosterPath(loreItem.poster, posterSize as ImageSize),
      posterAll: getAllPosterPaths(loreItem.poster),
    };

    res.json({
      success: true,
      data: loreItemWithPoster,
    });
  } catch (error) {
    console.error('Get lore item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get lore item',
    });
  }
};

export const createLoreItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, text } = req.body;
    const userId = req.user!.id;
    const file = req.file;

    let posterPath: string | null = null;

    // Если есть загруженный файл, сохраняем его в разных размерах
    if (file) {
      const savedPaths = await saveImageInSizes(file, 'lore', `lore-${userId}`);
      posterPath = savedPaths.medium; // Сохраняем medium путь как основной
    }

    const loreItem = await prisma.loreItem.create({
      data: {
        title,
        text,
        poster: posterPath,
        userId,
        accessLevel: 1,
        isPublic: true,
      },
      include: {
        user: {
          select: {
            id: true,
            login: true,
          },
        },
      },
    });

    // Возвращаем loreItem с путями ко всем размерам
    const loreItemWithPoster = {
      ...loreItem,
      poster: getPosterPath(loreItem.poster, 'medium'),
      posterAll: getAllPosterPaths(loreItem.poster),
    };

    res.status(201).json({
      success: true,
      data: loreItemWithPoster,
      message: 'Lore item created successfully',
    });
  } catch (error) {
    console.error('Create lore item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create lore item',
    });
  }
};

export const updateLoreItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, text, removePoster } = req.body;
    const userId = req.user!.id;
    const file = req.file;

    const loreItem = await prisma.loreItem.findUnique({
      where: { id: Number(id) },
    });

    if (!loreItem) {
      res.status(404).json({
        success: false,
        error: 'Lore item not found',
      });
      return;
    }

    const isOwner = loreItem.userId === userId;
    const isAdminOrMod = req.user?.status === 'ADMIN' || req.user?.status === 'MODERATOR';
    if (!isOwner && !isAdminOrMod) {
      res.status(403).json({
        success: false,
        error: 'You can only update your own lore items',
      });
      return;
    }

    let posterPath: string | null | undefined = undefined;

    // Если есть новый файл, сохраняем его и удаляем старый
    if (file) {
      // Удаляем старое изображение
      if (loreItem.poster) {
        await deleteImageAllSizes(loreItem.poster);
      }
      
      const savedPaths = await saveImageInSizes(file, 'lore', `lore-${loreItem.userId}`);
      posterPath = savedPaths.medium;
    } else if (removePoster === 'true' || removePoster === true) {
      // Удаляем изображение если запрошено
      if (loreItem.poster) {
        await deleteImageAllSizes(loreItem.poster);
      }
      posterPath = null;
    }

    const updatedLoreItem = await prisma.loreItem.update({
      where: { id: Number(id) },
      data: {
        title,
        text,
        ...(posterPath !== undefined && { poster: posterPath }),
      },
      include: {
        user: {
          select: {
            id: true,
            login: true,
          },
        },
      },
    });

    // Возвращаем loreItem с путями ко всем размерам
    const loreItemWithPoster = {
      ...updatedLoreItem,
      poster: getPosterPath(updatedLoreItem.poster, 'medium'),
      posterAll: getAllPosterPaths(updatedLoreItem.poster),
    };

    res.json({
      success: true,
      data: loreItemWithPoster,
      message: 'Lore item updated successfully',
    });
  } catch (error) {
    console.error('Update lore item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update lore item',
    });
  }
};

export const deleteLoreItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const loreItem = await prisma.loreItem.findUnique({
      where: { id: Number(id) },
    });

    if (!loreItem) {
      res.status(404).json({
        success: false,
        error: 'Lore item not found',
      });
      return;
    }

    const isOwner = loreItem.userId === userId;
    const isAdminOrMod = req.user?.status === 'ADMIN' || req.user?.status === 'MODERATOR';
    if (!isOwner && !isAdminOrMod) {
      res.status(403).json({
        success: false,
        error: 'You can only delete your own lore items',
      });
      return;
    }

    // Удаляем изображение при удалении записи
    if (loreItem.poster) {
      await deleteImageAllSizes(loreItem.poster);
    }

    await prisma.loreItem.delete({
      where: { id: Number(id) },
    });

    res.json({
      success: true,
      message: 'Lore item deleted successfully',
    });
  } catch (error) {
    console.error('Delete lore item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete lore item',
    });
  }
}; 