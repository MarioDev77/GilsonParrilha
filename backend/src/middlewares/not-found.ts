import type { RequestHandler } from 'express';
import { AppError } from '../errors/app-error';

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(AppError.notFound('Rota não encontrada'));
};
