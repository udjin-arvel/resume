import type { Request, Response } from 'express';
import { prisma } from '../../config/database.js';

export const getDashboard = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      users,
      stories,
      notions,
      notes,
      loreItems,
      compositions,
      reports,
      mistakes,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.story.count(),
      prisma.notion.count(),
      prisma.note.count(),
      prisma.loreItem.count(),
      prisma.composition.count(),
      prisma.report.count(),
      prisma.mistake.count(),
    ]);

    res.json({
      success: true,
      data: {
        users,
        stories,
        notions,
        notes,
        loreItems,
        compositions,
        reports,
        mistakes,
      },
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ success: false, error: 'Failed to load dashboard' });
  }
};
