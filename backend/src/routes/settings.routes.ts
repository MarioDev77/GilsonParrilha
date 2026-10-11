import { Router } from 'express';
import { getPublicSettings } from '../controllers/settings.controller';
import { publicCache } from '../middlewares/public-cache';

export const settingsRoutes = Router();

settingsRoutes.get('/public', publicCache(30), getPublicSettings);
