import { beforeEach, describe, expect, it } from 'vitest';
import { loginThrottle } from '../../src/utils/login-throttle';

describe('loginThrottle', () => {
  beforeEach(() => loginThrottle.clear());

  it('bloqueia a conta após 8 falhas e libera após a janela', () => {
    const now = 1_000_000;
    for (let i = 0; i < 7; i++) loginThrottle.recordFailure('a@x.com', now);
    expect(loginThrottle.isBlocked('a@x.com', now)).toBe(false);
    loginThrottle.recordFailure('a@x.com', now);
    expect(loginThrottle.isBlocked('a@x.com', now)).toBe(true);
    expect(loginThrottle.isBlocked('a@x.com', now + 16 * 60_000)).toBe(false);
  });

  it('login bem-sucedido zera o contador e contas são independentes', () => {
    for (let i = 0; i < 8; i++) loginThrottle.recordFailure('a@x.com');
    expect(loginThrottle.isBlocked('b@x.com')).toBe(false);
    loginThrottle.reset('a@x.com');
    expect(loginThrottle.isBlocked('a@x.com')).toBe(false);
  });
});
