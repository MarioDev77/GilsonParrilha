import { describe, expect, it } from 'vitest';
import { deriveCsrfToken, hashSessionToken, randomToken, safeEqual, sha256Hex } from '../../src/utils/crypto';

describe('crypto utils', () => {
  it('gera tokens aleatórios únicos e longos', () => {
    const a = randomToken();
    const b = randomToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(40);
  });

  it('hash de sessão é determinístico e diferente do token', () => {
    const t = randomToken();
    expect(hashSessionToken(t)).toBe(hashSessionToken(t));
    expect(hashSessionToken(t)).not.toContain(t);
  });

  it('token CSRF é derivado da sessão e difere entre sessões', () => {
    const a = randomToken();
    const b = randomToken();
    expect(deriveCsrfToken(a)).toBe(deriveCsrfToken(a));
    expect(deriveCsrfToken(a)).not.toBe(deriveCsrfToken(b));
  });

  it('validação CSRF: hash do token enviado confere com o armazenado', () => {
    const session = randomToken();
    const csrf = deriveCsrfToken(session);
    const stored = sha256Hex(csrf);
    expect(safeEqual(sha256Hex(csrf), stored)).toBe(true);
    expect(safeEqual(sha256Hex('forjado'), stored)).toBe(false);
  });

  it('safeEqual recusa tamanhos diferentes sem lançar erro', () => {
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });
});
