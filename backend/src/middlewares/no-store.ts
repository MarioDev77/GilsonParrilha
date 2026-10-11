import type { RequestHandler } from 'express';

// Respostas com dados de pedido nunca devem ficar em cache de navegador/CDN/proxy.
export const noStore: RequestHandler = (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
};
