import type { RequestHandler } from 'express';
import { AppError } from '../errors/app-error';
import { idempotencyKeySchema, publicIdParamSchema } from '../schemas/order.schema';
import type { CreateOrderInput } from '../schemas/order.schema';
import { orderService } from '../services/order.service';
import { asyncHandler } from '../utils/async-handler';

export const createOrder: RequestHandler = asyncHandler(async (req, res) => {
  const key = idempotencyKeySchema.safeParse(req.get('idempotency-key'));
  if (!key.success) {
    throw AppError.validation([{ path: 'Idempotency-Key', message: key.error.issues[0]?.message ?? 'Inválido' }]);
  }

  // O corpo já foi validado e normalizado por validateBody(createOrderSchema).
  const { created, idempotentReplay, ...result } = await orderService.create(req.body as CreateOrderInput, key.data);

  if (idempotentReplay) res.setHeader('Idempotent-Replayed', 'true');
  res.status(created ? 201 : 200).json({ data: { ...result, idempotentReplay } });
});

export const getPublicOrder: RequestHandler = asyncHandler(async (req, res) => {
  const publicId = publicIdParamSchema.safeParse(req.params.publicId);
  // Formato inválido responde igual a "não existe": não ajuda a sondar o identificador.
  if (!publicId.success) throw AppError.notFound('Pedido não encontrado');
  res.json({ data: await orderService.getPublicSummary(publicId.data) });
});
