import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

// Gera sempre um ID próprio (não confia em header do cliente) para correlacionar logs.
export const requestId: RequestHandler = (req, res, next) => {
  const id = randomUUID();
  (req as typeof req & { id: string }).id = id;
  res.setHeader('X-Request-Id', id);
  next();
};
