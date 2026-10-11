import { prisma } from '../config/prisma';

const DB_TIMEOUT_MS = 3000;

export const healthService = {
  async checkDatabase(): Promise<boolean> {
    try {
      await Promise.race([
        prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), DB_TIMEOUT_MS)),
      ]);
      return true;
    } catch {
      return false;
    }
  },
};
