import type { RequestHandler } from 'express';
import { settingsService } from '../services/settings.service';
import { asyncHandler } from '../utils/async-handler';

export const getPublicSettings: RequestHandler = asyncHandler(async (_req, res) => {
  res.json({ data: await settingsService.getPublic() });
});
