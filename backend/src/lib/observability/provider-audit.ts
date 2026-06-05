export type PaymentProvider = "juno" | "bitso" | "etherfuse";

/**
 * Estructura estándar para metadata JSONB en deposit_state_logs.
 * Permite debugging sin reconstruir estado desde logs de aplicación.
 */
export interface ProviderAuditRecord {
  provider: PaymentProvider;
  operation: string;
  httpStatus?: number;
  requestedAt: string;
  respondedAt: string;
  durationMs: number;
  /** Respuesta cruda del proveedor (sanitizada — sin tokens ni PII sensible). */
  rawResponse?: unknown;
  /** Payload de entrada relevante (webhook body, query params, etc.). */
  rawRequest?: unknown;
  error?: string;
}

const SENSITIVE_KEYS = new Set([
  "authorization",
  "api_key",
  "apikey",
  "secret",
  "token",
  "password",
  "private_key",
  "privatekey",
]);

/** Elimina claves sensibles de objetos antes de persistir en JSONB. */
export function sanitizeForAudit(value: unknown, depth = 0): unknown {
  if (depth > 8) return "[max depth]";
  if (value == null || typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForAudit(item, depth + 1));
  }

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      result[key] = "[redacted]";
      continue;
    }
    result[key] = sanitizeForAudit(val, depth + 1);
  }
  return result;
}

export function buildProviderAudit(params: {
  provider: PaymentProvider;
  operation: string;
  requestedAt: string;
  respondedAt: string;
  httpStatus?: number;
  rawResponse?: unknown;
  rawRequest?: unknown;
  error?: string;
}): ProviderAuditRecord {
  return {
    provider: params.provider,
    operation: params.operation,
    httpStatus: params.httpStatus,
    requestedAt: params.requestedAt,
    respondedAt: params.respondedAt,
    durationMs: new Date(params.respondedAt).getTime() - new Date(params.requestedAt).getTime(),
    rawResponse: params.rawResponse != null ? sanitizeForAudit(params.rawResponse) : undefined,
    rawRequest: params.rawRequest != null ? sanitizeForAudit(params.rawRequest) : undefined,
    error: params.error,
  };
}

/** Envuelve metadata de state log con la convención providerAudit. */
export function auditMetadata(
  audit: ProviderAuditRecord,
  extra?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    providerAudit: audit,
    ...extra,
  };
}
