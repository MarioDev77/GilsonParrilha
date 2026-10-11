import { describe, expect, it } from 'vitest';
import { isOpenAt, openingHoursSchema, parseOpeningHours } from '../../src/utils/business-hours';

const TZ = 'America/Bahia'; // UTC-3, sem horário de verão

const hours = openingHoursSchema.parse({
  fri: [{ open: '18:00', close: '23:30' }],
  sat: [{ open: '18:00', close: '02:00' }], // atravessa a meia-noite
  sun: [
    { open: '11:00', close: '14:00' },
    { open: '18:00', close: '22:00' },
  ],
});

describe('isOpenAt', () => {
  it('aberto dentro do intervalo (sexta 19:00 em Salvador)', () => {
    expect(isOpenAt(hours, TZ, new Date('2026-10-09T22:00:00Z'))).toBe(true);
  });

  it('fechado antes de abrir e no minuto exato do fechamento', () => {
    expect(isOpenAt(hours, TZ, new Date('2026-10-09T20:59:00Z'))).toBe(false); // 17:59
    expect(isOpenAt(hours, TZ, new Date('2026-10-10T02:30:00Z'))).toBe(false); // 23:30 (fechamento)
  });

  it('turno que atravessa a meia-noite continua no dia seguinte', () => {
    expect(isOpenAt(hours, TZ, new Date('2026-10-11T03:30:00Z'))).toBe(true); // dom 00:30
    expect(isOpenAt(hours, TZ, new Date('2026-10-11T05:30:00Z'))).toBe(false); // dom 02:30
  });

  it('respeita o fuso da loja, não o do servidor', () => {
    // 21:00Z de sexta = 18:00 em Salvador (abre) | = 21:00 UTC
    expect(isOpenAt(hours, TZ, new Date('2026-10-09T21:00:00Z'))).toBe(true);
    expect(isOpenAt(hours, 'UTC', new Date('2026-10-09T17:00:00Z'))).toBe(false);
  });

  it('vários intervalos no mesmo dia', () => {
    expect(isOpenAt(hours, TZ, new Date('2026-10-11T15:00:00Z'))).toBe(true); // dom 12:00
    expect(isOpenAt(hours, TZ, new Date('2026-10-11T18:00:00Z'))).toBe(false); // dom 15:00
  });
});

describe('parseOpeningHours', () => {
  it('JSON inválido vira loja fechada', () => {
    const parsed = parseOpeningHours({ mon: 'qualquer coisa' });
    expect(isOpenAt(parsed, TZ, new Date('2026-10-12T15:00:00Z'))).toBe(false);
  });

  it('rejeita horário malformado e dias desconhecidos', () => {
    expect(openingHoursSchema.safeParse({ mon: [{ open: '25:00', close: '10:00' }] }).success).toBe(false);
    expect(openingHoursSchema.safeParse({ xyz: [] }).success).toBe(false);
  });
});
