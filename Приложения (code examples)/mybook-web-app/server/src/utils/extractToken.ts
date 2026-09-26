import type { Request } from 'express';
import { AUTH_COOKIE_NAME } from './authCookie.js';

export function extractToken(req: Request): string | null {
  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
  if (cookieToken && typeof cookieToken === 'string') {
    return cookieToken;
  }

  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.split(' ')[1];
  return bearerToken || null;
}
