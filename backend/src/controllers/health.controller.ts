import type { RequestHandler } from 'express';
import { healthService } from '../services/health.service';

export const health: RequestHandler = (_req, res) => {
  res.json({ status: 'ok' });
};

export const ready: RequestHandler = async (_req, res) => {
  const database = await healthService.checkDatabase();
  // Só informa up/down — sem host, usuário ou mensagem de erro do banco.
  res.status(database ? 200 : 503).json({
    status: database ? 'ready' : 'unavailable',
    checks: { database: database ? 'up' : 'down' },
  });
};
