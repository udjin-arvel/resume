import type { Request, Response } from 'express';
import { prisma } from '../../config/database.js';
import { hashPassword } from '../../middleware/auth.js';
import type { UserUpdateInput } from '../../types/index.js';
import { UserStatus } from '@prisma/client';

const userSelect = {
  id: true,
  login: true,
  status: true,
  email: true,
  info: true,
  avatar: true,
  level: true,
  experience: true,
  tokens: true,
  createdAt: true,
  updatedAt: true,
};

export const getUserOptions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, login: true },
      orderBy: { login: 'asc' },
    });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get users' });
  }
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status as UserStatus;
    }

    if (search) {
      where.OR = [
        { login: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: userSelect,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ success: false, error: 'Failed to get users' });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
      select: userSelect,
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Admin get user error:', error);
    res.status(500).json({ success: false, error: 'Failed to get user' });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = Number(req.params.id);
    const { login, email, info, status, level, experience, tokens, password }: UserUpdateInput & { password?: string } = req.body;

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    if (login || email) {
      const conflict = await prisma.user.findFirst({
        where: {
          OR: [
            ...(login ? [{ login }] : []),
            ...(email ? [{ email }] : []),
          ],
          NOT: { id: userId },
        },
      });

      if (conflict) {
        res.status(400).json({ success: false, error: 'Login or email already taken' });
        return;
      }
    }

    const data: Record<string, unknown> = {};
    if (login !== undefined) data.login = login;
    if (email !== undefined) data.email = email;
    if (info !== undefined) data.info = info;
    if (status !== undefined) data.status = status;
    if (level !== undefined) data.level = Number(level);
    if (experience !== undefined) data.experience = Number(experience);
    if (tokens !== undefined) data.tokens = Number(tokens);
    if (password) data.password = await hashPassword(password);

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: userSelect,
    });

    res.json({ success: true, data: user, message: 'User updated successfully' });
  } catch (error) {
    console.error('Admin update user error:', error);
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = Number(req.params.id);

    if (userId === req.user?.id) {
      res.status(400).json({ success: false, error: 'Cannot delete your own account' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    await prisma.user.delete({ where: { id: userId } });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
};
