import type { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import type { CompositionType } from '@prisma/client';
import { saveImageInSizes, deleteImageAllSizes, getPosterPath, getAllPosterPaths, type ImageSize } from '../utils/upload.js';

export const getAllCompositions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, type, page = 1, limit = 10, posterSize = 'medium' } = req.query;
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

    if (type) {
      where.type = type as CompositionType;
    }

    const [compositions, total] = await Promise.all([
      prisma.composition.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              login: true,
            },
          },
          stories: {
            where: { isPublic: true },
            orderBy: { chapter: 'asc' },
            select: {
              id: true,
              title: true,
              chapter: true,
              type: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.composition.count({ where }),
    ]);

    // Преобразуем poster в нужный размер
    const compositionsWithPoster = compositions.map(item => ({
      ...item,
      poster: getPosterPath(item.poster, posterSize as ImageSize),
      posterAll: getAllPosterPaths(item.poster),
    }));

    res.json({
      success: true,
      data: {
        compositions: compositionsWithPoster,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get compositions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get compositions',
    });
  }
};

export const getCompositionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { posterSize = 'medium' } = req.query;

    const composition = await prisma.composition.findFirst({
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
        stories: {
          where: { isPublic: true },
          orderBy: { chapter: 'asc' },
          select: {
            id: true,
            title: true,
            chapter: true,
            type: true,
            createdAt: true,
          },
        },
      },
    });

    if (!composition) {
      res.status(404).json({
        success: false,
        error: 'Composition not found',
      });
      return;
    }

    // Преобразуем poster в нужный размер
    const compositionWithPoster = {
      ...composition,
      poster: getPosterPath(composition.poster, posterSize as ImageSize),
      posterAll: getAllPosterPaths(composition.poster),
    };

    res.json({
      success: true,
      data: compositionWithPoster,
    });
  } catch (error) {
    console.error('Get composition error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get composition',
    });
  }
};

export const createComposition = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, type } = req.body;
    const userId = req.user!.id;
    const file = req.file;

    let posterPath: string | null = null;

    // Если есть загруженный файл, сохраняем его в разных размерах
    if (file) {
      const savedPaths = await saveImageInSizes(file, 'compositions', `composition-${userId}`);
      posterPath = savedPaths.medium; // Сохраняем medium путь как основной
    }

    const composition = await prisma.composition.create({
      data: {
        title,
        description,
        type: type as CompositionType,
        poster: posterPath,
        userId,
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

    // Возвращаем composition с путями ко всем размерам
    const compositionWithPoster = {
      ...composition,
      poster: getPosterPath(composition.poster, 'medium'),
      posterAll: getAllPosterPaths(composition.poster),
    };

    res.status(201).json({
      success: true,
      data: compositionWithPoster,
      message: 'Composition created successfully',
    });
  } catch (error) {
    console.error('Create composition error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create composition',
    });
  }
};

export const updateComposition = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, type, removePoster } = req.body;
    const userId = req.user!.id;
    const file = req.file;

    const composition = await prisma.composition.findUnique({
      where: { id: Number(id) },
    });

    if (!composition) {
      res.status(404).json({
        success: false,
        error: 'Composition not found',
      });
      return;
    }

    const isOwner = composition.userId === userId;
    const isAdminOrMod = req.user?.status === 'ADMIN' || req.user?.status === 'MODERATOR';
    if (!isOwner && !isAdminOrMod) {
      res.status(403).json({
        success: false,
        error: 'You can only update your own compositions',
      });
      return;
    }

    let posterPath: string | null | undefined = undefined;

    // Если есть новый файл, сохраняем его и удаляем старый
    if (file) {
      // Удаляем старое изображение
      if (composition.poster) {
        await deleteImageAllSizes(composition.poster);
      }
      
      const savedPaths = await saveImageInSizes(file, 'compositions', `composition-${composition.userId}`);
      posterPath = savedPaths.medium;
    } else if (removePoster === 'true' || removePoster === true) {
      // Удаляем изображение если запрошено
      if (composition.poster) {
        await deleteImageAllSizes(composition.poster);
      }
      posterPath = null;
    }

    const updatedComposition = await prisma.composition.update({
      where: { id: Number(id) },
      data: {
        title,
        description,
        type: type as CompositionType,
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

    // Возвращаем composition с путями ко всем размерам
    const compositionWithPoster = {
      ...updatedComposition,
      poster: getPosterPath(updatedComposition.poster, 'medium'),
      posterAll: getAllPosterPaths(updatedComposition.poster),
    };

    res.json({
      success: true,
      data: compositionWithPoster,
      message: 'Composition updated successfully',
    });
  } catch (error) {
    console.error('Update composition error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update composition',
    });
  }
};

export const deleteComposition = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const composition = await prisma.composition.findUnique({
      where: { id: Number(id) },
    });

    if (!composition) {
      res.status(404).json({
        success: false,
        error: 'Composition not found',
      });
      return;
    }

    const isOwner = composition.userId === userId;
    const isAdminOrMod = req.user?.status === 'ADMIN' || req.user?.status === 'MODERATOR';
    if (!isOwner && !isAdminOrMod) {
      res.status(403).json({
        success: false,
        error: 'You can only delete your own compositions',
      });
      return;
    }

    // Удаляем изображение при удалении записи
    if (composition.poster) {
      await deleteImageAllSizes(composition.poster);
    }

    await prisma.composition.delete({
      where: { id: Number(id) },
    });

    res.json({
      success: true,
      message: 'Composition deleted successfully',
    });
  } catch (error) {
    console.error('Delete composition error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete composition',
    });
  }
}; 