import { Router } from 'express';
import * as orders from '../controllers/order.controller';
import { noStore } from '../middlewares/no-store';
import { createOrderLimiter, publicOrderLookupLimiter } from '../middlewares/rate-limit';
import { validateBody } from '../middlewares/validate';
import { createOrderSchema } from '../schemas/order.schema';

// Rotas públicas de pedido. Não existe listagem pública nem consulta por id interno/sequencial.
export const orderRoutes = Router();

orderRoutes.use(noStore);

orderRoutes.post('/', createOrderLimiter, validateBody(createOrderSchema), orders.createOrder);
orderRoutes.get('/:publicId', publicOrderLookupLimiter, orders.getPublicOrder);
