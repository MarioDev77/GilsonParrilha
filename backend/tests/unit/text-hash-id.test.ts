import { describe, expect, it } from 'vitest';
import { cleanText } from '../../src/utils/text';
import { hashOrderRequest } from '../../src/utils/request-hash';
import { generatePublicId, PUBLIC_ID_PATTERN } from '../../src/utils/public-id';

describe('cleanText', () => {
  it('transforma quebras de linha em espaço (impede linhas falsas na mensagem)', () => {
    expect(cleanText('sem cebola\nTotal: R$ 0,01')).toBe('sem cebola Total: R$ 0,01');
    expect(cleanText('a\r\n\r\nb\tc')).toBe('a b c');
  });
  it('remove caracteres invisíveis e de direção de texto', () => {
    expect(cleanText('Ma\u200Bria\u202E')).toBe('Ma ria');
    expect(cleanText('  oi   mundo  ')).toBe('oi mundo');
  });
  it('normaliza acentos (NFC)', () => {
    expect(cleanText('Jose\u0301')).toBe('José');
  });
});

describe('hashOrderRequest', () => {
  it('é estável independentemente da ordem das chaves', () => {
    expect(hashOrderRequest({ a: 1, b: { c: 2, d: [1, 2] } })).toBe(hashOrderRequest({ b: { d: [1, 2], c: 2 }, a: 1 }));
  });
  it('muda quando o conteúdo muda', () => {
    expect(hashOrderRequest({ q: 1 })).not.toBe(hashOrderRequest({ q: 2 }));
  });
  it('ignora campos undefined (como o JSON faria)', () => {
    expect(hashOrderRequest({ a: 1, b: undefined })).toBe(hashOrderRequest({ a: 1 }));
  });
});

describe('generatePublicId', () => {
  it('gera identificadores únicos, aleatórios e no formato esperado', () => {
    const ids = new Set(Array.from({ length: 500 }, generatePublicId));
    expect(ids.size).toBe(500);
    for (const id of ids) expect(PUBLIC_ID_PATTERN.test(id)).toBe(true);
    expect(generatePublicId()).toHaveLength(24);
  });
  it('o padrão rejeita entradas suspeitas', () => {
    for (const bad of ['12345', '../etc/passwd', "x' OR 1=1 --", 'a'.repeat(41), '']) {
      expect(PUBLIC_ID_PATTERN.test(bad)).toBe(false);
    }
  });
});
