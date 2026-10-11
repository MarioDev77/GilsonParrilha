import { API_URL } from "@/config/site";

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const ADMIN_UNAUTHORIZED_EVENT = "gilson:admin-unauthorized";

/**
 * Token CSRF do painel: o backend devolve no login e no /me e exige o cabeçalho X-CSRF-Token em toda
 * requisição que altera dados. Fica só em memória (nunca em localStorage); após recarregar a página, o /me o devolve de novo.
 */
let csrfToken: string | null = null;
export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

/** Metadados de paginação das listas do backend. */
export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

type Query = Record<string, string | number | boolean | null | undefined>;

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  formData?: FormData;
  query?: Query;
  headers?: Record<string, string>;
  /** Requisição administrativa: 401 dispara o evento de sessão expirada. */
  admin?: boolean;
  signal?: AbortSignal;
  timeoutMs?: number;
}

function buildQuery(query?: Query): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

function genericMessage(status: number): string {
  switch (status) {
    case 400:
    case 422:
      return "Alguns dados não foram aceitos. Revise as informações e tente de novo.";
    case 401:
      return "Sua sessão expirou. Entre novamente para continuar.";
    case 403:
      return "Você não tem permissão para fazer isso.";
    case 404:
      return "Não encontramos o que você procura.";
    case 409:
      return "Essa ação entrou em conflito com o estado atual. Atualize a página e tente de novo.";
    case 429:
      return "Muitas tentativas seguidas. Aguarde um instante e tente de novo.";
    default:
      return status >= 500
        ? "O servidor está com problemas no momento. Tente novamente em instantes."
        : "Não foi possível concluir a operação.";
  }
}

function validationMessage(details: unknown): string | null {
  if (!Array.isArray(details)) return null;
  for (const d of details) {
    const m = (d as { message?: unknown } | null)?.message;
    if (typeof m === "string" && m) return m;
  }
  return null;
}

/** Faz a chamada e devolve o corpo JSON já interpretado (envelope `{ data }` / `{ data, meta }` intacto). */
async function send(path: string, opts: RequestOptions): Promise<unknown> {
  const { method = "GET", body, formData, query, headers = {}, admin = false, signal, timeoutMs = 20_000 } = opts;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  signal?.addEventListener("abort", () => controller.abort());

  const init: RequestInit = {
    method,
    credentials: "include", // sessão administrativa via cookie httpOnly definido pelo backend
    signal: controller.signal,
    headers: { Accept: "application/json", ...headers },
  };
  if (csrfToken && method !== "GET") (init.headers as Record<string, string>)["X-CSRF-Token"] = csrfToken;
  if (formData) {
    init.body = formData;
  } else if (body !== undefined) {
    (init.headers as Record<string, string>)["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}${buildQuery(query)}`, init);
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new ApiError(
      "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
      0,
      "network"
    );
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 204) return undefined;

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    if (res.status === 401 && admin && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(ADMIN_UNAUTHORIZED_EVENT));
    }
    // O backend responde erros como { error: { code, message, details? } }.
    const payload = ((data as { error?: unknown } | null)?.error ?? {}) as { message?: unknown; code?: unknown; details?: unknown };
    const code = typeof payload.code === "string" ? payload.code : undefined;
    // Mensagens do servidor só em erros 4xx (validação/regra). 5xx ficam genéricas; um 401 no painel vira "sessão expirou",
    // mas no login (admin: false) a mensagem do servidor ("e-mail ou senha inválidos") é a útil.
    const showServer = res.status < 500 && (res.status !== 401 || !admin) && code !== "CSRF_INVALID";
    const serverMessage = showServer ? validationMessage(payload.details) ?? (typeof payload.message === "string" ? payload.message : null) : null;
    const message = code === "CSRF_INVALID" ? "Sua sessão de segurança expirou. Recarregue a página e entre novamente." : serverMessage ?? genericMessage(res.status);
    throw new ApiError(message, res.status, code, payload.details);
  }

  return data;
}

/** Chamada comum: o backend envolve o sucesso em `{ data }`; aqui devolvemos só o `data`. */
export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const body = await send(path, opts);
  if (body === undefined) return undefined as T;
  return (body as { data: T } | null)?.data as T;
}

/** Listas paginadas: `{ data, meta }`. */
export async function requestPage<T>(path: string, opts: RequestOptions = {}): Promise<{ data: T[]; meta: PageMeta }> {
  return (await send(path, opts)) as { data: T[]; meta: PageMeta };
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return "Algo deu errado. Tente novamente.";
}
