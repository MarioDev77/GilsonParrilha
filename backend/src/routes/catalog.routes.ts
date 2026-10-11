import { Router } from 'express';
import * as catalog from '../controllers/catalog.controller';
import { publicCache } from '../middlewares/public-cache';
import { validateQuery } from '../middlewares/validate-query';
import { extraListQuerySchema, productListQuerySchema } from '../schemas/catalog.schema';

// Cardápio público (somente leitura, sem autenticação).
export const catalogRoutes = Router();

// O cache é aplicado POR ROTA (e não com `use` na raiz), senão vazaria `Cache-Control: public`
// para rotas montadas depois no mesmo prefixo (/orders, /admin/*).
const cache = publicCache(30);

catalogRoutes.get('/categories', cache, catalog.listCategories);
catalogRoutes.get('/products', cache, validateQuery(productListQuerySchema), catalog.listProducts);
catalogRoutes.get('/products/:slug', cache, catalog.getProduct);
catalogRoutes.get('/extras', cache, validateQuery(extraListQuerySchema), catalog.listExtras);
