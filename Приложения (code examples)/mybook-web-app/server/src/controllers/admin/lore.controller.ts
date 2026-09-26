import type { Request, Response } from 'express';
import { prisma } from '../../config/database.js';

const loreInclude = {
  user: { select: { id: true, login: true, status: true } },
  images: true,
};

export const getLoreItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, title, isPublic } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: Record<string, unknown> = {};
    if (title) where.title = { contains: String(title), mode: 'insensitive' };
    if (isPublic !== undefined) where.isPublic = isPublic === 'true';

    const [loreItems, total] = await Promise.all([
      prisma.loreItem.findMany({ where, skip, take: Number(limit), include: loreInclude, orderBy: { createdAt: 'desc' } }),
      prisma.loreItem.count({ where }),
    ]);

    res.json({
      success: true,
      data: { loreItems, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get lore items' });
  }
};

export const getLoreItemById = async (req: Request, res: Response): Promise<void> => {
  try {
    const loreItem = await prisma.loreItem.findUnique({ where: { id: Number(req.params.id) }, include: loreInclude });
    if (!loreItem) { res.status(404).json({ success: false, error: 'Lore item not found' }); return; }
    res.json({ success: true, data: loreItem });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get lore item' });
  }
};

export const createLoreItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, text, accessLevel, isPublic, userId } = req.body;
    const ownerId = userId ? Number(userId) : req.user!.id;

    const loreItem = await prisma.loreItem.create({
      data: { title, text, accessLevel: accessLevel ?? 1, isPublic: isPublic ?? true, userId: ownerId },
      include: loreInclude,
    });
    res.status(201).json({ success: true, data: loreItem });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create lore item' });
  }
};

export const updateLoreItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { title, text, accessLevel, isPublic, userId } = req.body;

    const existing = await prisma.loreItem.findUnique({ where: { id } });
    if (!existing) { res.status(404).json({ success: false, error: 'Lore item not found' }); return; }

    const loreItem = await prisma.loreItem.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(text !== undefined && { text }),
        ...(accessLevel !== undefined && { accessLevel }),
        ...(isPublic !== undefined && { isPublic }),
        ...(userId !== undefined && { userId: Number(userId) }),
      },
      include: loreInclude,
    });
    res.json({ success: true, data: loreItem });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update lore item' });
  }
};

export const deleteLoreItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.loreItem.findUnique({ where: { id } });
    if (!existing) { res.status(404).json({ success: false, error: 'Lore item not found' }); return; }
    await prisma.loreItem.delete({ where: { id } });
    res.json({ success: true, message: 'Lore item deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete lore item' });
  }
};
