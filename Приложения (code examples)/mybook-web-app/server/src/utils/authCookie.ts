import type { Response, CookieOptions } from 'express';

export const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'thebook_token';

function parseJwtExpiresInMs(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;

  const value = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 7 * 24 * 60 * 60 * 1000;
  }
}

function getCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  const maxAge = parseJwtExpiresInMs(process.env.JWT_EXPIRES_IN || '7d');

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge,
  };
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE_NAME, token, getCookieOptions());
}

export function clearAuthCookie(res: Response): void {
  const { maxAge, ...options } = getCookieOptions();
  res.clearCookie(AUTH_COOKIE_NAME, options);
}
