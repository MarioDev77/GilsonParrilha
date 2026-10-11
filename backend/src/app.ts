import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './config/logger';
import { enforceOrigin } from './middlewares/enforce-origin';
import { requestId } from './middlewares/request-id';
import { globalLimiter } from './middlewares/rate-limit';
import { notFoundHandler } from './middlewares/not-found';
import { errorHandler } from './middlewares/error-handler';
import { apiRouter } from './routes';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  // Necessário atrás de proxy (Railway) para o rate limit enxergar o IP real.
  app.set('trust proxy', env.TRUST_PROXY);

  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => (req as typeof req & { id: string }).id,
      // Loga método/rota/status/tempo — sem corpo, sem query com dados pessoais.
      serializers: {
        req: (req) => ({ id: req.id, method: req.method, url: req.url?.split('?')[0] }),
        res: (res) => ({ statusCode: res.statusCode }),
      },
      autoLogging: { ignore: (req) => req.url === '/api/v1/health' },
    }),
  );

  app.use(
    helmet({
      // API pura (JSON): bloqueia tudo que não seja dado.
      contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // permite o frontend carregar imagens servidas pela API
      hsts: env.isProduction ? { maxAge: 31_536_000, includeSubDomains: true } : false,
    }),
  );

  // CORS é só controle de navegador; NÃO substitui autenticação.
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true); // curl/servidor-a-servidor (continua exigindo auth nas rotas)
        callback(null, env.FRONTEND_ORIGINS.includes(origin));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'Idempotency-Key'],
      maxAge: 600,
    }),
  );

  app.use(enforceOrigin);
  app.use(globalLimiter);
  app.use(express.json({ limit: '100kb', strict: true }));
  app.use(cookieParser());

  app.use('/api/v1', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
