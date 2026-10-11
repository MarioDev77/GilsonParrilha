import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env';

interface LimiterOptions {
  windowMs: number;
  limit: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}

// Fábrica reutilizável: cada rota sensível (login, pedidos, uploads) cria o seu.
export function createRateLimiter({ windowMs, limit, message, skipSuccessfulRequests }: LimiterOptions) {
  return rateLimit({
    windowMs,
    limit: env.isTest ? 10_000 : limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: skipSuccessfulRequests ?? false,
    handler: (_req, res) => {
      res.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message: message ?? 'Muitas requisições. Tente novamente em instantes.',
        },
      });
    },
  });
}

// Limite global por IP (rede de proteção geral).
export const globalLimiter = createRateLimiter({ windowMs: 60_000, limit: 300 });

// Criação de pedidos: poucos por IP em janela curta (evita spam e enumeração por tentativa e erro).
export const createOrderLimiter = createRateLimiter({
  windowMs: 10 * 60_000,
  limit: 15,
  message: 'Muitos pedidos em pouco tempo. Aguarde alguns minutos e tente novamente.',
});

// Consulta pública por publicId (identificador aleatório de 144 bits; o limite barra varredura).
export const publicOrderLookupLimiter = createRateLimiter({ windowMs: 60_000, limit: 60 });

// Cotação do carrinho: chamada a cada alteração (com debounce no site), por isso o limite é maior que o dos pedidos.
export const quoteLimiter = createRateLimiter({ windowMs: 60_000, limit: 120 });
