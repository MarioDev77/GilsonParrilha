import { BUSINESS_TZ } from "@/config/site";
import type { OpeningHour } from "@/types";

export interface OpenStatus {
  open: boolean;
  /** Ex.: "Aberto agora, fecha às 23h" ou "Fechado, abre hoje às 18h". */
  text: string;
}

const DAY_PREFIX: Record<string, number> = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6 };
const DAY_LABEL = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const WEEKDAY_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/-feira/g, "");

/** "Terça a domingo", "Seg-Sex", "Sábado e domingo", "Todos os dias". Vazio = não entendi. */
function parseDays(raw: string): number[] {
  const s = normalize(raw);
  if (/todos os dias|todo dia|diaria|toda a semana/.test(s)) return [0, 1, 2, 3, 4, 5, 6];
  const days = new Set<number>();
  let prev: number | null = null;
  let range = false;
  for (const m of s.matchAll(/\b(dom|seg|ter|qua|qui|sex|sab)[a-z]*\b|\b(?:ate|a)\b|[-–—]/g)) {
    if (m[1]) {
      const d = DAY_PREFIX[m[1]];
      if (range && prev !== null) {
        for (let x: number = prev; ; x = (x + 1) % 7) {
          days.add(x);
          if (x === d) break;
        }
      } else {
        days.add(d);
      }
      prev = d;
      range = false;
    } else {
      range = true;
    }
  }
  return [...days];
}

/**
 * "18h às 23h", "18:30 - 23:00", "11h às 14h e 18h às 23h", "18h às 2h", "24 horas", "Fechado".
 * Devolve minutos desde 00:00 (fim pode passar de 1440 quando vira a meia-noite).
 * `[]` = fechado o dia todo; `null` = não entendi.
 */
function parseRanges(raw: string): Array<[number, number]> | null {
  const s = normalize(raw);
  if (/fechad/.test(s)) return [];
  if (/\b24\s*(h|horas)\b/.test(s) && !/\d\s*(h|:)\s*\d{2}\b.*\d\s*(h|:)/.test(s)) return [[0, 1440]];
  const times: number[] = [];
  for (const m of s.matchAll(/(\d{1,2})\s*(?:h|:)\s*(\d{2})?/g)) {
    const h = Number(m[1]);
    const min = m[2] ? Number(m[2]) : 0;
    if (h > 24 || min > 59) return null;
    times.push((h % 24) * 60 + min);
  }
  if (times.length < 2 || times.length % 2 !== 0) return null;
  const ranges: Array<[number, number]> = [];
  for (let i = 0; i < times.length; i += 2) {
    const start = times[i];
    let end = times[i + 1];
    if (end <= start) end += 1440;
    ranges.push([start, end]);
  }
  return ranges;
}

function clock(totalMinutes: number): string {
  const m = totalMinutes % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm ? `${h}h${String(mm).padStart(2, "0")}` : `${h}h`;
}

function zonedNow(now: Date): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  return { day: Math.max(0, WEEKDAY_EN.indexOf(get("weekday"))), minutes: (Number(get("hour")) % 24) * 60 + Number(get("minute")) };
}

/**
 * Diz se o estabelecimento está aberto. Devolve `null` quando algum horário cadastrado não pode ser
 * interpretado com segurança: é melhor não mostrar selo do que mostrar "Fechado" por engano.
 */
export function getOpenStatus(hours: OpeningHour[], now: Date = new Date()): OpenStatus | null {
  if (hours.length === 0) return null;
  const schedule: Array<Array<[number, number]>> = [[], [], [], [], [], [], []];
  for (const row of hours) {
    const days = parseDays(row.day);
    const ranges = parseRanges(row.hours);
    if (days.length === 0 || ranges === null) return null;
    for (const d of days) schedule[d].push(...ranges);
  }

  const { day, minutes } = zonedNow(now);

  for (const [start, end] of schedule[day]) {
    if (minutes >= start && minutes < end) {
      const allDay = start === 0 && end === 1440;
      return { open: true, text: allDay ? "Aberto agora, 24 horas" : `Aberto agora, fecha às ${clock(end)}` };
    }
  }
  // faixa de ontem que atravessou a meia-noite
  for (const [, end] of schedule[(day + 6) % 7]) {
    if (end > 1440 && minutes < end - 1440) return { open: true, text: `Aberto agora, fecha às ${clock(end)}` };
  }

  for (let offset = 0; offset <= 7; offset++) {
    const d = (day + offset) % 7;
    const starts = schedule[d].map(([s]) => s).filter((s) => offset > 0 || s > minutes).sort((a, b) => a - b);
    if (starts.length) {
      const when = offset === 0 ? "hoje" : offset === 1 ? "amanhã" : DAY_LABEL[d];
      return { open: false, text: `Fechado, abre ${when} às ${clock(starts[0])}` };
    }
  }
  return { open: false, text: "Fechado no momento" };
}
