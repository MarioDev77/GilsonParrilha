import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';

// Valida e SUBSTITUI o corpo pelo resultado do Zod (só passam os campos declarados).
export const validateBody =
  (schema: ZodTypeAny): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) return next(result.error);
    req.body = result.data;
    next();
  };
