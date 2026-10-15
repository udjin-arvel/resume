import type { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { saveImageInSizes, deleteImageAllSizes, getPosterPath, getAllPosterPaths, type ImageSize } from '../utils/upload.js';

export const getAllNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, importance, isContent, page = 1, limit = 10, posterSize = 'medium' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (title) {
      where.title = {
        contains: String(title),
        mode: 'insensitive',
      };
    }

    if (importance) {
      where.importance = Number(importance);
    }

    if (isContent !== undefined) {
      where.isContent = isContent === 'true';
    }

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
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
      prisma.note.count({ where }),
    ]);

    // Преобразуем poster в нужный размер
    const notesWithPoster = notes.map(item => ({
      ...item,
      poster: getPosterPath(item.poster, posterSize as ImageSize),
      posterAll: getAllPosterPaths(item.poster),
    }));

    res.json({
      success: true,
      data: {
        notes: notesWithPoster,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notes',
    });
  }
};

export const getNoteById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { posterSize = 'medium' } = req.query;
    const userId = req.user?.id;

    const note = await prisma.note.findFirst({
      where: {
        id: Number(id),
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

    if (!note) {
      res.status(404).json({
        success: false,
        error: 'Note not found',
      });
      return;
    }

    // Проверяем доступ к платному контенту
    if (note.isContent && note.userId !== userId) {
      // TODO: Проверить, купил ли пользователь эту заметку
      res.status(403).json({
        success: false,
        error: 'Access denied. This is premium content.',
      });
      return;
    }

    // Преобразуем poster в нужный размер
    const noteWithPoster = {
      ...note,
      poster: getPosterPath(note.poster, posterSize as ImageSize),
      posterAll: getAllPosterPaths(note.poster),
    };

    res.json({
      success: true,
      data: noteWithPoster,
    });
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get note',
    });
  }
};

export const createNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, text, importance, isContent, price } = req.body;
    const userId = req.user!.id;
    const file = req.file;

    let posterPath: string | null = null;

    // Если есть загруженный файл, сохраняем его в разных размерах
    if (file) {
      const savedPaths = await saveImageInSizes(file, 'notes', `note-${userId}`);
      posterPath = savedPaths.medium; // Сохраняем medium путь как основной
    }

    const note = await prisma.note.create({
      data: {
        title,
        text,
        poster: posterPath,
        importance: importance ? Number(importance) : 5,
        isContent: isContent === 'true' || isContent === true,
        price: price ? Number(price) : 10,
        userId,
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

    // Возвращаем note с путями ко всем размерам
    const noteWithPoster = {
      ...note,
      poster: getPosterPath(note.poster, 'medium'),
      posterAll: getAllPosterPaths(note.poster),
    };

    res.status(201).json({
      success: true,
      data: noteWithPoster,
      message: 'Note created successfully',
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create note',
    });
  }
};

export const updateNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, text, importance, isContent, price, removePoster } = req.body;
    const userId = req.user!.id;
    const file = req.file;

    const note = await prisma.note.findUnique({
      where: { id: Number(id) },
    });

    if (!note) {
      res.status(404).json({
        success: false,
        error: 'Note not found',
      });
      return;
    }

    const isOwner = note.userId === userId;
    const isAdminOrMod = req.user?.status === 'ADMIN' || req.user?.status === 'MODERATOR';
    if (!isOwner && !isAdminOrMod) {
      res.status(403).json({
        success: false,
        error: 'You can only update your own notes',
      });
      return;
    }

    let posterPath: string | null | undefined = undefined;

    // Если есть новый файл, сохраняем его и удаляем старый
    if (file) {
      // Удаляем старое изображение
      if (note.poster) {
        await deleteImageAllSizes(note.poster);
      }
      
      const savedPaths = await saveImageInSizes(file, 'notes', `note-${note.userId}`);
      posterPath = savedPaths.medium;
    } else if (removePoster === 'true' || removePoster === true) {
      // Удаляем изображение если запрошено
      if (note.poster) {
        await deleteImageAllSizes(note.poster);
      }
      posterPath = null;
    }

    const updatedNote = await prisma.note.update({
      where: { id: Number(id) },
      data: {
        title,
        text,
        importance: importance ? Number(importance) : undefined,
        isContent: isContent !== undefined ? (isContent === 'true' || isContent === true) : undefined,
        price: price ? Number(price) : undefined,
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

    // Возвращаем note с путями ко всем размерам
    const noteWithPoster = {
      ...updatedNote,
      poster: getPosterPath(updatedNote.poster, 'medium'),
      posterAll: getAllPosterPaths(updatedNote.poster),
    };

    res.json({
      success: true,
      data: noteWithPoster,
      message: 'Note updated successfully',
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update note',
    });
  }
};

export const deleteNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const note = await prisma.note.findUnique({
      where: { id: Number(id) },
    });

    if (!note) {
      res.status(404).json({
        success: false,
        error: 'Note not found',
      });
      return;
    }

    const isOwner = note.userId === userId;
    const isAdminOrMod = req.user?.status === 'ADMIN' || req.user?.status === 'MODERATOR';
    if (!isOwner && !isAdminOrMod) {
      res.status(403).json({
        success: false,
        error: 'You can only delete your own notes',
      });
      return;
    }

    // Удаляем изображение при удалении записи
    if (note.poster) {
      await deleteImageAllSizes(note.poster);
    }

    await prisma.note.delete({
      where: { id: Number(id) },
    });

    res.json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete note',
    });
  }
};

export const buyNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const note = await prisma.note.findFirst({
      where: {
        id: Number(id),
        isContent: true,
      },
    });

    if (!note) {
      res.status(404).json({
        success: false,
        error: 'Note not found',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.tokens < note.price) {
      res.status(400).json({
        success: false,
        error: 'Insufficient tokens',
      });
      return;
    }

    // TODO: Создать запись о покупке
    // await prisma.purchase.create({
    //   data: {
    //     userId,
    //     noteId: note.id,
    //     price: note.price,
    //   },
    // });

    // Списываем токены
    await prisma.user.update({
      where: { id: userId },
      data: {
        tokens: user.tokens - note.price,
      },
    });

    res.json({
      success: true,
      message: 'Note purchased successfully',
      data: {
        remainingTokens: user.tokens - note.price,
      },
    });
  } catch (error) {
    console.error('Buy note error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to purchase note',
    });
  }
}; 