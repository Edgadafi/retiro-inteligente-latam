export type DepositUiPhase = 1 | 2 | 3 | "error";

export interface DepositUiState {
  phase: DepositUiPhase;
  label: string;
  description: string;
  isComplete: boolean;
  isFailed: boolean;
}

export interface DepositRecord {
  fid: string;
  status: string;
  amountMxn: number;
  mxnbAmount?: number;
  metadata?: Record<string, unknown>;
}

export interface DepositStatusResponse {
  status: "success" | "error";
  data?: {
    deposit: DepositRecord;
    ui: DepositUiState;
    stateLogs: Array<{ id: string; status: string; message?: string }>;
  };
  error?: string;
}

export interface DbConnectionResponse {
  status: "success" | "error";
  data: {
    connection: "active" | "inactive" | "degraded";
    timestamp: string;
    db_schema: "confirmed" | "incomplete" | "unknown";
  };
  error?: string;
}

export interface SimulateSpeiResponse {
  status: "success" | "error";
  data?: {
    fid: string;
    deposit: DepositRecord;
    ui: DepositUiState;
    pollUrl: string;
    message: string;
  };
  error?: string;
}

export async function testDbConnection(): Promise<DbConnectionResponse> {
  const res = await fetch("/api/test-db-connection", { method: "POST" });
  return res.json() as Promise<DbConnectionResponse>;
}

export async function fetchDepositStatus(fid: string): Promise<DepositStatusResponse> {
  const res = await fetch(`/api/deposits/${fid}`);
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Error consultando depósito");
  }
  return res.json() as Promise<DepositStatusResponse>;
}

export function pollDepositUntilSettled(
  fid: string,
  onUpdate: (data: NonNullable<DepositStatusResponse["data"]>) => void,
  intervalMs = 1500,
): () => void {
  let active = true;

  const tick = async () => {
    if (!active) return;
    try {
      const res = await fetchDepositStatus(fid);
      if (res.data) {
        onUpdate(res.data);
        if (res.data.ui.isComplete || res.data.ui.isFailed) return;
      }
    } catch {
      // sigue polling en demo
    }
    if (active) setTimeout(tick, intervalMs);
  };

  void tick();

  return () => {
    active = false;
  };
}
