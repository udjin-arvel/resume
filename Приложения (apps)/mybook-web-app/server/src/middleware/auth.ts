import type { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import type { JWTPayload, UserResponse } from '../types/index.js';
import { extractToken } from '../utils/extractToken.js';
import { userPublicSelect } from '../utils/userSelect.js';

// Расширяем Express Request для добавления user
declare global {
  namespace Express {
    interface Request {
      user?: UserResponse;
    }
  }
}

export const generateToken = (payload: JWTPayload): string => {
  const secret = process.env.JWT_SECRET || 'fallback-secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    return jwt.verify(token, secret) as JWTPayload;
  } catch (error) {
    return null;
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const authenticateToken: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({ success: false, error: 'Access token required' });
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      res.status(401).json({ success: false, error: 'Invalid token' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: userPublicSelect,
    });

    if (!user) {
      res.status(401).json({ success: false, error: 'User not found' });
      return;
    }

    req.user = user as UserResponse;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
};

export const requireAuth: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }
  next();
};

// Опциональная аутентификация - не требует токен, но если есть - прикрепляет user
export const optionalAuthenticateToken: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      next();
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      // Невалидный токен - продолжаем без авторизации
      next();
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: userPublicSelect,
    });

    if (user) {
      req.user = user as UserResponse;
    }
    
    next();
  } catch (error) {
    // В случае ошибки - продолжаем без авторизации
    next();
  }
};

export const requireRole = (roles: string[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.status)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole(['ADMIN']);
export const requireModerator = requireRole(['ADMIN', 'MODERATOR']);
export const requireWriter = requireRole(['ADMIN', 'MODERATOR', 'WRITER']); 