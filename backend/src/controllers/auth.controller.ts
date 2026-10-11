import type { CookieOptions, RequestHandler } from 'express';
import { env } from '../config/env';
import { SESSION_COOKIE } from '../middlewares/auth';
import { authService } from '../services/auth.service';
import { asyncHandler } from '../utils/async-handler';
import { deriveCsrfToken } from '../utils/crypto';
import { AppError } from '../errors/app-error';

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.COOKIE_SAMESITE,
    domain: env.COOKIE_DOMAIN,
    path: '/',
  };
}

export const login: RequestHandler = asyncHandler(async (req, res) => {
  const { admin, sessionToken, csrfToken, expiresAt } = await authService.login({
    email: req.body.email,
    password: req.body.password,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.cookie(SESSION_COOKIE, sessionToken, { ...cookieOptions(), expires: expiresAt });
  res.setHeader('Cache-Control', 'no-store');
  res.json({ data: { admin, csrfToken } });
});

export const logout: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.admin || !req.adminSession) throw AppError.unauthenticated();
  await authService.logout({ sessionId: req.adminSession.id, adminId: req.admin.id, ip: req.ip });
  res.clearCookie(SESSION_COOKIE, cookieOptions());
  res.setHeader('Cache-Control', 'no-store');
  res.status(204).end();
});

export const me: RequestHandler = (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE] as string;
  res.setHeader('Cache-Control', 'no-store');
  res.json({ data: { admin: req.admin, csrfToken: deriveCsrfToken(token) } });
};
