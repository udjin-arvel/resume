import type { Request, Response } from 'express';
import { prisma } from '../../config/database.js';

const noteInclude = {
  user: { select: { id: true, login: true, status: true } },
  images: true,
};

export const getNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, title, isContent, importance } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: Record<string, unknown> = {};
    if (title) where.title = { contains: String(title), mode: 'insensitive' };
    if (isContent !== undefined) where.isContent = isContent === 'true';
    if (importance) where.importance = Number(importance);

    const [notes, total] = await Promise.all([
      prisma.note.findMany({ where, skip, take: Number(limit), include: noteInclude, orderBy: { createdAt: 'desc' } }),
      prisma.note.count({ where }),
    ]);

    res.json({
      success: true,
      data: { notes, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get notes' });
  }
};

export const getNoteById = async (req: Request, res: Response): Promise<void> => {
  try {
    const note = await prisma.note.findUnique({ where: { id: Number(req.params.id) }, include: noteInclude });
    if (!note) { res.status(404).json({ success: false, error: 'Note not found' }); return; }
    res.json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get note' });
  }
};

export const createNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, text, importance, isContent, price, userId } = req.body;
    const ownerId = userId ? Number(userId) : req.user!.id;

    const note = await prisma.note.create({
      data: {
        title,
        text,
        importance: importance ?? 1,
        isContent: isContent ?? false,
        price: price ?? 10,
        userId: ownerId,
      },
      include: noteInclude,
    });
    res.status(201).json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create note' });
  }
};

export const updateNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { title, text, importance, isContent, price, userId } = req.body;

    const existing = await prisma.note.findUnique({ where: { id } });
    if (!existing) { res.status(404).json({ success: false, error: 'Note not found' }); return; }

    const note = await prisma.note.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(text !== undefined && { text }),
        ...(importance !== undefined && { importance }),
        ...(isContent !== undefined && { isContent }),
        ...(price !== undefined && { price }),
        ...(userId !== undefined && { userId: Number(userId) }),
      },
      include: noteInclude,
    });
    res.json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update note' });
  }
};

export const deleteNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.note.findUnique({ where: { id } });
    if (!existing) { res.status(404).json({ success: false, error: 'Note not found' }); return; }
    await prisma.note.delete({ where: { id } });
    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete note' });
  }
};
