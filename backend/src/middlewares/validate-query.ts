import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';

// Valida req.query; o resultado tipado fica em res.locals.query (parâmetros desconhecidos são descartados).
export const validateQuery =
  (schema: ZodTypeAny): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) return next(result.error);
    res.locals.query = result.data;
    next();
  };
