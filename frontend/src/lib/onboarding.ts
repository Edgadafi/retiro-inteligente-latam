import type { DepositUiState } from "./deposits";
import type { OnboardingWallet } from "./wallet";

export interface SavingsPlan {
  userId: string;
  clabe: string;
  walletAddress?: string;
  linkedWalletAddress?: string;
  contributionAmount: number;
  contributionFrequency: "daily" | "weekly";
  targetYears: number;
  autoInvestCetes: boolean;
}

export interface OnboardingResponse {
  plan: SavingsPlan;
  integrations: Record<string, boolean | string>;
  walletStatus: string;
  wallet?: OnboardingWallet;
  speiInstructions: {
    clabe: string;
    beneficiary: string;
    reference: string;
  };
}

export interface DemoDepositResponse {
  status: "success";
  data: {
    fid: string;
    deposit: {
      fid: string;
      status: string;
      amountMxn: number;
      mxnbAmount?: number;
      metadata?: Record<string, unknown>;
    };
    ui: DepositUiState;
    pollUrl: string;
    message: string;
  };
}

export async function onboardUser(userId: string): Promise<OnboardingResponse> {
  const res = await fetch("/api/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, autoInvestCetes: true }),
  });
  if (!res.ok) throw new Error("Error en onboarding");
  return res.json() as Promise<OnboardingResponse>;
}

export async function simulateSpeiDeposit(
  userId: string,
  amountMxn = 100,
): Promise<DemoDepositResponse> {
  const res = await fetch("/api/demo/simulate-spei", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, amountMxn }),
  });
  const body = (await res.json()) as DemoDepositResponse & { error?: string };
  if (!res.ok) {
    throw new Error(body.error ?? "Error en simulación SPEI");
  }
  return body;
}

export async function fetchHealth(): Promise<{
  integrations: Record<string, boolean | string>;
}> {
  const res = await fetch("/api/health");
  return res.json() as Promise<{ integrations: Record<string, boolean | string> }>;
}
