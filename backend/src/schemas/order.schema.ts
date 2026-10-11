import { z } from 'zod';
import { cleanText } from '../utils/text';
import { normalizeWhatsappNumber } from '../utils/phone';
import { PUBLIC_ID_PATTERN } from '../utils/public-id';

// Texto obrigatório: limpo (uma linha, sem caracteres invisíveis) e com limites.
const text = (max: number, min = 1) =>
  z
    .string()
    .max(max * 4) // corta entradas absurdas antes de processar
    .transform(cleanText)
    .pipe(z.string().min(min, 'Campo obrigatório').max(max, `Máximo de ${max} caracteres`));

// Texto opcional: ausente, null ou vazio => undefined.
const optionalText = (max: number) =>
  z
    .string()
    .max(max * 4)
    .transform(cleanText)
    .pipe(z.string().max(max, `Máximo de ${max} caracteres`))
    .nullish()
    .transform((v) => (v ? v : undefined));

const phone = z
  .string()
  .max(30)
  .transform((value, ctx) => {
    const normalized = normalizeWhatsappNumber(value);
    if (!normalized) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Telefone inválido. Use DDD + número.' });
      return z.NEVER;
    }
    return normalized;
  });

const extraSelection = z
  .object({
    extraId: z.string().uuid(),
    quantity: z.number().int().min(1).max(5).default(1),
  })
  .strict();

const orderItem = z
  .object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).max(20),
    extras: z.array(extraSelection).max(10).default([]),
    removedIngredients: z.array(text(60)).max(15).default([]),
    notes: optionalText(200),
  })
  .strict()
  .superRefine((item, ctx) => {
    const ids = item.extras.map((e) => e.extraId);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['extras'], message: 'Adicional repetido no mesmo item' });
    }
  });

// `.strict()`: qualquer campo extra (total, price, discount, deliveryFee...) é rejeitado com 400.
// Preços, taxas e totais NUNCA são lidos do corpo da requisição.
export const createOrderSchema = z
  .object({
    customer: z.object({ name: text(80, 2), phone }).strict(),
    fulfillmentType: z.enum(['DELIVERY', 'PICKUP']),
    deliveryAddress: optionalText(250),
    deliveryReference: optionalText(150),
    customerNotes: optionalText(500),
    items: z.array(orderItem).min(1, 'O pedido precisa de ao menos um item').max(30),
  })
  .strict()
  .superRefine((order, ctx) => {
    if (order.fulfillmentType === 'DELIVERY' && (order.deliveryAddress?.length ?? 0) < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['deliveryAddress'],
        message: 'Informe o endereço de entrega',
      });
    }
  })
  // Retirada não guarda endereço.
  .transform((order) =>
    order.fulfillmentType === 'PICKUP'
      ? { ...order, deliveryAddress: undefined, deliveryReference: undefined }
      : order,
  );

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const idempotencyKeySchema = z
  .string({ required_error: 'Cabeçalho Idempotency-Key é obrigatório' })
  .trim()
  .regex(/^[A-Za-z0-9_-]{16,100}$/, 'Idempotency-Key deve ter 16–100 caracteres (letras, números, _ ou -)');

export const publicIdParamSchema = z.string().regex(PUBLIC_ID_PATTERN);
