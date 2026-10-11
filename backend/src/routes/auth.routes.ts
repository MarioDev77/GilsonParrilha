import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { requireAuth, requireCsrf } from '../middlewares/auth';
import { createRateLimiter } from '../middlewares/rate-limit';
import { validateBody } from '../middlewares/validate';
import { loginSchema } from '../schemas/auth.schema';

export const authRoutes = Router();

// Só tentativas FALHAS contam: 10 por IP a cada 15 min (além do bloqueio por conta no serviço).
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60_000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: 'Muitas tentativas de login. Tente novamente mais tarde.',
});

authRoutes.post('/login', loginLimiter, validateBody(loginSchema), authController.login);
authRoutes.post('/logout', requireAuth, requireCsrf, authController.logout);
authRoutes.get('/me', requireAuth, authController.me);
