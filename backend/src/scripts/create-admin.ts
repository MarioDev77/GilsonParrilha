import 'dotenv/config';
import readline from 'node:readline';
import { Writable } from 'node:stream';
import { z } from 'zod';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { adminRepository } from '../repositories/admin.repository';
import { auditService } from '../services/audit.service';
import { hashPassword, validatePasswordStrength } from '../utils/password';

// Uso:
//   npm run admin:create                       -> cria o PRIMEIRO administrador (OWNER)
//   npm run admin:create -- --additional --role=STAFF   -> cria outro admin (ADMIN ou STAFF)
// A senha é digitada de forma oculta e nunca fica em arquivo, histórico ou log.

function ask(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    let muted = false;
    const output = new Writable({
      write(chunk, encoding, callback) {
        if (!muted) process.stdout.write(chunk, encoding);
        callback();
      },
    });
    const rl = readline.createInterface({ input: process.stdin, output, terminal: Boolean(process.stdin.isTTY) });
    rl.once('close', () => resolve(''));
    process.stdout.write(question);
    muted = hidden;
    rl.question('', (answer) => {
      rl.close();
      if (hidden) process.stdout.write('\n');
      resolve(answer);
    });
  });
}

function fail(message: string): never {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  const additional = args.includes('--additional');
  const roleArg = args.find((a) => a.startsWith('--role='))?.split('=')[1]?.toUpperCase();

  const existing = await adminRepository.count();
  if (existing > 0 && !additional) {
    fail('Já existe administrador cadastrado. Para criar outro, use: npm run admin:create -- --additional');
  }

  let role: 'OWNER' | 'ADMIN' | 'STAFF' = 'OWNER';
  if (existing > 0) {
    if (roleArg && roleArg !== 'ADMIN' && roleArg !== 'STAFF') fail('--role deve ser ADMIN ou STAFF');
    role = (roleArg as 'ADMIN' | 'STAFF' | undefined) ?? 'ADMIN';
  }

  const name = (env.ADMIN_INITIAL_NAME || (await ask('Nome: '))).trim();
  const emailRaw = (env.ADMIN_INITIAL_EMAIL || (await ask('E-mail: '))).trim().toLowerCase();

  const nameCheck = z.string().min(2).max(100).safeParse(name);
  const emailCheck = z.string().email().max(254).safeParse(emailRaw);
  if (!nameCheck.success) fail('Nome inválido (2 a 100 caracteres).');
  if (!emailCheck.success) fail('E-mail inválido.');

  if (await adminRepository.findByEmail(emailRaw)) fail('Já existe um administrador com esse e-mail.');

  const password = await ask('Senha (oculta): ', true);
  const problems = validatePasswordStrength(password);
  if (problems.length > 0) fail(`Senha fraca: ${problems.join('; ')}.`);
  const confirm = await ask('Repita a senha: ', true);
  if (confirm !== password) fail('As senhas não conferem.');

  const admin = await adminRepository.create({
    name,
    email: emailRaw,
    passwordHash: await hashPassword(password),
    role,
  });

  await auditService.record({
    adminId: admin.id,
    action: 'admin.create',
    entity: 'Admin',
    entityId: admin.id,
    metadata: { role, source: 'cli' },
  });

  console.log(`\n✔ Administrador criado: ${admin.email} (${role})\n`);
}

main()
  .catch((err) => {
    console.error('\n✖ Falha ao criar administrador:', err instanceof Error ? err.message : 'erro desconhecido');
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
