import { env } from '../config/env';
import { logger } from '../config/logger';
import { AppError } from '../errors/app-error';
import { adminRepository } from '../repositories/admin.repository';
import { sessionRepository } from '../repositories/session.repository';
import { auditService } from './audit.service';
import { deriveCsrfToken, hashSessionToken, randomToken, sha256Hex } from '../utils/crypto';
import { burnPasswordTime, verifyPassword } from '../utils/password';
import { loginThrottle } from '../utils/login-throttle';
import type { AdminRoleName, AuthenticatedAdmin } from '../types/auth';

const TOUCH_INTERVAL_MS = 5 * 60_000;

interface LoginInput {
  email: string;
  password: string;
  ip?: string;
  userAgent?: string;
}

// Mensagem única para qualquer falha: não revela se o e-mail existe nem se a conta está inativa.
const invalidCredentials = () => new AppError(401, 'UNAUTHENTICATED', 'E-mail ou senha inválidos');

export const authService = {
  async login({ email, password, ip, userAgent }: LoginInput) {
    if (loginThrottle.isBlocked(email)) {
      throw new AppError(429, 'RATE_LIMITED', 'Muitas tentativas. Tente novamente mais tarde.');
    }

    const admin = await adminRepository.findByEmail(email);
    let valid = false;
    if (admin && admin.isActive) {
      valid = await verifyPassword(admin.passwordHash, password);
    } else {
      await burnPasswordTime(password);
    }

    if (!admin || !valid) {
      loginThrottle.recordFailure(email);
      logger.warn({ ip }, 'Tentativa de login falhou');
      throw invalidCredentials();
    }

    loginThrottle.reset(email);

    const sessionToken = randomToken();
    const csrfToken = deriveCsrfToken(sessionToken);
    const expiresAt = new Date(Date.now() + env.SESSION_TTL_HOURS * 3600_000);

    const session = await sessionRepository.create({
      adminId: admin.id,
      tokenHash: hashSessionToken(sessionToken),
      csrfTokenHash: sha256Hex(csrfToken),
      ip,
      userAgent: userAgent?.slice(0, 255),
      expiresAt,
    });

    await adminRepository.touchLogin(admin.id);
    void sessionRepository.deleteStale().catch((err: unknown) => logger.warn({ err }, 'Falha na limpeza de sessões'));
    await auditService.record({ adminId: admin.id, action: 'auth.login', entity: 'AdminSession', entityId: session.id, ip });

    const publicAdmin: AuthenticatedAdmin = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role as AdminRoleName,
    };
    return { admin: publicAdmin, sessionToken, csrfToken, expiresAt };
  },

  async validateSession(sessionToken: string) {
    const session = await sessionRepository.findByTokenHash(hashSessionToken(sessionToken));
    const now = Date.now();

    if (!session || session.revokedAt || session.expiresAt.getTime() <= now || !session.admin.isActive) {
      throw AppError.unauthenticated();
    }

    if (now - session.lastUsedAt.getTime() > TOUCH_INTERVAL_MS) {
      void sessionRepository.touch(session.id).catch(() => undefined);
    }

    const admin: AuthenticatedAdmin = {
      id: session.admin.id,
      name: session.admin.name,
      email: session.admin.email,
      role: session.admin.role as AdminRoleName,
    };
    return { admin, session: { id: session.id, csrfTokenHash: session.csrfTokenHash } };
  },

  async logout(params: { sessionId: string; adminId: string; ip?: string }) {
    await sessionRepository.revoke(params.sessionId);
    await auditService.record({
      adminId: params.adminId,
      action: 'auth.logout',
      entity: 'AdminSession',
      entityId: params.sessionId,
      ip: params.ip,
    });
  },
};
