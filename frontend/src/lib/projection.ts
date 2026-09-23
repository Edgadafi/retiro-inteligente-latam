export interface ProjectionResult {
  cetes: {
    finalFund: number;
    totalContributed: number;
    totalYield: number;
    annualRate: number;
  };
  afore: {
    finalFund: number;
    totalContributed: number;
    totalYield: number;
    annualRate: number;
  };
  advantageMxnb: number;
  advantagePercent: number;
}

export interface GenderGapResult {
  inputs: {
    currentAge: number;
    weeklyContribution: number;
    carePauseYears: number;
    horizonYears: number;
    wageGapFactor: number;
    contributingYears: number;
  };
  ritaCetes: {
    finalFund: number;
    totalContributed: number;
    totalYield: number;
    annualRate: number;
  };
  ritaAfore: {
    finalFund: number;
    totalContributed: number;
    totalYield: number;
    annualRate: number;
  };
  counterfactual: {
    finalFund: number;
    totalContributed: number;
    totalYield: number;
    annualRate: number;
  };
  gapMxn: number;
  weeklyToCloseGap: number | null;
  extraRetirementYears: number;
  annualDrawdownRita: number;
  annualDrawdownCounterfactual: number;
  incomeGapMxn: number;
  disclaimer: string;
}

export async function fetchProjection(params: {
  contributionPerPeriod: number;
  periods: number;
  frequency: "daily" | "weekly";
}): Promise<ProjectionResult> {
  const res = await fetch("/api/projection", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Error al calcular proyección");
  return res.json() as Promise<ProjectionResult>;
}

export async function fetchGenderGap(params: {
  currentAge: number;
  weeklyContribution: number;
  carePauseYears: number;
  horizonYears?: number;
}): Promise<GenderGapResult> {
  const res = await fetch("/api/projection/gender-gap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Error al calcular la brecha");
  }
  return res.json() as Promise<GenderGapResult>;
}
