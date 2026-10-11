import { Prisma } from '@prisma/client';
import { logger } from '../config/logger';
import { AppError } from '../errors/app-error';
import { orderRepository, type OrderWithItems } from '../repositories/order.repository';
import { settingsRepository } from '../repositories/settings.repository';
import type { CreateOrderInput } from '../schemas/order.schema';
import { isOpenAt, parseOpeningHours } from '../utils/business-hours';
import { computeLineTotal, computeOrderTotals } from '../utils/order-pricing';
import { normalizeWhatsappNumber } from '../utils/phone';
import { generatePublicId } from '../utils/public-id';
import { hashOrderRequest } from '../utils/request-hash';
import { buildWhatsappLink } from '../utils/whatsapp';
import { toCreatedOrder, toPublicOrderSummary } from './order.mapper';

type Settings = NonNullable<Awaited<ReturnType<typeof settingsRepository.get>>>;

type ItemIssueReason = 'PRODUCT_UNAVAILABLE' | 'EXTRA_NOT_ALLOWED' | 'EXTRA_UNAVAILABLE' | 'INGREDIENT_NOT_REMOVABLE';
interface ItemIssue {
  itemIndex: number;
  reason: ItemIssueReason;
  productId: string;
  extraId?: string;
  ingredient?: string;
}

const INITIAL_STATUS = 'AGUARDANDO_CONTATO_WHATSAPP' as const;
const MAX_CREATE_ATTEMPTS = 3;

const isUniqueViolation = (err: unknown) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
const isRecordMissing = (err: unknown) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025';

// A API só PREPARA o link. Quem envia a mensagem é o cliente; por isso o texto nunca afirma envio/confirmação.
function buildResult(order: OrderWithItems, settings: Settings, whatsappNumber: string, idempotentReplay: boolean) {
  const whatsapp = buildWhatsappLink(settings.tradeName, whatsappNumber, order);
  const notice = order.outsideBusinessHours
    ? 'Pedido registrado fora do horário de atendimento. Envie a mensagem pelo WhatsApp: a equipe confirmará quando puder.'
    : 'Pedido registrado. Ele só será confirmado pela equipe depois que você enviar a mensagem pelo WhatsApp.';
  return {
    order: toCreatedOrder(order, settings.estimatedPrepMinutes),
    whatsapp,
    notice,
    idempotentReplay,
  };
}

function replay(existing: OrderWithItems, requestHash: string, settings: Settings, whatsappNumber: string) {
  if (existing.requestHash !== requestHash) {
    throw new AppError(
      409,
      'IDEMPOTENCY_CONFLICT',
      'Esta Idempotency-Key já foi usada em um pedido diferente. Gere uma nova chave para um novo pedido.',
    );
  }
  return buildResult(existing, settings, whatsappNumber, true);
}

export const orderService = {
  async create(input: CreateOrderInput, idempotencyKey: string) {
    const settings = await settingsRepository.get();
    if (!settings) throw AppError.unavailable('Loja ainda não configurada');

    // Sem número válido não há como preparar o link: recusa ANTES de gravar qualquer pedido.
    const whatsappNumber = normalizeWhatsappNumber(settings.whatsappNumber);
    if (!whatsappNumber) {
      logger.error('Número de WhatsApp da loja inválido nas configurações');
      throw AppError.unavailable('Pedidos temporariamente indisponíveis');
    }

    const requestHash = hashOrderRequest(input);

    // Repetição (duplo clique, retry de rede): devolve o pedido original, sem criar outro.
    const existing = await orderRepository.findByIdempotencyKey(idempotencyKey);
    if (existing) return { ...replay(existing, requestHash, settings, whatsappNumber), created: false };

    // ── Modalidade de atendimento ──
    const isDelivery = input.fulfillmentType === 'DELIVERY';
    if ((isDelivery && !settings.acceptsDelivery) || (!isDelivery && !settings.acceptsPickup)) {
      throw AppError.unprocessable(
        'FULFILLMENT_UNAVAILABLE',
        isDelivery ? 'A loja não está aceitando entregas no momento' : 'A loja não está aceitando retiradas no momento',
      );
    }

    // ── Horário de funcionamento (no fuso da loja) ──
    const isOpen = isOpenAt(parseOpeningHours(settings.openingHours), settings.timezone);
    if (!isOpen && !settings.acceptOrdersOutsideHours) {
      throw AppError.unprocessable('STORE_CLOSED', 'A loja está fechada no momento e não aceita pedidos fora do horário');
    }
    const outsideBusinessHours = !isOpen; // aceito, mas sinalizado: depende de confirmação manual

    // ── Preços e disponibilidade ATUAIS, direto do banco ──
    const productIds = [...new Set(input.items.map((i) => i.productId))];
    const products = new Map((await orderRepository.findProductsForOrder(productIds)).map((p) => [p.id, p]));

    const issues: ItemIssue[] = [];
    const lines = input.items.map((item, itemIndex) => {
      const product = products.get(item.productId);
      if (!product || !product.isAvailable) {
        issues.push({ itemIndex, reason: 'PRODUCT_UNAVAILABLE', productId: item.productId });
        return null;
      }

      const allowed = new Map(product.extras.map((pe) => [pe.extra.id, pe.extra]));
      const extras = [];
      for (const sel of item.extras) {
        const extra = allowed.get(sel.extraId);
        if (!extra) {
          issues.push({ itemIndex, reason: 'EXTRA_NOT_ALLOWED', productId: product.id, extraId: sel.extraId });
        } else if (!extra.isActive || !extra.isAvailable || extra.archivedAt) {
          issues.push({ itemIndex, reason: 'EXTRA_UNAVAILABLE', productId: product.id, extraId: sel.extraId });
        } else {
          extras.push({ extraId: extra.id, name: extra.name, unitPriceCents: extra.priceCents, quantity: sel.quantity });
        }
      }

      // Só pode retirar ingredientes que o produto permite; grava o nome oficial do cardápio.
      const removable = new Map(product.removableIngredients.map((name) => [name.toLowerCase(), name]));
      const removed: string[] = [];
      for (const requested of item.removedIngredients) {
        const official = removable.get(requested.toLowerCase());
        if (!official) {
          issues.push({ itemIndex, reason: 'INGREDIENT_NOT_REMOVABLE', productId: product.id, ingredient: requested });
        } else if (!removed.includes(official)) {
          removed.push(official);
        }
      }

      return {
        productId: product.id,
        productName: product.name,
        unitPriceCents: product.priceCents,
        quantity: item.quantity,
        removedIngredients: removed,
        notes: item.notes ?? null,
        extras,
        lineTotalCents: computeLineTotal({ unitPriceCents: product.priceCents, quantity: item.quantity, extras }),
      };
    });

    if (issues.length > 0) {
      throw AppError.unprocessable(
        'ITEM_UNAVAILABLE',
        'Alguns itens não estão disponíveis ou não são válidos. Revise o carrinho.',
        issues,
      );
    }
    const validLines = lines.filter((l): l is NonNullable<typeof l> => l !== null);

    // ── Totais calculados pelo servidor ──
    const deliveryFeeCents = isDelivery ? settings.deliveryFeeCents : 0;
    let totals;
    try {
      totals = computeOrderTotals(
        validLines.map((l) => l.lineTotalCents),
        deliveryFeeCents,
      );
    } catch {
      throw AppError.badRequest('Pedido grande demais. Reduza a quantidade de itens.');
    }

    // Pedido mínimo considera o subtotal (sem a taxa de entrega).
    if (totals.subtotalCents < settings.minOrderCents) {
      throw AppError.unprocessable(
        'MIN_ORDER_NOT_MET',
        'O subtotal está abaixo do pedido mínimo da loja',
        { minOrderCents: settings.minOrderCents, subtotalCents: totals.subtotalCents },
      );
    }

    // ── Gravação atômica (pedido + itens + adicionais + histórico inicial) ──
    for (let attempt = 1; attempt <= MAX_CREATE_ATTEMPTS; attempt++) {
      try {
        const order = await orderRepository.create({
          publicId: generatePublicId(),
          customerName: input.customer.name,
          customerPhone: input.customer.phone,
          fulfillmentType: input.fulfillmentType,
          deliveryAddress: input.deliveryAddress ?? null,
          deliveryReference: input.deliveryReference ?? null,
          customerNotes: input.customerNotes ?? null,
          ...totals,
          status: INITIAL_STATUS, // nunca nasce confirmado
          outsideBusinessHours,
          idempotencyKey,
          requestHash,
          items: {
            create: validLines.map((line, position) => ({
              position,
              product: { connect: { id: line.productId } },
              productName: line.productName,
              unitPriceCents: line.unitPriceCents,
              quantity: line.quantity,
              removedIngredients: line.removedIngredients,
              notes: line.notes,
              lineTotalCents: line.lineTotalCents,
              extras: {
                create: line.extras.map((e, j) => ({
                  position: j,
                  extra: { connect: { id: e.extraId } },
                  name: e.name,
                  unitPriceCents: e.unitPriceCents,
                  quantity: e.quantity,
                })),
              },
            })),
          },
          statusHistory: { create: { fromStatus: null, toStatus: INITIAL_STATUS, note: 'Pedido criado pelo site' } },
        });

        logger.info({ orderNumber: order.orderNumber, totalCents: order.totalCents, outsideBusinessHours }, 'Pedido criado');
        return { ...buildResult(order, settings, whatsappNumber, false), created: true };
      } catch (err) {
        if (isUniqueViolation(err)) {
          // Duas requisições simultâneas com a mesma chave: a perdedora devolve o pedido da vencedora.
          const winner = await orderRepository.findByIdempotencyKey(idempotencyKey);
          if (winner) return { ...replay(winner, requestHash, settings, whatsappNumber), created: false };
          continue; // colisão (improvável) de publicId: tenta de novo com outro identificador
        }
        if (isRecordMissing(err)) {
          // Produto/adicional removido entre a leitura e a gravação.
          throw AppError.unprocessable('ITEM_UNAVAILABLE', 'Um item deixou de estar disponível. Revise o carrinho.');
        }
        throw err;
      }
    }
    throw new Error('Não foi possível gerar um identificador público único para o pedido');
  },

  // Consulta pública: só pelo publicId aleatório; devolve o mínimo necessário.
  async getPublicSummary(publicId: string) {
    const order = await orderRepository.findByPublicId(publicId);
    if (!order) throw AppError.notFound('Pedido não encontrado');
    const settings = await settingsRepository.get();
    return toPublicOrderSummary(order, settings?.estimatedPrepMinutes ?? 0);
  },
};
