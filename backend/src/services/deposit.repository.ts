import { randomUUID } from "node:crypto";
import { getSupabase, isSupabaseConfigured } from "../db/supabase.client.js";
import { env } from "../config/env.js";
import type { ProviderAuditRecord } from "../lib/observability/provider-audit.js";
import { auditMetadata } from "../lib/observability/provider-audit.js";
import type {
  CreateDepositInput,
  DepositRecord,
  DepositStateLog,
  DepositStatus,
} from "../types/deposit.types.js";

/** Fallback en memoria solo para desarrollo sin Supabase */
const memoryDeposits = new Map<string, DepositRecord>();
const memoryLogs: DepositStateLog[] = [];

function rowToDeposit(row: Record<string, unknown>): DepositRecord {
  return {
    id: String(row.id),
    fid: String(row.fid),
    userId: String(row.user_id),
    clabe: String(row.clabe),
    amountMxn: Number(row.amount_mxn),
    status: row.status as DepositStatus,
    mxnbAmount: row.mxnb_amount != null ? Number(row.mxnb_amount) : undefined,
    txHash: row.tx_hash != null ? String(row.tx_hash) : undefined,
    retryCount: Number(row.retry_count ?? 0),
    lastError: row.last_error != null ? String(row.last_error) : undefined,
    webhookEvent: row.webhook_event != null ? String(row.webhook_event) : undefined,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    settledAt: row.settled_at != null ? String(row.settled_at) : undefined,
  };
}

async function appendStateLog(params: {
  depositId: string;
  fid: string;
  fromStatus?: DepositStatus;
  toStatus: DepositStatus;
  message?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const log: DepositStateLog = {
    id: randomUUID(),
    depositId: params.depositId,
    fid: params.fid,
    fromStatus: params.fromStatus,
    toStatus: params.toStatus,
    message: params.message,
    metadata: params.metadata,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    await supabase.from("deposit_state_logs").insert({
      deposit_id: params.depositId,
      fid: params.fid,
      from_status: params.fromStatus ?? null,
      to_status: params.toStatus,
      message: params.message ?? null,
      metadata: params.metadata ?? {},
    });
    return;
  }

  memoryLogs.push(log);
}

export class DepositRepository {
  async findByFid(fid: string): Promise<DepositRecord | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabase()
        .from("deposits")
        .select("*")
        .eq("fid", fid)
        .maybeSingle();

      if (error) throw new Error(`Supabase findByFid: ${error.message}`);
      return data ? rowToDeposit(data) : null;
    }

    return memoryDeposits.get(fid) ?? null;
  }

  async create(input: CreateDepositInput): Promise<DepositRecord> {
    const existing = await this.findByFid(input.fid);
    if (existing) return existing;

    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabase()
        .from("deposits")
        .insert({
          fid: input.fid,
          user_id: input.userId,
          clabe: input.clabe,
          amount_mxn: input.amountMxn,
          status: input.status,
          webhook_event: input.webhookEvent ?? null,
          metadata: input.metadata ?? {},
        })
        .select("*")
        .single();

      if (error) throw new Error(`Supabase create deposit: ${error.message}`);
      const deposit = rowToDeposit(data);

      await appendStateLog({
        depositId: deposit.id,
        fid: deposit.fid,
        toStatus: deposit.status,
        message: "Depósito registrado desde webhook SPEI",
        metadata: input.metadata,
      });

      return deposit;
    }

    if (env.NODE_ENV === "production") {
      throw new Error("Supabase es obligatorio en producción para depósitos SPEI.");
    }

    const deposit: DepositRecord = {
      id: randomUUID(),
      fid: input.fid,
      userId: input.userId,
      clabe: input.clabe,
      amountMxn: input.amountMxn,
      status: input.status,
      retryCount: 0,
      webhookEvent: input.webhookEvent,
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    };

    memoryDeposits.set(deposit.fid, deposit);
    await appendStateLog({
      depositId: deposit.id,
      fid: deposit.fid,
      toStatus: deposit.status,
      message: "[dev] Depósito en memoria",
    });

    console.warn("[Deposit] Supabase no configurado — usando almacenamiento en memoria.");
    return deposit;
  }

  async transitionStatus(
    fid: string,
    toStatus: DepositStatus,
    updates: Partial<{
      mxnbAmount: number;
      txHash: string;
      lastError: string;
      retryCount: number;
      settledAt: string;
      metadata: Record<string, unknown>;
    }> = {},
  ): Promise<DepositRecord> {
    const current = await this.findByFid(fid);
    if (!current) throw new Error(`Depósito no encontrado: fid=${fid}`);

    const fromStatus = current.status;
    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      const patch: Record<string, unknown> = {
        status: toStatus,
        retry_count: updates.retryCount ?? current.retryCount,
      };
      if (updates.mxnbAmount != null) patch.mxnb_amount = updates.mxnbAmount;
      if (updates.txHash != null) patch.tx_hash = updates.txHash;
      if (updates.lastError != null) patch.last_error = updates.lastError;
      if (updates.settledAt != null) patch.settled_at = updates.settledAt;
      if (updates.metadata != null) {
        patch.metadata = { ...current.metadata, ...updates.metadata };
      }

      const { data, error } = await getSupabase()
        .from("deposits")
        .update(patch)
        .eq("fid", fid)
        .select("*")
        .single();

      if (error) throw new Error(`Supabase transition: ${error.message}`);

      await appendStateLog({
        depositId: current.id,
        fid,
        fromStatus,
        toStatus,
        message: `Transición ${fromStatus} → ${toStatus}`,
        metadata: updates.metadata,
      });

      return rowToDeposit(data);
    }

    const updated: DepositRecord = {
      ...current,
      status: toStatus,
      mxnbAmount: updates.mxnbAmount ?? current.mxnbAmount,
      txHash: updates.txHash ?? current.txHash,
      lastError: updates.lastError ?? current.lastError,
      retryCount: updates.retryCount ?? current.retryCount,
      settledAt: updates.settledAt ?? current.settledAt,
      metadata: { ...current.metadata, ...updates.metadata },
      updatedAt: now,
    };

    memoryDeposits.set(fid, updated);
    await appendStateLog({
      depositId: updated.id,
      fid,
      fromStatus,
      toStatus,
      message: `[dev] Transición ${fromStatus} → ${toStatus}`,
      metadata: updates.metadata,
    });

    return updated;
  }

  /**
   * Registra respuesta cruda de Juno/Bitso en deposit_state_logs.metadata (JSONB)
   * sin cambiar el estado del depósito — ideal para debugging de polling SPEI.
   */
  async logProviderAudit(params: {
    fid: string;
    message: string;
    audit: ProviderAuditRecord;
    extra?: Record<string, unknown>;
  }): Promise<void> {
    const deposit = await this.findByFid(params.fid);
    if (!deposit) {
      throw new Error(`Depósito no encontrado para audit: fid=${params.fid}`);
    }

    await appendStateLog({
      depositId: deposit.id,
      fid: params.fid,
      fromStatus: deposit.status,
      toStatus: deposit.status,
      message: params.message,
      metadata: auditMetadata(params.audit, params.extra),
    });
  }

  async listByStatus(statuses: DepositStatus[]): Promise<DepositRecord[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabase()
        .from("deposits")
        .select("*")
        .in("status", statuses)
        .order("updated_at", { ascending: true });

      if (error) throw new Error(`Supabase listByStatus: ${error.message}`);
      return (data ?? []).map(rowToDeposit);
    }

    return [...memoryDeposits.values()].filter((d) => statuses.includes(d.status));
  }

  async getStateLogs(fid: string): Promise<DepositStateLog[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabase()
        .from("deposit_state_logs")
        .select("*")
        .eq("fid", fid)
        .order("created_at", { ascending: true });

      if (error) throw new Error(`Supabase getStateLogs: ${error.message}`);
      return (data ?? []).map((row) => ({
        id: String(row.id),
        depositId: String(row.deposit_id),
        fid: String(row.fid),
        fromStatus: row.from_status as DepositStatus | undefined,
        toStatus: row.to_status as DepositStatus,
        message: row.message != null ? String(row.message) : undefined,
        metadata: (row.metadata as Record<string, unknown>) ?? {},
        createdAt: String(row.created_at),
      }));
    }

    return memoryLogs.filter((l) => l.fid === fid);
  }
}

export const depositRepository = new DepositRepository();
