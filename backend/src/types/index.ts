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

export interface GenderGapProjection {
  inputs: {
    currentAge: number;
    weeklyContribution: number;
    carePauseYears: number;
    horizonYears: number;
    wageGapFactor: number;
    contributingYears: number;
  };
  ritaCetes: RetirementProjection;
  ritaAfore: RetirementProjection;
  counterfactual: RetirementProjection;
  gapMxn: number;
  weeklyToCloseGap: number | null;
  extraRetirementYears: number;
  annualDrawdownRita: number;
  annualDrawdownCounterfactual: number;
  incomeGapMxn: number;
  disclaimer: string;
}
