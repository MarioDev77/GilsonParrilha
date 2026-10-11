import * as argon2 from 'argon2';

// Argon2id com parâmetros no nível mínimo recomendado pela OWASP (19 MiB, 2 iterações, 1 thread).
const ARGON_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON_OPTIONS);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

// Gasta o mesmo tempo de uma verificação real quando o e-mail não existe (evita enumeração por tempo de resposta).
let dummyHash: Promise<string> | undefined;
export async function burnPasswordTime(password: string): Promise<void> {
  dummyHash ??= hashPassword('senha-descartavel-para-igualar-tempo');
  await verifyPassword(await dummyHash, password);
}

const COMMON_PASSWORDS = new Set([
  '123456789012',
  'password1234',
  'senha1234567',
  'qwerty123456',
  'admin1234567',
  'gilsonparrilha',
]);

// Retorna a lista de problemas (vazia = senha aceita).
export function validatePasswordStrength(password: string): string[] {
  const problems: string[] = [];
  if (password.length < 12) problems.push('mínimo de 12 caracteres');
  if (password.length > 128) problems.push('máximo de 128 caracteres');
  if (!/[A-Za-z]/.test(password)) problems.push('precisa de ao menos uma letra');
  if (!/\d/.test(password)) problems.push('precisa de ao menos um número');
  if (/^(.)\1+$/.test(password)) problems.push('não pode repetir o mesmo caractere');
  if (COMMON_PASSWORDS.has(password.toLowerCase())) problems.push('senha comum demais');
  return problems;
}
