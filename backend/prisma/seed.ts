import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { normalizeWhatsappNumber } from '../src/utils/phone';

// Seed IDEMPOTENTE e não destrutivo: só cria o que não existe, nunca sobrescreve nem apaga dados.
const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { name: 'Hambúrgueres', slug: 'hamburgueres', sortOrder: 1 },
  { name: 'Acompanhamentos', slug: 'acompanhamentos', sortOrder: 2 },
  { name: 'Bebidas', slug: 'bebidas', sortOrder: 3 },
  { name: 'Sobremesas', slug: 'sobremesas', sortOrder: 4 },
];

// Todos os dias fechados até o administrador configurar o horário real (PATCH /admin/settings).
const CLOSED_WEEK = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };

async function main() {
  const settings = await prisma.storeSettings.findUnique({ where: { id: 1 } });

  if (!settings) {
    const whatsapp = normalizeWhatsappNumber(process.env.WHATSAPP_NUMBER ?? '');
    if (!whatsapp) {
      throw new Error('Defina WHATSAPP_NUMBER válido no .env (ex.: 5575999999999) antes de rodar o seed.');
    }
    await prisma.storeSettings.create({
      data: { id: 1, whatsappNumber: whatsapp, openingHours: CLOSED_WEEK },
    });
    console.log('✔ Configurações da loja criadas (horário de funcionamento vazio — configure no painel).');
  } else {
    console.log('• Configurações já existem — mantidas.');
  }

  for (const category of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({ where: { slug: category.slug }, update: {}, create: category });
  }
  console.log(`✔ Categorias iniciais garantidas (${DEFAULT_CATEGORIES.length}).`);
}

main()
  .catch((err) => {
    console.error('✖ Seed falhou:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
