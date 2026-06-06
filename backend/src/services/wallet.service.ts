import { env, getIntegrationStatus } from "../config/env.js";
import { initializeAgentWallet, getCachedAgentWallet } from "../agent.js";
import {
  AGENT_WALLET_KEY,
  sandboxWalletAddressForUser,
} from "../lib/wallet-address.js";
import { executeTool } from "../mcp/tools/handlers.js";
import { getSavingsPlan } from "./savings-plan.service.js";
import { depositRepository } from "./deposit.repository.js";
import {
  getSpendingSummary,
  type SpendingSummary,
} from "./spending-tracker.service.js";

export type WalletMode = "agent" | "sandbox";

export interface WalletInfo {
  address: string;
  networkId: string;
  mode: WalletMode;
  balanceMxnb?: number;
  teeSpending: SpendingSummary;
  linkedWalletAddress?: string;
}

export async function resolveAgentWalletAddress(): Promise<{
  address: string;
  networkId: string;
  mode: WalletMode;
}> {
  if (env.ONCHAIN_SANDBOX_MODE || !getIntegrationStatus().cdpAgent) {
    return {
      address: sandboxWalletAddressForUser(AGENT_WALLET_KEY),
      networkId: env.NETWORK_ID,
      mode: "sandbox",
    };
  }

  const cached = getCachedAgentWallet();
  if (cached?.walletAddress) {
    return {
      address: cached.walletAddress,
      networkId: cached.networkId,
      mode: "agent",
    };
  }

  const { walletAddress, networkId } = await initializeAgentWallet();
  if (!walletAddress) {
    throw new Error("No se pudo resolver la dirección del monedero agéntico.");
  }

  return { address: walletAddress, networkId, mode: "agent" };
}

export async function getWalletForUser(userId: string): Promise<WalletInfo> {
  const plan = await getSavingsPlan(userId);
  const spending = await getSpendingSummary(AGENT_WALLET_KEY);

  if (env.ONCHAIN_SANDBOX_MODE || !getIntegrationStatus().cdpAgent) {
    const address = plan?.walletAddress ?? sandboxWalletAddressForUser(userId);
    const invested = await sumInvestedMxnb(userId);
    return {
      address,
      networkId: env.NETWORK_ID,
      mode: "sandbox",
      balanceMxnb: invested > 0 ? invested : 0,
      teeSpending: spending,
      linkedWalletAddress: plan?.linkedWalletAddress,
    };
  }

  const resolved = await resolveAgentWalletAddress();
  const address = plan?.walletAddress ?? resolved.address;

  let balanceMxnb: number | undefined;
  try {
    const balanceResult = await executeTool("get_balance", {});
    if (balanceResult.success) {
      const data = balanceResult.data as { balance?: unknown } | undefined;
      balanceMxnb = parseBalanceMxnb(data?.balance);
    }
  } catch {
    balanceMxnb = undefined;
  }

  return {
    address,
    networkId: resolved.networkId,
    mode: resolved.mode,
    balanceMxnb,
    teeSpending: spending,
    linkedWalletAddress: plan?.linkedWalletAddress,
  };
}

export async function listWalletTransactions(
  userId: string,
  limit = 20,
): Promise<
  Array<{
    fid: string;
    status: string;
    amountMxn: number;
    mxnbAmount?: number;
    txHash?: string;
    updatedAt: string;
  }>
> {
  const deposits = await depositRepository.listByUserId(userId, limit);
  return deposits.map((d) => ({
    fid: d.fid,
    status: d.status,
    amountMxn: d.amountMxn,
    mxnbAmount: d.mxnbAmount,
    txHash: d.txHash,
    updatedAt: d.updatedAt,
  }));
}

async function sumInvestedMxnb(userId: string): Promise<number> {
  try {
    const deposits = await depositRepository.listByUserId(userId, 100);
    return deposits
      .filter((d) => d.status === "invested")
      .reduce((sum, d) => sum + (d.mxnbAmount ?? d.amountMxn), 0);
  } catch {
    return 0;
  }
}

function parseBalanceMxnb(balance: unknown): number | undefined {
  if (balance == null) return undefined;
  if (typeof balance === "number") return balance;
  if (typeof balance === "string") {
    const n = Number.parseFloat(balance);
    return Number.isFinite(n) ? n : undefined;
  }
  if (typeof balance === "object") {
    const obj = balance as Record<string, unknown>;
    const amount = obj.amount ?? obj.value ?? obj.balance;
    return parseBalanceMxnb(amount);
  }
  return undefined;
}
