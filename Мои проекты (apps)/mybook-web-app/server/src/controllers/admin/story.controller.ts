import type { Request, Response } from 'express';
import { prisma } from '../../config/database.js';
import { addExperience, getContentReward } from '../../utils/experience.js';
import { parseDocxBuffer } from '../../utils/docxParser.js';
import type { StoryCreateInput, StoryUpdateInput } from '../../types/index.js';
import { StoryType } from '@prisma/client';

import { syncStoryFragments } from '../../utils/fragmentSync.js';

const storyInclude = {
  user: { select: { id: true, login: true, status: true } },
  composition: { select: { id: true, title: true } },
  fragments: {
    orderBy: { order: 'asc' as const },
    include: {
      images: true,
      audios: true,
    },
  },
  _count: { select: { fragments: true } },
};

export const getStories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, title, type, isPublic, userId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {};
    if (title) where.title = { contains: String(title), mode: 'insensitive' };
    if (type) where.type = type;
    if (isPublic !== undefined) where.isPublic = isPublic === 'true';
    if (userId) where.userId = Number(userId);

    const [stories, total] = await Promise.all([
      prisma.story.findMany({
        where,
        skip,
        take: Number(limit),
        include: storyInclude,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.story.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        stories,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Admin get stories error:', error);
    res.status(500).json({ success: false, error: 'Failed to get stories' });
  }
};

export const getStoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const story = await prisma.story.findUnique({
      where: { id: Number(req.params.id) },
      include: storyInclude,
    });

    if (!story) {
      res.status(404).json({ success: false, error: 'Story not found' });
      return;
    }

    res.json({ success: true, data: story });
  } catch (error) {
    console.error('Admin get story error:', error);
    res.status(500).json({ success: false, error: 'Failed to get story' });
  }
};

export const createStory = async (req: Request, res: Response): Promise<void> => {
  try {
    const storyData: StoryCreateInput & { userId?: number } = req.body;
    const ownerId = storyData.userId || req.user!.id;

    if (!storyData.fragments?.length) {
      res.status(400).json({ success: false, error: 'Fragments are required' });
      return;
    }

    const owner = await prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner) {
      res.status(400).json({ success: false, error: 'Owner user not found' });
      return;
    }

    const story = await prisma.story.create({
      data: {
        title: storyData.title,
        type: storyData.type,
        chapter: storyData.chapter,
        accessLevel: storyData.accessLevel ?? 1,
        epigraph: storyData.epigraph,
        isPublic: storyData.isPublic ?? true,
        compositionId: storyData.compositionId,
        userId: ownerId,
        notes: storyData.notes ? JSON.stringify(storyData.notes) : undefined,
        fragments: {
          create: storyData.fragments.map((f) => ({
            order: f.order,
            text: f.text,
            authorNote: f.authorNote?.trim() || null,
          })),
        },
      },
      include: storyInclude,
    });

    const reward = getContentReward(storyData.type === StoryType.STORY ? 'STORY' : 'ANNOUNCEMENT');
    await addExperience(ownerId, reward);

    res.status(201).json({ success: true, data: story, message: 'Story created successfully' });
  } catch (error) {
    console.error('Admin create story error:', error);
    res.status(500).json({ success: false, error: 'Failed to create story' });
  }
};

export const updateStory = async (req: Request, res: Response): Promise<void> => {
  try {
    const storyId = Number(req.params.id);
    const updateData: StoryUpdateInput & { userId?: number } = req.body;

    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) {
      res.status(404).json({ success: false, error: 'Story not found' });
      return;
    }

    if (!updateData.fragments?.length) {
      res.status(400).json({ success: false, error: 'Fragments are required' });
      return;
    }

    const updatedStory = await prisma.$transaction(async (tx) => {
      await tx.story.update({
        where: { id: storyId },
        data: {
          title: updateData.title,
          type: updateData.type,
          chapter: updateData.chapter,
          accessLevel: updateData.accessLevel,
          epigraph: updateData.epigraph,
          isPublic: updateData.isPublic,
          compositionId: updateData.compositionId,
          ...(updateData.userId !== undefined && { userId: updateData.userId }),
          notes: updateData.notes ? JSON.stringify(updateData.notes) : undefined,
        },
      });

      await syncStoryFragments(tx, storyId, updateData.fragments);

      return tx.story.findUnique({ where: { id: storyId }, include: storyInclude });
    });

    res.json({ success: true, data: updatedStory, message: 'Story updated successfully' });
  } catch (error) {
    console.error('Admin update story error:', error);
    res.status(500).json({ success: false, error: 'Failed to update story' });
  }
};

export const deleteStory = async (req: Request, res: Response): Promise<void> => {
  try {
    const storyId = Number(req.params.id);
    const story = await prisma.story.findUnique({ where: { id: storyId } });

    if (!story) {
      res.status(404).json({ success: false, error: 'Story not found' });
      return;
    }

    await prisma.story.delete({ where: { id: storyId } });
    res.json({ success: true, message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Admin delete story error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete story' });
  }
};

export const previewDocxImport = async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: 'DOCX file is required' });
      return;
    }

    const result = await parseDocxBuffer(file.buffer, file.originalname);

    if (result.fragments.length === 0) {
      res.status(400).json({ success: false, error: 'Document contains no text' });
      return;
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Admin docx preview error:', error);
    res.status(500).json({ success: false, error: 'Failed to parse DOCX file' });
  }
};

export const importDocxStory = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      type,
      chapter,
      accessLevel,
      epigraph,
      isPublic,
      compositionId,
      userId,
      fragments,
      notes,
    } = req.body;

    const ownerId = userId ? Number(userId) : req.user!.id;

    if (!title || !type || !fragments?.length) {
      res.status(400).json({ success: false, error: 'Title, type and fragments are required' });
      return;
    }

    const owner = await prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner) {
      res.status(400).json({ success: false, error: 'Owner user not found' });
      return;
    }

    const story = await prisma.story.create({
      data: {
        title,
        type: type as StoryType,
        chapter: chapter ? Number(chapter) : undefined,
        accessLevel: accessLevel ? Number(accessLevel) : 1,
        epigraph,
        isPublic: isPublic !== false,
        compositionId: compositionId ? Number(compositionId) : undefined,
        userId: ownerId,
        notes: notes ? JSON.stringify(notes) : undefined,
        fragments: {
          create: fragments.map((f: { order: number; text: string; authorNote?: string }) => ({
            order: f.order,
            text: f.text,
            authorNote: f.authorNote?.trim() || null,
          })),
        },
      },
      include: storyInclude,
    });

    const reward = getContentReward(type === StoryType.STORY ? 'STORY' : 'ANNOUNCEMENT');
    await addExperience(ownerId, reward);

    res.status(201).json({ success: true, data: story, message: 'Story imported successfully' });
  } catch (error) {
    console.error('Admin docx import error:', error);
    res.status(500).json({ success: false, error: 'Failed to import story' });
  }
};
