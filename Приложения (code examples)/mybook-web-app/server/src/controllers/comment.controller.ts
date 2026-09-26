import type { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import type { ContentType } from '@prisma/client';
import { addExperience, EXPERIENCE_REWARDS } from '../utils/experience.js';

const VALID_CONTENT_TYPES: ContentType[] = ['STORY', 'NOTION', 'LORE', 'COMPOSITION'];

// Проверка существования контента
const contentExists = async (contentId: number, contentType: ContentType): Promise<boolean> => {
  switch (contentType) {
    case 'STORY':
      return !!(await prisma.story.findUnique({ where: { id: contentId } }));
    case 'NOTION':
      return !!(await prisma.notion.findUnique({ where: { id: contentId } }));
    case 'LORE':
      return !!(await prisma.loreItem.findUnique({ where: { id: contentId } }));
    case 'COMPOSITION':
      return !!(await prisma.composition.findUnique({ where: { id: contentId } }));
    default:
      return false;
  }
};

export const createComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, contentId, contentType } = req.body;
    const userId = req.user!.id;

    if (!text || !contentId || !contentType) {
      res.status(400).json({
        success: false,
        error: 'text, contentId and contentType are required',
      });
      return;
    }

    if (!VALID_CONTENT_TYPES.includes(contentType)) {
      res.status(400).json({
        success: false,
        error: `Invalid contentType. Must be one of: ${VALID_CONTENT_TYPES.join(', ')}`,
      });
      return;
    }

    // Проверяем существование контента
    const exists = await contentExists(Number(contentId), contentType as ContentType);
    if (!exists) {
      res.status(404).json({
        success: false,
        error: 'Content not found',
      });
      return;
    }

    const comment = await prisma.comment.create({
      data: {
        text,
        contentId: Number(contentId),
        contentType: contentType as ContentType,
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

    // Добавляем опыт за комментарий
    await addExperience(userId, EXPERIENCE_REWARDS.COMMENT);

    res.status(201).json({
      success: true,
      data: comment,
      message: 'Comment created successfully',
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create comment',
    });
  }
};

export const getCommentsByContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentId, contentType } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    if (!VALID_CONTENT_TYPES.includes(contentType as ContentType)) {
      res.status(400).json({
        success: false,
        error: `Invalid contentType. Must be one of: ${VALID_CONTENT_TYPES.join(', ')}`,
      });
      return;
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          contentId: Number(contentId),
          contentType: contentType as ContentType,
        },
        include: {
          user: {
            select: {
              id: true,
              login: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.comment.count({
        where: {
          contentId: Number(contentId),
          contentType: contentType as ContentType,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get comments',
    });
  }
};

export const getCommentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id: Number(id) },
      include: {
        user: {
          select: {
            id: true,
            login: true,
          },
        },
      },
    });

    if (!comment) {
      res.status(404).json({
        success: false,
        error: 'Comment not found',
      });
      return;
    }

    res.json({
      success: true,
      data: comment,
    });
  } catch (error) {
    console.error('Get comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get comment',
    });
  }
};

export const updateComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user!.id;

    const comment = await prisma.comment.findUnique({
      where: { id: Number(id) },
    });

    if (!comment) {
      res.status(404).json({
        success: false,
        error: 'Comment not found',
      });
      return;
    }

    // Проверяем, что пользователь владелец комментария
    if (comment.userId !== userId) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    const updatedComment = await prisma.comment.update({
      where: { id: Number(id) },
      data: { text },
      include: {
        user: {
          select: {
            id: true,
            login: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedComment,
      message: 'Comment updated successfully',
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update comment',
    });
  }
};

export const deleteComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userStatus = req.user!.status;

    const comment = await prisma.comment.findUnique({
      where: { id: Number(id) },
    });

    if (!comment) {
      res.status(404).json({
        success: false,
        error: 'Comment not found',
      });
      return;
    }

    // Проверяем, что пользователь владелец или админ/модератор
    const isOwner = comment.userId === userId;
    const isAdminOrMod = userStatus === 'ADMIN' || userStatus === 'MODERATOR';

    if (!isOwner && !isAdminOrMod) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    await prisma.comment.delete({
      where: { id: Number(id) },
    });

    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete comment',
    });
  }
};

export const getUserComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              login: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.comment.count({ where: { userId } }),
    ]);

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get user comments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user comments',
    });
  }
};
