import { computeLineTotal } from './order-pricing';

// Regra ÚNICA de validação/preço dos itens, usada pela criação do pedido e pela cotação do carrinho.
// Módulo puro (sem banco): recebe os produtos já carregados e devolve linhas e problemas.

export type ItemIssueReason = 'PRODUCT_UNAVAILABLE' | 'EXTRA_NOT_ALLOWED' | 'EXTRA_UNAVAILABLE' | 'INGREDIENT_NOT_REMOVABLE';

export interface ItemIssue {
  itemIndex: number;
  reason: ItemIssueReason;
  productId: string;
  extraId?: string;
  ingredient?: string;
}

export interface ProductForOrder {
  id: string;
  name: string;
  priceCents: number;
  imageUrl?: string | null;
  isAvailable: boolean;
  removableIngredients: string[];
  extras: {
    extra: {
      id: string;
      name: string;
      priceCents: number;
      isActive: boolean;
      isAvailable: boolean;
      archivedAt: Date | null;
    };
  }[];
}

export interface OrderItemRequest {
  productId: string;
  quantity: number;
  extras: { extraId: string; quantity: number }[];
  removedIngredients: string[];
  notes?: string | undefined;
}

export interface ResolvedExtra {
  extraId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
}

export interface ResolvedLine {
  productId: string;
  productName: string;
  imageUrl: string | null;
  unitPriceCents: number;
  quantity: number;
  removedIngredients: string[];
  notes: string | null;
  extras: ResolvedExtra[];
  lineTotalCents: number;
}

export interface ResolvedItems {
  /** Mesma ordem dos itens pedidos. `null` = produto inexistente ou indisponível. */
  lines: (ResolvedLine | null)[];
  issues: ItemIssue[];
}

export function resolveOrderItems(items: OrderItemRequest[], products: Map<string, ProductForOrder>): ResolvedItems {
  const issues: ItemIssue[] = [];

  const lines = items.map((item, itemIndex): ResolvedLine | null => {
    const product = products.get(item.productId);
    if (!product || !product.isAvailable) {
      issues.push({ itemIndex, reason: 'PRODUCT_UNAVAILABLE', productId: item.productId });
      return null;
    }

    const allowed = new Map(product.extras.map((pe) => [pe.extra.id, pe.extra]));
    const extras: ResolvedExtra[] = [];
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
      imageUrl: product.imageUrl ?? null,
      unitPriceCents: product.priceCents,
      quantity: item.quantity,
      removedIngredients: removed,
      notes: item.notes ?? null,
      extras,
      lineTotalCents: computeLineTotal({ unitPriceCents: product.priceCents, quantity: item.quantity, extras }),
    };
  });

  return { lines, issues };
}

// Mensagem legível (pt-BR) para a cotação do carrinho.
export function describeItemIssue(issue: ItemIssue, productName: string | null): string {
  const name = productName ?? 'Item';
  switch (issue.reason) {
    case 'PRODUCT_UNAVAILABLE':
      return 'Este item não está mais disponível. Remova-o do carrinho.';
    case 'EXTRA_NOT_ALLOWED':
      return `${name}: um dos adicionais escolhidos não pode ser usado neste item.`;
    case 'EXTRA_UNAVAILABLE':
      return `${name}: um dos adicionais escolhidos não está disponível no momento.`;
    case 'INGREDIENT_NOT_REMOVABLE':
      return `${name}: o ingrediente "${issue.ingredient ?? ''}" não pode ser retirado.`;
  }
}
