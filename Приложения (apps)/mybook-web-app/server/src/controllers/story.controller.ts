import type { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { addExperience, getContentReward, checkAccessLevel } from '../utils/experience.js';
import type { StoryCreateInput, StoryUpdateInput, StoryQuery, PaginatedResponse } from '../types/index.js';
import { StoryType } from '@prisma/client';
import { syncStoryFragments } from '../utils/fragmentSync.js';

const storyFragmentsInclude = {
  orderBy: { order: 'asc' as const },
  include: {
    images: true,
    audios: true,
  },
};

export const createStory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const storyData: StoryCreateInput = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!storyData.fragments || !Array.isArray(storyData.fragments) || storyData.fragments.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Fragments are required',
      });
      return;
    }

    const story = await prisma.story.create({
      data: {
        title: storyData.title,
        type: storyData.type,
        chapter: storyData.chapter,
        accessLevel: storyData.accessLevel,
        epigraph: storyData.epigraph,
        isPublic: storyData.isPublic,
        compositionId: storyData.compositionId,
        userId,
        notes: storyData.notes ? JSON.stringify(storyData.notes) : undefined,
        fragments: {
          create: storyData.fragments.map((fragment) => ({
            order: fragment.order,
            text: fragment.text,
            authorNote: fragment.authorNote?.trim() || null,
          })),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            login: true,
            status: true,
          },
        },
        composition: {
          select: {
            id: true,
            title: true,
          },
        },
        fragments: storyFragmentsInclude,
      },
    });

    // Добавляем опыт за создание истории
    const experienceReward = getContentReward(storyData.type === StoryType.STORY ? 'STORY' : 'ANNOUNCEMENT');
    await addExperience(userId, experienceReward);

    res.status(201).json({
      success: true,
      data: story,
      message: 'Story created successfully',
    });
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create story',
    });
  }
};

export const getStories = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const {
      page = 1,
      limit = 10,
      compositionId,
      type,
      title,
      accessLevel,
      isPublic = true,
    }: StoryQuery = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;

    const where: any = {
      isPublic: String(isPublic) === 'true',
    };

    if (title) {
      where.title = {
        contains: String(title),
        mode: 'insensitive',
      };
    }

    if (compositionId) {
      where.compositionId = Number(compositionId);
    }

    if (type) {
      where.type = type;
    }

    if (accessLevel) {
      where.accessLevel = Number(accessLevel);
    }

    // Если пользователь не авторизован или его уровень недостаточен, показываем только доступный контент
    if (!user || user.level < (Number(accessLevel) || 1)) {
      where.accessLevel = { lte: user?.level || 1 };
    }

    const [stories, total] = await Promise.all([
      prisma.story.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              login: true,
              status: true,
            },
          },
          composition: {
            select: {
              id: true,
              title: true,
            },
          },
          fragments: {
            orderBy: { order: 'asc' },
            take: 1,
            select: {
              text: true,
            },
          },
          _count: {
            select: {
              fragments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.story.count({ where }),
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    // Добавляем text из первого фрагмента с троеточием
    const storiesWithText = stories.map((story) => {
      const firstFragment = story.fragments[0];
      const text = firstFragment?.text
        ? firstFragment.text.length > 750
          ? firstFragment.text.substring(0, 750) + '...'
          : firstFragment.text + '...'
        : null;
      
      // Удаляем fragments из ответа, оставляем только text
      const { fragments, ...storyWithoutFragments } = story;
      return {
        ...storyWithoutFragments,
        text,
      };
    });

    const response = {
      data: storiesWithText,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages,
      },
    };

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stories',
    });
  }
};

export const getStoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const storyId = Number(req.params.id);

    const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;

    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        user: {
          select: {
            id: true,
            login: true,
            status: true,
          },
        },
        composition: {
          select: {
            id: true,
            title: true,
          },
        },
        fragments: {
          orderBy: { order: 'asc' },
          include: {
            images: true,
            audios: true,
          },
        },
        _count: {
          select: {
            fragments: true,
          },
        },
      },
    });

    if (!story) {
      res.status(404).json({
        success: false,
        error: 'Story not found',
      });
      return;
    }

    // Проверяем доступ
    if (!story.isPublic && (!user || story.userId !== user.id)) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    if (!checkAccessLevel(user?.level || 1, story.accessLevel)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient level to access this story',
      });
      return;
    }

    res.json({
      success: true,
      data: story,
    });
  } catch (error) {
    console.error('Get story error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get story',
    });
  }
};

export const updateStory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const storyId = Number(req.params.id);
    const updateData: StoryUpdateInput = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!updateData.fragments || !Array.isArray(updateData.fragments) || updateData.fragments.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Fragments are required',
      });
      return;
    }

    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      res.status(404).json({
        success: false,
        error: 'Story not found',
      });
      return;
    }

    const isOwner = story.userId === userId;
    const isAdminOrMod = req.user?.status === 'ADMIN' || req.user?.status === 'MODERATOR';

    if (!isOwner && !isAdminOrMod) {
      res.status(403).json({
        success: false,
        error: 'You can only update your own stories',
      });
      return;
    }

    // Обновляем историю и фрагменты в транзакции
    const updatedStory = await prisma.$transaction(async (tx) => {
      // Обновляем основные данные истории
      const updated = await tx.story.update({
        where: { id: storyId },
        data: {
          title: updateData.title,
          type: updateData.type,
          chapter: updateData.chapter,
          accessLevel: updateData.accessLevel,
          epigraph: updateData.epigraph,
          isPublic: updateData.isPublic,
          compositionId: updateData.compositionId,
          notes: updateData.notes ? JSON.stringify(updateData.notes) : undefined,
        },
      });

      await syncStoryFragments(tx, storyId, updateData.fragments);

      return tx.story.findUnique({
        where: { id: storyId },
        include: {
          user: {
            select: {
              id: true,
              login: true,
              status: true,
            },
          },
          composition: {
            select: {
              id: true,
              title: true,
            },
          },
          fragments: storyFragmentsInclude,
        },
      });
    });

    res.json({
      success: true,
      data: updatedStory,
      message: 'Story updated successfully',
    });
  } catch (error) {
    console.error('Update story error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update story',
    });
  }
};

export const deleteStory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const storyId = Number(req.params.id);

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      res.status(404).json({
        success: false,
        error: 'Story not found',
      });
      return;
    }

    const isOwner = story.userId === userId;
    const isAdminOrMod = req.user?.status === 'ADMIN' || req.user?.status === 'MODERATOR';

    if (!isOwner && !isAdminOrMod) {
      res.status(403).json({
        success: false,
        error: 'You can only delete your own stories',
      });
      return;
    }

    await prisma.story.delete({
      where: { id: storyId },
    });

    res.json({
      success: true,
      message: 'Story deleted successfully',
    });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete story',
    });
  }
}; 