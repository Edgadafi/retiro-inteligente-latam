export interface TeeSpending {
  dailyLimitMxnb: number;
  spentTodayMxnb: number;
  remainingMxnb: number;
  resetWindowHours: number;
}

export interface WalletResponse {
  address: string;
  networkId: string;
  mode: "agent" | "sandbox";
  balanceMxnb?: number;
  teeSpending: TeeSpending;
  linkedWalletAddress?: string;
  explorerUrl?: string;
}

export interface WalletTransaction {
  fid: string;
  status: string;
  amountMxn: number;
  mxnbAmount?: number;
  txHash?: string;
  updatedAt: string;
}

export interface OnboardingWallet {
  address: string;
  networkId: string;
  mode: "agent" | "sandbox";
}

export async function fetchWallet(userId: string): Promise<WalletResponse> {
  const res = await fetch(`/api/wallet?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error("Error al cargar wallet");
  return res.json() as Promise<WalletResponse>;
}

export async function fetchWalletTransactions(
  userId: string,
  limit = 10,
): Promise<WalletTransaction[]> {
  const res = await fetch(
    `/api/wallet/transactions?userId=${encodeURIComponent(userId)}&limit=${limit}`,
  );
  if (!res.ok) throw new Error("Error al cargar transacciones");
  const body = (await res.json()) as { transactions: WalletTransaction[] };
  return body.transactions;
}

export async function linkWallet(params: {
  userId: string;
  message: string;
  signature: string;
}): Promise<{ linkedWalletAddress: string }> {
  const res = await fetch("/api/wallet/link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const body = (await res.json()) as { linkedWalletAddress?: string; error?: string };
  if (!res.ok) throw new Error(body.error ?? "Error al vincular wallet");
  return { linkedWalletAddress: body.linkedWalletAddress! };
}

export async function requestWithdraw(params: {
  userId: string;
  amountMxnb: number;
}): Promise<{ status: string; message: string }> {
  const res = await fetch("/api/wallet/withdraw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const body = (await res.json()) as { status: string; message: string; error?: string };
  if (!res.ok) throw new Error(body.error ?? "Error al solicitar retiro");
  return body;
}

export function truncateAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}
