import type { AuthenticatedAdmin } from './auth';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AuthenticatedAdmin;
      adminSession?: { id: string; csrfTokenHash: string };
    }
  }
}

export {};
