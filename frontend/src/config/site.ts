/** Configurações do frontend. Nada aqui é segredo. */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api/v1").replace(/\/+$/, "");
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Nome usado enquanto as configurações da API não carregam e na logo tipográfica provisória. */
export const BRAND = { first: "GILSON", second: "PARRILHA" } as const;

/**
 * Seções da página inicial que agrupam categorias pelo slug cadastrado no backend.
 * Se nenhum produto existir nas categorias listadas, a seção simplesmente não aparece.
 */
export const HOME_SECTIONS = [
  { id: "combos", title: "Combos", slugs: ["combos", "combo"] },
  { id: "acompanhamentos", title: "Acompanhamentos e bebidas", slugs: ["porcoes", "acompanhamentos", "bebidas"] },
] as const;

export const CART_STORAGE_KEY = "gilson-parrilha:carrinho:v1";
export const ORDER_STORAGE_PREFIX = "gilson-parrilha:pedido:";
export const POLL_INTERVAL_MS = 20_000;

/** Fuso do estabelecimento: o selo "aberto agora" usa este horário, não o do aparelho do cliente. */
export const BUSINESS_TZ = "America/Bahia";

/** Chave do sessionStorage que marca a abertura (BrandIntro) já exibida nesta sessão. */
export const INTRO_SEEN_KEY = "gilson-parrilha:intro:v1";
