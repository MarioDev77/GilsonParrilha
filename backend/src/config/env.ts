import 'dotenv/config';
import { z } from 'zod';

const booleanish = z
  .enum(['true', 'false'])
  .default('false')
  .transform((v) => v === 'true');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3333),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL é obrigatória')
    .refine((v) => /^postgres(ql)?:\/\//i.test(v), 'DATABASE_URL deve começar com postgresql://'),

  FRONTEND_ORIGIN: z.string().min(1, 'FRONTEND_ORIGIN é obrigatória'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET precisa ter no mínimo 32 caracteres'),
  SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(24 * 30).default(12),
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),

  // Cookie de sessão admin. Frontend e API em domínios "site" diferentes => COOKIE_SAMESITE=none (exige HTTPS).
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  COOKIE_DOMAIN: z.string().trim().min(1).optional(),

  // Usadas nas próximas etapas (opcionais por enquanto)
  WHATSAPP_NUMBER: z.string().optional(),
  ADMIN_INITIAL_NAME: z.string().trim().optional(),
  ADMIN_INITIAL_EMAIL: z.string().trim().optional(),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  UPLOAD_MAX_MB: z.coerce.number().positive().max(20).default(5),
  ENABLE_DOCS: booleanish,
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // Mostra só o nome do campo e a regra violada — nunca os valores.
  const problems = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  // eslint-disable-next-line no-console
  console.error(`\n[config] Variáveis de ambiente inválidas:\n${problems}\n`);
  process.exit(1);
}

const raw = parsed.data;

const origins = raw.FRONTEND_ORIGIN.split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

for (const origin of origins) {
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    // eslint-disable-next-line no-console
    console.error(`\n[config] FRONTEND_ORIGIN contém uma origem inválida: "${origin}"\n`);
    process.exit(1);
  }
  if (raw.NODE_ENV === 'production' && url.protocol !== 'https:') {
    // eslint-disable-next-line no-console
    console.error(`\n[config] Em produção, FRONTEND_ORIGIN deve usar https: "${origin}"\n`);
    process.exit(1);
  }
}

if (raw.COOKIE_SAMESITE === 'none' && raw.NODE_ENV !== 'production') {
  // eslint-disable-next-line no-console
  console.error('\n[config] COOKIE_SAMESITE=none só funciona com cookie Secure (produção/HTTPS).\n');
  process.exit(1);
}

export const env = {
  ...raw,
  FRONTEND_ORIGINS: origins,
  isProduction: raw.NODE_ENV === 'production',
  isTest: raw.NODE_ENV === 'test',
};

export type Env = typeof env;
