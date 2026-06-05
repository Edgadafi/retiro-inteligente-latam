import { ANNUAL_AFORE_YIELD, ANNUAL_CETES_YIELD } from "../config/contracts.js";
import type { RetirementProjection } from "../types/index.js";

/**
 * Vf = A × ((1+r)^n - 1) / r
 * r = tasa por periodo; n = número de periodos
 */
export function projectRetirementFund(params: {
  contributionPerPeriod: number;
  periods: number;
  annualRate?: number;
  frequency?: "daily" | "weekly";
}): RetirementProjection {
  const annualRate = params.annualRate ?? ANNUAL_CETES_YIELD;
  const periodsPerYear = params.frequency === "weekly" ? 52 : 365;
  const r = annualRate / periodsPerYear;
  const { contributionPerPeriod: A, periods: n } = params;

  const finalFund =
    r === 0 ? A * n : A * ((Math.pow(1 + r, n) - 1) / r);
  const totalContributed = A * n;
  const totalYield = finalFund - totalContributed;

  return {
    finalFund: round2(finalFund),
    totalContributed: round2(totalContributed),
    totalYield: round2(totalYield),
    annualRate,
    periods: n,
    contributionPerPeriod: A,
  };
}

export function compareWithAfore(projection: RetirementProjection) {
  const aforeProjection = projectRetirementFund({
    contributionPerPeriod: projection.contributionPerPeriod,
    periods: projection.periods,
    annualRate: ANNUAL_AFORE_YIELD,
  });

  return {
    cetes: projection,
    afore: aforeProjection,
    advantageMxnb: round2(projection.finalFund - aforeProjection.finalFund),
    advantagePercent: round2(
      ((projection.finalFund - aforeProjection.finalFund) / aforeProjection.finalFund) * 100,
    ),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
