import { z } from 'zod';

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use o formato HH:MM');
const interval = z.object({ open: time, close: time }).strict();

// Horário de funcionamento por dia da semana. Vários intervalos por dia são aceitos.
// Intervalo que atravessa a meia-noite (ex.: 18:00–02:00) vale para o dia em que ABRE.
export const openingHoursSchema = z
  .object({
    mon: z.array(interval).max(4).default([]),
    tue: z.array(interval).max(4).default([]),
    wed: z.array(interval).max(4).default([]),
    thu: z.array(interval).max(4).default([]),
    fri: z.array(interval).max(4).default([]),
    sat: z.array(interval).max(4).default([]),
    sun: z.array(interval).max(4).default([]),
  })
  .strict();

export type OpeningHours = z.infer<typeof openingHoursSchema>;
type DayKey = keyof OpeningHours;

const DAYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const EMPTY_WEEK: OpeningHours = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };

// JSON inválido/corrompido no banco = loja tratada como fechada (nunca "aberta por engano").
export function parseOpeningHours(value: unknown): OpeningHours {
  const result = openingHoursSchema.safeParse(value);
  return result.success ? result.data : EMPTY_WEEK;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number) as [number, number];
  return h * 60 + m;
}

// Dia da semana e minutos do dia no fuso da loja (não do servidor).
export function getLocalParts(date: Date, timeZone: string): { day: DayKey; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const day = get('weekday').slice(0, 3).toLowerCase() as DayKey;
  return { day, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

export function isOpenAt(hours: OpeningHours, timeZone: string, date: Date = new Date()): boolean {
  const { day, minutes } = getLocalParts(date, timeZone);
  const yesterday = DAYS[(DAYS.indexOf(day) + 6) % 7] as DayKey;

  for (const { open, close } of hours[day]) {
    const o = toMinutes(open);
    const c = toMinutes(close);
    if (c > o ? minutes >= o && minutes < c : minutes >= o) return true; // c <= o: atravessa a meia-noite
  }
  for (const { open, close } of hours[yesterday]) {
    const o = toMinutes(open);
    const c = toMinutes(close);
    if (c <= o && minutes < c) return true; // continuação do turno de ontem
  }
  return false;
}
