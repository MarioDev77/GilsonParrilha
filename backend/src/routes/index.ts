import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { cartRoutes } from './cart.routes';
import { catalogRoutes } from './catalog.routes';
import { healthRoutes } from './health.routes';
import { orderRoutes } from './order.routes';
import { settingsRoutes } from './settings.routes';
import { adminRoutes } from './admin.routes';

export const apiRouter = Router();

apiRouter.use(healthRoutes);
apiRouter.use(catalogRoutes);
apiRouter.use('/settings', settingsRoutes);
apiRouter.use('/cart', cartRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/admin/auth', authRoutes);

apiRouter.use('/admin', adminRoutes);
