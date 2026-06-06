export * from "./webhook.types.js";
export * from "./deposit.types.js";

export interface SavingsPlan {
  userId: string;
  clabe: string;
  walletAddress?: string;
  linkedWalletAddress?: string;
  linkedWalletVerifiedAt?: string;
  contributionAmount: number;
  contributionFrequency: "daily" | "weekly";
  targetYears: number;
  autoInvestCetes: boolean;
}

export interface RetirementProjection {
  finalFund: number;
  totalContributed: number;
  totalYield: number;
  annualRate: number;
  periods: number;
  contributionPerPeriod: number;
}
