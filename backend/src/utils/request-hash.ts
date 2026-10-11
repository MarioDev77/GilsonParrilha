import { createHash } from 'node:crypto';

// Serialização canônica: chaves ordenadas, para que o mesmo pedido gere sempre o mesmo hash.
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj)
      .filter((k) => obj[k] !== undefined)
      .sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonical(obj[k])}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

// Impressão digital do corpo JÁ VALIDADO/NORMALIZADO do pedido (idempotência).
// Mesma chave + mesmo hash => repetição; mesma chave + hash diferente => conflito.
export function hashOrderRequest(body: unknown): string {
  return createHash('sha256').update(canonical(body)).digest('hex');
}
