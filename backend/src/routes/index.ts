import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { catalogRoutes } from './catalog.routes';
import { healthRoutes } from './health.routes';
import { orderRoutes } from './order.routes';
import { settingsRoutes } from './settings.routes';

export const apiRouter = Router();

apiRouter.use(healthRoutes);
apiRouter.use(catalogRoutes);
apiRouter.use('/settings', settingsRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/admin/auth', authRoutes);

// Próximas etapas: rotas /admin/* protegidas (requireAuth + requireCsrf + requireRole)
