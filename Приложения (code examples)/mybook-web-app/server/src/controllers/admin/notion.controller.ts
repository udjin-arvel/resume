import type { Request, Response } from 'express';
import { prisma } from '../../config/database.js';
import type { NotionType } from '@prisma/client';

const notionInclude = {
  user: { select: { id: true, login: true, status: true } },
  images: true,
};

export const getNotions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, title, type, isPublic } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: Record<string, unknown> = {};
    if (title) where.title = { contains: String(title), mode: 'insensitive' };
    if (type) where.type = type;
    if (isPublic !== undefined) where.isPublic = isPublic === 'true';

    const [notions, total] = await Promise.all([
      prisma.notion.findMany({ where, skip, take: Number(limit), include: notionInclude, orderBy: { createdAt: 'desc' } }),
      prisma.notion.count({ where }),
    ]);

    res.json({
      success: true,
      data: { notions, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } },
    });
  } catch (error) {
    console.error('Admin get notions error:', error);
    res.status(500).json({ success: false, error: 'Failed to get notions' });
  }
};

export const getNotionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const notion = await prisma.notion.findUnique({ where: { id: Number(req.params.id) }, include: notionInclude });
    if (!notion) { res.status(404).json({ success: false, error: 'Notion not found' }); return; }
    res.json({ success: true, data: notion });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get notion' });
  }
};

export const createNotion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, text, type, accessLevel, isPublic, userId } = req.body;
    const ownerId = userId ? Number(userId) : req.user!.id;

    const notion = await prisma.notion.create({
      data: { title, text, type: type as NotionType, accessLevel: accessLevel ?? 1, isPublic: isPublic ?? true, userId: ownerId },
      include: notionInclude,
    });
    res.status(201).json({ success: true, data: notion });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create notion' });
  }
};

export const updateNotion = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { title, text, type, accessLevel, isPublic, userId } = req.body;

    const existing = await prisma.notion.findUnique({ where: { id } });
    if (!existing) { res.status(404).json({ success: false, error: 'Notion not found' }); return; }

    const notion = await prisma.notion.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(text !== undefined && { text }),
        ...(type !== undefined && { type }),
        ...(accessLevel !== undefined && { accessLevel }),
        ...(isPublic !== undefined && { isPublic }),
        ...(userId !== undefined && { userId: Number(userId) }),
      },
      include: notionInclude,
    });
    res.json({ success: true, data: notion });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update notion' });
  }
};

export const deleteNotion = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.notion.findUnique({ where: { id } });
    if (!existing) { res.status(404).json({ success: false, error: 'Notion not found' }); return; }
    await prisma.notion.delete({ where: { id } });
    res.json({ success: true, message: 'Notion deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete notion' });
  }
};
