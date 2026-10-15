import type { Request, Response } from 'express';
import { prisma } from '../../config/database.js';
import type { CompositionType } from '@prisma/client';

const compositionInclude = {
  user: { select: { id: true, login: true, status: true } },
  stories: { select: { id: true, title: true, chapter: true, type: true } },
};

export const getCompositions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, title, type, isPublic } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: Record<string, unknown> = {};
    if (title) where.title = { contains: String(title), mode: 'insensitive' };
    if (type) where.type = type;
    if (isPublic !== undefined) where.isPublic = isPublic === 'true';

    const [compositions, total] = await Promise.all([
      prisma.composition.findMany({ where, skip, take: Number(limit), include: compositionInclude, orderBy: { createdAt: 'desc' } }),
      prisma.composition.count({ where }),
    ]);

    res.json({
      success: true,
      data: { compositions, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get compositions' });
  }
};

export const getCompositionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const composition = await prisma.composition.findUnique({ where: { id: Number(req.params.id) }, include: compositionInclude });
    if (!composition) { res.status(404).json({ success: false, error: 'Composition not found' }); return; }
    res.json({ success: true, data: composition });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get composition' });
  }
};

export const createComposition = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, type, parentId, isPublic, userId } = req.body;
    const ownerId = userId ? Number(userId) : req.user!.id;

    const composition = await prisma.composition.create({
      data: {
        title,
        description,
        type: type as CompositionType,
        parentId: parentId ? Number(parentId) : undefined,
        isPublic: isPublic ?? true,
        userId: ownerId,
      },
      include: compositionInclude,
    });
    res.status(201).json({ success: true, data: composition });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create composition' });
  }
};

export const updateComposition = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { title, description, type, parentId, isPublic, userId } = req.body;

    const existing = await prisma.composition.findUnique({ where: { id } });
    if (!existing) { res.status(404).json({ success: false, error: 'Composition not found' }); return; }

    const composition = await prisma.composition.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(parentId !== undefined && { parentId: parentId ? Number(parentId) : null }),
        ...(isPublic !== undefined && { isPublic }),
        ...(userId !== undefined && { userId: Number(userId) }),
      },
      include: compositionInclude,
    });
    res.json({ success: true, data: composition });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update composition' });
  }
};

export const deleteComposition = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.composition.findUnique({ where: { id } });
    if (!existing) { res.status(404).json({ success: false, error: 'Composition not found' }); return; }
    await prisma.composition.delete({ where: { id } });
    res.json({ success: true, message: 'Composition deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete composition' });
  }
};
