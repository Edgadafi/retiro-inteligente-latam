import { env } from "../config/env.js";
import {
  buildProviderAudit,
  type ProviderAuditRecord,
} from "../lib/observability/provider-audit.js";

export interface JunoClabeAccount {
  userId: string;
  clabe: string;
  type: "AUTO_PAYMENT";
  network: "arbitrum-sepolia";
}

export interface JunoSettlementStatus {
  status: "pending" | "completed" | "failed";
  mxnbAmount?: string;
  txHash?: string;
}

export interface JunoCallResult<T> {
  data: T;
  audit: ProviderAuditRecord;
}

export class JunoApiError extends Error {
  constructor(
    message: string,
    readonly audit: ProviderAuditRecord,
  ) {
    super(message);
    this.name = "JunoApiError";
  }
}

/**
 * Juno API — creación de CLABE virtual AUTO_PAYMENT por usuario.
 * Sandbox: https://stage.buildwithjuno.com
 */
export class JunoService {
  private readonly baseUrl: string;
  private readonly apiKey?: string;

  constructor() {
    this.baseUrl = env.JUNO_API_BASE_URL;
    this.apiKey = env.JUNO_API_KEY;
  }

  private authHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
    };
  }

  private async request<T>(params: {
    operation: string;
    method: "GET" | "POST";
    path: string;
    body?: unknown;
  }): Promise<JunoCallResult<T>> {
    const requestedAt = new Date().toISOString();
    const url = `${this.baseUrl}${params.path}`;

    const response = await fetch(url, {
      method: params.method,
      headers: this.authHeaders(),
      body: params.body != null ? JSON.stringify(params.body) : undefined,
    });

    const respondedAt = new Date().toISOString();
    const rawText = await response.text();
    let rawResponse: unknown = rawText;

    try {
      rawResponse = rawText ? JSON.parse(rawText) : null;
    } catch {
      rawResponse = { rawText };
    }

    const audit = buildProviderAudit({
      provider: "juno",
      operation: params.operation,
      requestedAt,
      respondedAt,
      httpStatus: response.status,
      rawRequest: {
        method: params.method,
        path: params.path,
        headers: { Authorization: this.apiKey ? "Bearer [redacted]" : undefined },
        body: params.body,
      },
      rawResponse,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    });

    if (!response.ok) {
      throw new JunoApiError(
        `Juno ${params.operation} failed: ${response.status} — ${rawText}`,
        audit,
      );
    }

    return { data: rawResponse as T, audit };
  }

  async createAutoPaymentClabe(userId: string): Promise<JunoCallResult<JunoClabeAccount>> {
    const result = await this.request<{ clabe: string }>({
      operation: "createAutoPaymentClabe",
      method: "POST",
      path: "/v1/accounts/clabe",
      body: {
        external_user_id: userId,
        type: "AUTO_PAYMENT",
        currency: "MXN",
        settlement: { asset: "MXNB", network: "arbitrum-sepolia" },
      },
    });

    return {
      audit: result.audit,
      data: {
        userId,
        clabe: result.data.clabe,
        type: "AUTO_PAYMENT",
        network: "arbitrum-sepolia",
      },
    };
  }

  async getUserByClabe(
    clabe: string,
  ): Promise<JunoCallResult<{ userId: string; clabe: string } | null>> {
    const requestedAt = new Date().toISOString();
    const path = `/v1/accounts/clabe/${encodeURIComponent(clabe)}`;
    const url = `${this.baseUrl}${path}`;

    const response = await fetch(url, { headers: this.authHeaders() });
    const respondedAt = new Date().toISOString();
    const rawText = await response.text();

    let rawResponse: unknown = rawText;
    try {
      rawResponse = rawText ? JSON.parse(rawText) : null;
    } catch {
      rawResponse = { rawText };
    }

    const audit = buildProviderAudit({
      provider: "juno",
      operation: "getUserByClabe",
      requestedAt,
      respondedAt,
      httpStatus: response.status,
      rawRequest: { method: "GET", path, clabe },
      rawResponse,
    });

    if (response.status === 404) {
      return { data: null, audit };
    }

    if (!response.ok) {
      throw new JunoApiError(`Juno CLABE lookup failed: ${response.status}`, audit);
    }

    const parsed = rawResponse as { external_user_id: string; clabe: string };
    return {
      data: { userId: parsed.external_user_id, clabe: parsed.clabe },
      audit,
    };
  }

  /**
   * Tras depósito SPEI, Juno mintea MXNB automáticamente.
   * Retorna respuesta cruda + audit para deposit_state_logs.
   */
  async getSettlementStatus(fid: string): Promise<JunoCallResult<JunoSettlementStatus>> {
    const result = await this.request<JunoSettlementStatus>({
      operation: "getSettlementStatus",
      method: "GET",
      path: `/v1/fundings/${fid}`,
    });

    return result;
  }
}

export const junoService = new JunoService();
