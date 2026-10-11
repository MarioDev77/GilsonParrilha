import { describe, expect, it } from 'vitest';
import { hashPassword, validatePasswordStrength, verifyPassword } from '../../src/utils/password';

describe('password', () => {
  it('gera hash Argon2id e verifica corretamente', async () => {
    const hash = await hashPassword('Senha-Forte-123');
    expect(hash.startsWith('$argon2id$')).toBe(true);
    expect(hash).not.toContain('Senha-Forte-123');
    expect(await verifyPassword(hash, 'Senha-Forte-123')).toBe(true);
    expect(await verifyPassword(hash, 'senha-errada-123')).toBe(false);
  });

  it('retorna false (sem lançar) para hash inválido', async () => {
    expect(await verifyPassword('isso-nao-e-hash', 'qualquer')).toBe(false);
  });

  it('política de senha', () => {
    expect(validatePasswordStrength('Churrasco-2026-ok')).toEqual([]);
    expect(validatePasswordStrength('curta1')).toContain('mínimo de 12 caracteres');
    expect(validatePasswordStrength('somenteletrasaqui')).toContain('precisa de ao menos um número');
    expect(validatePasswordStrength('1234567890123')).toContain('precisa de ao menos uma letra');
    expect(validatePasswordStrength('aaaaaaaaaaaa')).toContain('não pode repetir o mesmo caractere');
  });
});
