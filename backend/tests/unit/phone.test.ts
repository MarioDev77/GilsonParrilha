import { describe, expect, it } from 'vitest';
import { normalizeWhatsappNumber } from '../../src/utils/phone';

describe('normalizeWhatsappNumber', () => {
  it('normaliza formatos brasileiros comuns', () => {
    expect(normalizeWhatsappNumber('(75) 99999-9999')).toBe('5575999999999');
    expect(normalizeWhatsappNumber('+55 75 99999-9999')).toBe('5575999999999');
    expect(normalizeWhatsappNumber('5575999999999')).toBe('5575999999999');
    expect(normalizeWhatsappNumber('0055 75 99999-9999')).toBe('5575999999999');
    expect(normalizeWhatsappNumber('(75) 3333-4444')).toBe('557533334444');
  });

  it('rejeita números inválidos', () => {
    expect(normalizeWhatsappNumber('')).toBeNull();
    expect(normalizeWhatsappNumber('abc')).toBeNull();
    expect(normalizeWhatsappNumber('123')).toBeNull();
    expect(normalizeWhatsappNumber('55759999')).toBeNull();
  });
});
