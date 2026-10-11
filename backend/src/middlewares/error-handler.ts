import type { ErrorRequestHandler, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error';
import { logger } from '../config/logger';

interface ErrorBody {
  error: { code: string; message: string; details?: unknown };
}

function send(res: Response, status: number, body: ErrorBody) {
  res.status(status).json(body);
}

// Tratamento centralizado: nenhuma mensagem interna, stack ou SQL vai para o cliente.
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err instanceof AppError) {
    return send(res, err.statusCode, {
      error: { code: err.code, message: err.message, ...(err.details !== undefined && { details: err.details }) },
    });
  }

  if (err instanceof ZodError) {
    return send(res, 400, {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dados inválidos',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    });
  }

  // Erros do body-parser (JSON malformado, corpo grande demais, etc.)
  const e = err as { type?: string };
  if (e?.type === 'entity.parse.failed') {
    return send(res, 400, { error: { code: 'BAD_REQUEST', message: 'JSON inválido' } });
  }
  if (e?.type === 'entity.too.large') {
    return send(res, 413, { error: { code: 'PAYLOAD_TOO_LARGE', message: 'Corpo da requisição grande demais' } });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return send(res, 409, { error: { code: 'CONFLICT', message: 'Registro já existe' } });
    }
    if (err.code === 'P2025') {
      return send(res, 404, { error: { code: 'NOT_FOUND', message: 'Recurso não encontrado' } });
    }
    if (err.code === 'P2003') {
      return send(res, 409, { error: { code: 'CONFLICT', message: 'Operação viola um vínculo existente' } });
    }
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    logger.error({ err: err.message, requestId: (req as { id?: string }).id }, 'Falha ao conectar no banco');
    return send(res, 503, { error: { code: 'SERVICE_UNAVAILABLE', message: 'Serviço temporariamente indisponível' } });
  }

  logger.error(
    { err, requestId: (req as { id?: string }).id, method: req.method, path: req.path },
    'Erro não tratado',
  );
  return send(res, 500, { error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' } });
};
