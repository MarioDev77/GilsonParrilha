import { API_URL } from "@/config/site";

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export const ADMIN_UNAUTHORIZED_EVENT = "gilson:admin-unauthorized";

type Query = Record<string, string | number | boolean | null | undefined>;

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
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

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
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

  if (res.status === 204) return undefined as T;

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
    const payload = (data ?? {}) as { message?: unknown; code?: unknown };
    // Só mostramos mensagens do servidor em erros de validação/regra (4xx); erros 5xx ficam genéricos.
    const safe = res.status < 500 && res.status !== 401 && typeof payload.message === "string" ? payload.message : null;
    throw new ApiError(safe ?? genericMessage(res.status), res.status, typeof payload.code === "string" ? payload.code : undefined);
  }

  return data as T;
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return "Algo deu errado. Tente novamente.";
}
