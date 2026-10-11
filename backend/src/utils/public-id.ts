import { randomBytes } from 'node:crypto';

// Identificador público do pedido: 18 bytes aleatórios (144 bits) em base64url => 24 caracteres.
// Não é sequencial nem previsível: não permite enumerar pedidos.
export function generatePublicId(): string {
  return randomBytes(18).toString('base64url');
}

export const PUBLIC_ID_PATTERN = /^[A-Za-z0-9_-]{20,40}$/;
