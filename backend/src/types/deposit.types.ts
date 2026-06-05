export type DepositStatus =
  | "pending"
  | "processing"
  | "settled"
  | "investing"
  | "invested"
  | "failed";

export interface DepositRecord {
  id: string;
  fid: string;
  userId: string;
  clabe: string;
  amountMxn: number;
  status: DepositStatus;
  mxnbAmount?: number;
  txHash?: string;
  retryCount: number;
  lastError?: string;
  webhookEvent?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  settledAt?: string;
}

export interface DepositStateLog {
  id: string;
  depositId: string;
  fid: string;
  fromStatus?: DepositStatus;
  toStatus: DepositStatus;
  message?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface CreateDepositInput {
  fid: string;
  userId: string;
  clabe: string;
  amountMxn: number;
  status: DepositStatus;
  webhookEvent?: string;
  metadata?: Record<string, unknown>;
}
