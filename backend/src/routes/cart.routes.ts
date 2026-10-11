import { Router } from 'express';
import * as orders from '../controllers/order.controller';
import { noStore } from '../middlewares/no-store';
import { quoteLimiter } from '../middlewares/rate-limit';
import { validateBody } from '../middlewares/validate';
import { quoteSchema } from '../schemas/order.schema';

// Cotação pública do carrinho (somente cálculo; não cria pedido).
export const cartRoutes = Router();

cartRoutes.use(noStore);

cartRoutes.post('/quote', quoteLimiter, validateBody(quoteSchema), orders.quoteCart);
