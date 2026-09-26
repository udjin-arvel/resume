import type { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import type { NotionType } from '@prisma/client';
import { saveImageInSizes, deleteImageAllSizes, getPosterPath, getAllPosterPaths, type ImageSize } from '../utils/upload.js';

export const getAllNotions = async (req: Request, res: Response): Promise<void> => {
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
      where.type = type as NotionType;
    }

    const [notions, total] = await Promise.all([
      prisma.notion.findMany({
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
      prisma.notion.count({ where }),
    ]);

    // Преобразуем poster в нужный размер
    const notionsWithPoster = notions.map(notion => ({
      ...notion,
      poster: getPosterPath(notion.poster, posterSize as ImageSize),
      posterAll: getAllPosterPaths(notion.poster),
    }));

    res.json({
      success: true,
      data: {
        notions: notionsWithPoster,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get notions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notions',
    });
  }
};

export const getNotionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { posterSize = 'medium' } = req.query;

    const notion = await prisma.notion.findFirst({
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

    if (!notion) {
      res.status(404).json({
        success: false,
        error: 'Notion not found',
      });
      return;
    }

    // Преобразуем poster в нужный размер
    const notionWithPoster = {
      ...notion,
      poster: getPosterPath(notion.poster, posterSize as ImageSize),
      posterAll: getAllPosterPaths(notion.poster),
    };

    res.json({
      success: true,
      data: notionWithPoster,
    });
  } catch (error) {
    console.error('Get notion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notion',
    });
  }
};

export const createNotion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, text, type } = req.body;
    const userId = req.user!.id;
    const file = req.file;

    let posterPath: string | null = null;

    // Если есть загруженный файл, сохраняем его в разных размерах
    if (file) {
      const savedPaths = await saveImageInSizes(file, 'notions', `notion-${userId}`);
      posterPath = savedPaths.medium; // Сохраняем medium путь как основной
    }

    const notion = await prisma.notion.create({
      data: {
        title,
        text,
        type: type as NotionType,
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

    // Возвращаем notion с путями ко всем размерам
    const notionWithPoster = {
      ...notion,
      poster: getPosterPath(notion.poster, 'medium'),
      posterAll: getAllPosterPaths(notion.poster),
    };

    res.status(201).json({
      success: true,
      data: notionWithPoster,
      message: 'Notion created successfully',
    });
  } catch (error) {
    console.error('Create notion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create notion',
    });
  }
};

export const updateNotion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, text, type, removePoster } = req.body;
    const userId = req.user!.id;
    const file = req.file;

    const notion = await prisma.notion.findUnique({
      where: { id: Number(id) },
    });

    if (!notion) {
      res.status(404).json({
        success: false,
        error: 'Notion not found',
      });
      return;
    }

    const isOwner = notion.userId === userId;
    const isAdminOrMod = req.user?.status === 'ADMIN' || req.user?.status === 'MODERATOR';
    if (!isOwner && !isAdminOrMod) {
      res.status(403).json({
        success: false,
        error: 'You can only update your own notions',
      });
      return;
    }

    let posterPath: string | null | undefined = undefined;

    // Если есть новый файл, сохраняем его и удаляем старый
    if (file) {
      // Удаляем старое изображение
      if (notion.poster) {
        await deleteImageAllSizes(notion.poster);
      }
      
      const savedPaths = await saveImageInSizes(file, 'notions', `notion-${notion.userId}`);
      posterPath = savedPaths.medium;
    } else if (removePoster === 'true' || removePoster === true) {
      // Удаляем изображение если запрошено
      if (notion.poster) {
        await deleteImageAllSizes(notion.poster);
      }
      posterPath = null;
    }

    const updatedNotion = await prisma.notion.update({
      where: { id: Number(id) },
      data: {
        title,
        text,
        type: type as NotionType,
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

    // Возвращаем notion с путями ко всем размерам
    const notionWithPoster = {
      ...updatedNotion,
      poster: getPosterPath(updatedNotion.poster, 'medium'),
      posterAll: getAllPosterPaths(updatedNotion.poster),
    };

    res.json({
      success: true,
      data: notionWithPoster,
      message: 'Notion updated successfully',
    });
  } catch (error) {
    console.error('Update notion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notion',
    });
  }
};

export const deleteNotion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const notion = await prisma.notion.findUnique({
      where: { id: Number(id) },
    });

    if (!notion) {
      res.status(404).json({
        success: false,
        error: 'Notion not found',
      });
      return;
    }

    const isOwner = notion.userId === userId;
    const isAdminOrMod = req.user?.status === 'ADMIN' || req.user?.status === 'MODERATOR';
    if (!isOwner && !isAdminOrMod) {
      res.status(403).json({
        success: false,
        error: 'You can only delete your own notions',
      });
      return;
    }

    // Удаляем изображение при удалении записи
    if (notion.poster) {
      await deleteImageAllSizes(notion.poster);
    }

    await prisma.notion.delete({
      where: { id: Number(id) },
    });

    res.json({
      success: true,
      message: 'Notion deleted successfully',
    });
  } catch (error) {
    console.error('Delete notion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notion',
    });
  }
};

export const searchNotions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query;

    if (!q || String(q).trim().length < 2) {
      res.json({
        success: true,
        data: [],
      });
      return;
    }

    const notions = await prisma.notion.findMany({
      where: {
        title: {
          contains: String(q),
          mode: 'insensitive',
        },
        isPublic: true,
      },
      select: {
        id: true,
        title: true,
        text: true,
        type: true,
      },
      take: 10,
      orderBy: {
        title: 'asc',
      },
    });

    res.json({
      success: true,
      data: notions,
    });
  } catch (error) {
    console.error('Search notions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search notions',
    });
  }
}; 