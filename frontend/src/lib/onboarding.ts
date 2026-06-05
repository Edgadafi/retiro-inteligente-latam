export interface SavingsPlan {
  userId: string;
  clabe: string;
  walletAddress?: string;
  contributionAmount: number;
  contributionFrequency: "daily" | "weekly";
  targetYears: number;
  autoInvestCetes: boolean;
}

export interface OnboardingResponse {
  plan: SavingsPlan;
  integrations: Record<string, boolean | string>;
  walletStatus: string;
  speiInstructions: {
    clabe: string;
    beneficiary: string;
    reference: string;
  };
}

export interface DemoDepositResponse {
  message: string;
  deposit: {
    fid: string;
    status: string;
    amountMxn: number;
    mxnbAmount?: number;
    metadata?: Record<string, unknown>;
  };
  cetesInvested: boolean;
  traceUrl: string;
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
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Error en simulación SPEI");
  }
  return res.json() as Promise<DemoDepositResponse>;
}

export async function fetchHealth(): Promise<{
  integrations: Record<string, boolean | string>;
}> {
  const res = await fetch("/api/health");
  return res.json() as Promise<{ integrations: Record<string, boolean | string> }>;
}
