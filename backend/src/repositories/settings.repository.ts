import { prisma } from '../config/prisma';

export const settingsRepository = {
  // Configurações vivem numa linha única (id = 1).
  get() {
    return prisma.storeSettings.findUnique({ where: { id: 1 } });
  },
};
