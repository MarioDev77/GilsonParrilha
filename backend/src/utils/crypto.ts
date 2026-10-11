import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env';

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

// O banco guarda só o HMAC do token de sessão: vazamento do banco não permite sequestrar sessões.
export function hashSessionToken(token: string): string {
  return createHmac('sha256', env.SESSION_SECRET).update(`session:${token}`).digest('hex');
}

// Token CSRF derivado do token de sessão (permite o /me devolver o mesmo token após recarregar a página).
export function deriveCsrfToken(sessionToken: string): string {
  return createHmac('sha256', env.SESSION_SECRET).update(`csrf:${sessionToken}`).digest('base64url');
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
