import type { RequestHandler } from 'express';
import { env } from '../config/env';
import { AppError } from '../errors/app-error';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Defesa em profundidade contra CSRF: requisições que alteram dados vindas de um navegador
// com Origin fora da lista autorizada são recusadas. (Chamadas sem Origin = não-navegador.)
export const enforceOrigin: RequestHandler = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();
  const origin = req.headers.origin;
  if (origin && !env.FRONTEND_ORIGINS.includes(origin)) {
    return next(AppError.forbidden('Origem não autorizada'));
  }
  next();
};
