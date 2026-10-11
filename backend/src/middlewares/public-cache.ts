import type { RequestHandler } from 'express';

// Cache curto para o cardápio público (alivia o banco sem deixar preços velhos por muito tempo).
export const publicCache =
  (seconds: number): RequestHandler =>
  (_req, res, next) => {
    res.setHeader('Cache-Control', `public, max-age=${seconds}, stale-while-revalidate=${seconds * 2}`);
    next();
  };
