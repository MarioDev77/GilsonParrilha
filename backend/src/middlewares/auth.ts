import type { RequestHandler } from 'express';
import { AppError } from '../errors/app-error';
import { authService } from '../services/auth.service';
import { asyncHandler } from '../utils/async-handler';
import { safeEqual, sha256Hex } from '../utils/crypto';
import type { AdminRoleName } from '../types/auth';

export const SESSION_COOKIE = 'gp_session';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Autenticação SEMPRE validada no servidor, a cada requisição, contra a sessão no banco.
export const requireAuth: RequestHandler = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (typeof token !== 'string' || token.length < 20 || token.length > 200) {
    throw AppError.unauthenticated();
  }
  const { admin, session } = await authService.validateSession(token);
  req.admin = admin;
  req.adminSession = session;
  next();
});

// CSRF: exige o header X-CSRF-Token em toda operação que altera dados.
export const requireCsrf: RequestHandler = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();
  const header = req.get('x-csrf-token');
  const stored = req.adminSession?.csrfTokenHash;
  if (!header || header.length > 200 || !stored || !safeEqual(sha256Hex(header), stored)) {
    return next(new AppError(403, 'CSRF_INVALID', 'Token CSRF inválido'));
  }
  next();
};

// Autorização por função (a função vem da sessão no servidor, nunca do navegador).
export const requireRole =
  (...roles: AdminRoleName[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.admin || !roles.includes(req.admin.role)) return next(AppError.forbidden());
    next();
  };
