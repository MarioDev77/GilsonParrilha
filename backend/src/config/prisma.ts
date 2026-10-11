import { PrismaClient } from '@prisma/client';
import { env } from './env';

// Instância única do Prisma. A conexão vem exclusivamente de DATABASE_URL.
export const prisma = new PrismaClient({
  log: env.isProduction ? ['error'] : ['warn', 'error'],
});
