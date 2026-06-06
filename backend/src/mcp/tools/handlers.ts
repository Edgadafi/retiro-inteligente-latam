import {
  GetWalletDetailsAction,
  GetBalanceAction,
  TransferAction,
} from "@coinbase/cdp-agentkit-core";
import { enforceTeePolicy, getAgentkit } from "../../agent.js";
import { CONTRACTS } from "../../config/contracts.js";
import { etherfuseService } from "../../services/etherfuse.service.js";
import { compareWithAfore, projectRetirementFund } from "../../services/projection.service.js";
import {
  getOrCreateSavingsPlan,
  getSavingsPlan,
  updateSavingsPlan,
} from "../../services/savings-plan.service.js";
import {
  getDailySpentMxnb,
  getSpendingSummary,
  recordSpend,
} from "../../services/spending-tracker.service.js";

export type ToolResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

const walletDetailsAction = new GetWalletDetailsAction();
const getBalanceAction = new GetBalanceAction();
const transferAction = new TransferAction();

export async function handleGetWalletDetails(): Promise<ToolResult> {
  try {
    const agentkit = await getAgentkit();
    const result = await agentkit.run(walletDetailsAction, {} as never);
    const spending = await getSpendingSummary("default-wallet");
    return {
      success: true,
      data: { wallet: result, teeSpending: spending },
    };
  } catch (error) {
    return toolError(error);
  }
}

export async function handleGetBalance(args: {
  assetId?: string;
}): Promise<ToolResult> {
  try {
    const agentkit = await getAgentkit();
    const assetId = args.assetId ?? CONTRACTS.arbitrumSepolia.mxnb.proxy;
    const result = await agentkit.run(getBalanceAction, { assetId } as never);
    return { success: true, data: { assetId, balance: result } };
  } catch (error) {
    return toolError(error);
  }
}

export async function handleTransfer(args: {
  amount: number;
  assetId?: string;
  destination: string;
  gasless?: boolean;
}): Promise<ToolResult> {
  try {
    const walletKey = "default-wallet";
    const amount = args.amount;

    const dailySpent = await getDailySpentMxnb(walletKey);
    enforceTeePolicy({
      toAddress: args.destination,
      amountMxnb: amount,
      dailySpentMxnb: dailySpent,
    });

    const agentkit = await getAgentkit();
    const result = await agentkit.run(transferAction, {
      amount,
      assetId: args.assetId ?? CONTRACTS.arbitrumSepolia.mxnb.proxy,
      destination: args.destination,
      gasless: args.gasless ?? false,
    } as never);

    await recordSpend(walletKey, amount);

    return {
      success: true,
      data: {
        transfer: result,
        spending: await getSpendingSummary(walletKey),
      },
    };
  } catch (error) {
    return toolError(error);
  }
}

export async function handleQuoteStablebond(args: {
  amountMxnb: number;
}): Promise<ToolResult> {
  try {
    const quote = await etherfuseService.getQuote(args.amountMxnb);
    return { success: true, data: quote };
  } catch (error) {
    return toolError(error);
  }
}

export async function handlePurchaseStablebond(args: {
  quoteId: string;
  amountMxnb: number;
  walletAddress?: string;
}): Promise<ToolResult> {
  try {
    const walletKey = args.walletAddress ?? "default-wallet";
    const dailySpent = await getDailySpentMxnb(walletKey);

    enforceTeePolicy({
      toAddress: CONTRACTS.arbitrumOne.cetes.address,
      amountMxnb: args.amountMxnb,
      dailySpentMxnb: dailySpent,
    });

    const order = await etherfuseService.purchaseStablebond({
      quoteId: args.quoteId,
      amountMxnb: args.amountMxnb,
      walletAddress: walletKey,
      dailySpentMxnb: dailySpent,
    });

    await recordSpend(walletKey, args.amountMxnb);

    return {
      success: true,
      data: {
        order,
        spending: await getSpendingSummary(walletKey),
      },
    };
  } catch (error) {
    return toolError(error);
  }
}

export async function handleProjectRetirementFund(args: {
  contributionPerPeriod: number;
  periods: number;
  frequency?: "daily" | "weekly";
  annualRate?: number;
}): Promise<ToolResult> {
  try {
    const projection = projectRetirementFund({
      contributionPerPeriod: args.contributionPerPeriod,
      periods: args.periods,
      frequency: args.frequency ?? "daily",
      annualRate: args.annualRate,
    });
    return { success: true, data: compareWithAfore(projection) };
  } catch (error) {
    return toolError(error);
  }
}

export async function handleGetSavingsPlan(args: {
  userId: string;
  createIfMissing?: boolean;
}): Promise<ToolResult> {
  try {
    if (args.createIfMissing) {
      const plan = await getOrCreateSavingsPlan(args.userId);
      return { success: true, data: plan };
    }

    const plan = await getSavingsPlan(args.userId);
    if (!plan) {
      return { success: false, error: `Plan de ahorro no encontrado para userId=${args.userId}` };
    }
    return { success: true, data: plan };
  } catch (error) {
    return toolError(error);
  }
}

export async function handleUpdateSavingsPlan(args: {
  userId: string;
  contributionAmount?: number;
  contributionFrequency?: "daily" | "weekly";
  targetYears?: number;
  autoInvestCetes?: boolean;
}): Promise<ToolResult> {
  try {
    await getOrCreateSavingsPlan(args.userId);
    const { userId, ...updates } = args;
    const updated = updateSavingsPlan(userId, updates);
    return { success: true, data: updated };
  } catch (error) {
    return toolError(error);
  }
}

export const toolHandlers = {
  get_wallet_details: handleGetWalletDetails,
  get_balance: handleGetBalance,
  transfer: handleTransfer,
  quote_stablebond: handleQuoteStablebond,
  purchase_stablebond: handlePurchaseStablebond,
  project_retirement_fund: handleProjectRetirementFund,
  get_savings_plan: handleGetSavingsPlan,
  update_savings_plan: handleUpdateSavingsPlan,
} as const;

export type ToolName = keyof typeof toolHandlers;

export async function executeTool(
  name: ToolName,
  args: Record<string, unknown> = {},
): Promise<ToolResult> {
  const handler = toolHandlers[name];
  if (!handler) {
    return { success: false, error: `Herramienta desconocida: ${name}` };
  }
  return (handler as (a: Record<string, unknown>) => Promise<ToolResult>)(args);
}

function toolError(error: unknown): ToolResult {
  return {
    success: false,
    error: error instanceof Error ? error.message : String(error),
  };
}

export function formatToolResult(result: ToolResult): string {
  return JSON.stringify(result, null, 2);
}
