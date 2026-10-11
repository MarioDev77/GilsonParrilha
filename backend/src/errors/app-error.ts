export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'BAD_REQUEST'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'RATE_LIMITED'
  | 'CSRF_INVALID'
  | 'INVALID_STATUS_TRANSITION'
  | 'IDEMPOTENCY_CONFLICT'
  | 'STORE_CLOSED'
  | 'ITEM_UNAVAILABLE'
  | 'MIN_ORDER_NOT_MET'
  | 'FULFILLMENT_UNAVAILABLE'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static badRequest(message = 'Requisição inválida', details?: unknown) {
    return new AppError(400, 'BAD_REQUEST', message, details);
  }
  static validation(details: unknown, message = 'Dados inválidos') {
    return new AppError(400, 'VALIDATION_ERROR', message, details);
  }
  static unauthenticated(message = 'Não autenticado') {
    return new AppError(401, 'UNAUTHENTICATED', message);
  }
  static forbidden(message = 'Acesso negado') {
    return new AppError(403, 'FORBIDDEN', message);
  }
  static notFound(message = 'Recurso não encontrado') {
    return new AppError(404, 'NOT_FOUND', message);
  }
  // Regra de negócio violada (entrada válida, mas pedido não pode ser aceito).
  static unprocessable(code: ErrorCode, message: string, details?: unknown) {
    return new AppError(422, code, message, details);
  }
  static conflict(message = 'Conflito', details?: unknown) {
    return new AppError(409, 'CONFLICT', message, details);
  }
  static unavailable(message = 'Serviço indisponível') {
    return new AppError(503, 'SERVICE_UNAVAILABLE', message);
  }
}
