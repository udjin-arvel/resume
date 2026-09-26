import type { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { generateToken, hashPassword, comparePassword } from '../middleware/auth.js';
import { setAuthCookie, clearAuthCookie } from '../utils/authCookie.js';
import { userPublicSelect } from '../utils/userSelect.js';
import { saveAvatar, deleteAvatar } from '../utils/upload.js';
import type { UserCreateInput, LoginInput, UserResponse } from '../types/index.js';
import { UserStatus } from '@prisma/client';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { login, email, password, info }: UserCreateInput = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ login }, { email }],
      },
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'User with this login or email already exists',
      });
      return;
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        login,
        email,
        password: hashedPassword,
        status: UserStatus.READER,
        info: info ?? null,
        level: 1,
        experience: 0,
        tokens: 0,
      },
      select: userPublicSelect,
    });

    const token = generateToken({
      userId: user.id,
      login: user.login,
      status: user.status,
    });

    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      data: { user: user as UserResponse },
      message: 'User registered successfully',
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { login, password }: LoginInput = req.body;

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ login }, { email: login }],
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
      return;
    }

    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
      return;
    }

    const token = generateToken({
      userId: user.id,
      login: user.login,
      status: user.status,
    });

    const userResponse: UserResponse = {
      id: user.id,
      login: user.login,
      status: user.status,
      email: user.email,
      info: user.info,
      avatar: user.avatar,
      level: user.level,
      experience: user.experience,
      tokens: user.tokens,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    setAuthCookie(res, token);

    res.json({
      success: true,
      data: { user: userResponse },
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  clearAuthCookie(res);
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userPublicSelect,
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile',
    });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { login, email, info } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (login || email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            ...(login ? [{ login }] : []),
            ...(email ? [{ email }] : []),
          ],
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        res.status(400).json({
          success: false,
          error: 'Login or email already taken',
        });
        return;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(login && { login }),
        ...(email && { email }),
        ...(info !== undefined && { info }),
      },
      select: userPublicSelect,
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
    });
  }
};

export const getUserStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const [stories, comments, achievements, corrections] = await Promise.all([
      prisma.story.count({ where: { userId } }),
      prisma.comment.count({ where: { userId } }),
      prisma.achievement.count({ where: { userId } }),
      prisma.correction.count({ where: { userId } }),
    ]);

    res.json({
      success: true,
      data: {
        stories,
        comments,
        achievements,
        corrections,
      },
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user stats',
    });
  }
};

export const getUserAchievements = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const achievements = await prisma.achievement.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: achievements,
    });
  } catch (error) {
    console.error('Get user achievements error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user achievements',
    });
  }
};

export const uploadAvatar = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const file = req.file;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!file) {
      res.status(400).json({
        success: false,
        error: 'Avatar image is required',
      });
      return;
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    if (!currentUser) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    if (currentUser.avatar) {
      await deleteAvatar(currentUser.avatar);
    }

    const avatarPath = await saveAvatar(file, userId);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarPath },
      select: userPublicSelect,
    });

    res.json({
      success: true,
      data: {
        avatar: avatarPath,
        user: updatedUser,
      },
      message: 'Avatar updated successfully',
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload avatar',
    });
  }
};
