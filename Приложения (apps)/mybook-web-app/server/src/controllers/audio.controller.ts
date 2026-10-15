import type { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { saveAudioFile, deleteAudioFile } from '../utils/upload.js';

/**
 * Добавление аудио к фрагменту
 */
export const addAudioToContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentType, contentId } = req.params;
    const { title } = req.body;
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
      res.status(400).json({
        success: false,
        error: 'No audio file provided',
      });
      return;
    }

    if (contentType !== 'fragment') {
      res.status(400).json({
        success: false,
        error: 'Invalid content type. Must be: fragment',
      });
      return;
    }

    const id = Number(contentId);
    const fragment = await prisma.fragment.findFirst({
      where: { id },
      include: {
        story: true,
        audios: true,
      },
    });

    if (!fragment || fragment.story.userId !== userId) {
      res.status(404).json({
        success: false,
        error: 'Content not found or access denied',
      });
      return;
    }

    for (const existingAudio of fragment.audios) {
      if (existingAudio.path) {
        await deleteAudioFile(existingAudio.path);
      }
      await prisma.audio.delete({ where: { id: existingAudio.id } });
    }

    const savedPath = await saveAudioFile(file, 'audio', `fragment-${contentId}`);

    const audio = await prisma.audio.create({
      data: {
        path: savedPath,
        title: title || null,
        userId,
        fragmentId: id,
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

    res.status(201).json({
      success: true,
      data: audio,
      message: 'Audio uploaded successfully',
    });
  } catch (error) {
    console.error('Add audio error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload audio',
    });
  }
};

/**
 * Получение аудио для фрагмента
 */
export const getContentAudios = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentType, contentId } = req.params;

    if (contentType !== 'fragment') {
      res.status(400).json({
        success: false,
        error: 'Invalid content type',
      });
      return;
    }

    const audios = await prisma.audio.findMany({
      where: { fragmentId: Number(contentId) },
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

    res.json({
      success: true,
      data: audios,
    });
  } catch (error) {
    console.error('Get content audios error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get audios',
    });
  }
};

/**
 * Удаление аудио
 */
export const deleteAudio = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userStatus = req.user!.status;

    const audio = await prisma.audio.findUnique({
      where: { id: Number(id) },
    });

    if (!audio) {
      res.status(404).json({
        success: false,
        error: 'Audio not found',
      });
      return;
    }

    const isOwner = audio.userId === userId;
    const isModeratorOrAdmin = userStatus === 'ADMIN' || userStatus === 'MODERATOR';

    if (!isOwner && !isModeratorOrAdmin) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    if (audio.path) {
      await deleteAudioFile(audio.path);
    }

    await prisma.audio.delete({
      where: { id: Number(id) },
    });

    res.json({
      success: true,
      message: 'Audio deleted successfully',
    });
  } catch (error) {
    console.error('Delete audio error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete audio',
    });
  }
};
