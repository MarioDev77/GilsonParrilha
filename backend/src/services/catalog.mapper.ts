// Mapeadores puros (sem acesso ao banco) com lista branca de campos.
export interface ExtraRow {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
}

export interface ProductRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  ingredients: string[];
  removableIngredients: string[];
  priceCents: number;
  imageUrl: string | null;
  isFeatured: boolean;
  isAvailable: boolean;
  category: { id: string; name: string; slug: string };
  // Vínculos de adicionais visíveis (a listagem traz no máximo 1, só para indicar que existem).
  extras?: unknown[];
}

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: { products: number };
}

// Nada interno (flags de admin, datas) vaza para o público.
export function toPublicExtra(row: ExtraRow) {
  return { id: row.id, name: row.name, description: row.description, priceCents: row.priceCents };
}

export function toPublicProduct(row: ProductRow) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    ingredients: row.ingredients,
    removableIngredients: row.removableIngredients,
    priceCents: row.priceCents,
    imageUrl: row.imageUrl,
    isFeatured: row.isFeatured,
    isAvailable: row.isAvailable,
    hasExtras: (row.extras?.length ?? 0) > 0,
    category: { id: row.category.id, name: row.category.name, slug: row.category.slug },
  };
}

export function toPublicCategory(row: CategoryRow) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    productCount: row._count.products,
  };
}

