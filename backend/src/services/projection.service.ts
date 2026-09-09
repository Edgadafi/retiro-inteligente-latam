import {
  ANNUAL_AFORE_YIELD,
  ANNUAL_CETES_YIELD,
  GENDER_GAP_DEFAULTS,
} from "../config/contracts.js";
import type { GenderGapProjection, RetirementProjection } from "../types/index.js";

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

export function compareWithAfore(
  projection: RetirementProjection,
  frequency: "daily" | "weekly" = "daily",
) {
  const aforeProjection = projectRetirementFund({
    contributionPerPeriod: projection.contributionPerPeriod,
    periods: projection.periods,
    annualRate: ANNUAL_AFORE_YIELD,
    frequency,
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

/**
 * Aportación periódica A tal que la anualidad alcanza targetFund.
 * A = Vf × r / ((1+r)^n - 1)
 */
export function contributionToReachFund(params: {
  targetFund: number;
  periods: number;
  annualRate?: number;
  frequency?: "daily" | "weekly";
}): number {
  const { targetFund, periods: n } = params;
  if (n <= 0) return Number.POSITIVE_INFINITY;
  const annualRate = params.annualRate ?? ANNUAL_CETES_YIELD;
  const periodsPerYear = params.frequency === "weekly" ? 52 : 365;
  const r = annualRate / periodsPerYear;
  if (r === 0) return targetFund / n;
  return (targetFund * r) / (Math.pow(1 + r, n) - 1);
}

/**
 * Brecha pensional de género: misma anualidad, con pausas de carrera y
 * contrafactual de carrera continua + brecha salarial.
 *
 * El contrafactual se congela con la aportación original (no escala si ella
 * sube su ahorro para cerrar la brecha).
 */
export function projectGenderGap(params: {
  currentAge: number;
  weeklyContribution: number;
  carePauseYears?: number;
  horizonYears?: number;
  wageGapFactor?: number;
  annualRate?: number;
}): GenderGapProjection {
  const currentAge = params.currentAge;
  const weeklyContribution = params.weeklyContribution;
  if (!Number.isFinite(currentAge) || currentAge < 18 || currentAge > 80) {
    throw new Error("currentAge debe estar entre 18 y 80");
  }
  if (!Number.isFinite(weeklyContribution) || weeklyContribution <= 0) {
    throw new Error("weeklyContribution debe ser un número positivo");
  }

  const {
    femaleLifeExpectancyYears,
    maleLifeExpectancyYears,
    retirementAge,
    wageGapFactor: defaultWageGap,
  } = GENDER_GAP_DEFAULTS;

  const wageGapFactor = params.wageGapFactor ?? defaultWageGap;
  const savingYears = Math.max(
    0,
    params.horizonYears ?? retirementAge - currentAge,
  );
  const pauseYears = Math.min(Math.max(0, params.carePauseYears ?? 0), savingYears);
  const contributingYears = Math.max(0, savingYears - pauseYears);
  const contributingWeeks = Math.round(contributingYears * 52);
  const continuousWeeks = Math.round(savingYears * 52);
  const extraRetirementYears = femaleLifeExpectancyYears - maleLifeExpectancyYears;
  const femaleRetirementYears = Math.max(1, femaleLifeExpectancyYears - retirementAge);
  const maleRetirementYears = Math.max(1, maleLifeExpectancyYears - retirementAge);

  const ritaCetes = projectRetirementFund({
    contributionPerPeriod: weeklyContribution,
    periods: contributingWeeks,
    frequency: "weekly",
    annualRate: params.annualRate,
  });
  const ritaAfore = projectRetirementFund({
    contributionPerPeriod: weeklyContribution,
    periods: contributingWeeks,
    frequency: "weekly",
    annualRate: ANNUAL_AFORE_YIELD,
  });

  const maleWeekly = weeklyContribution / (1 - wageGapFactor);
  const counterfactual = projectRetirementFund({
    contributionPerPeriod: maleWeekly,
    periods: continuousWeeks,
    frequency: "weekly",
    annualRate: params.annualRate,
  });

  const gapMxn = round2(counterfactual.finalFund - ritaCetes.finalFund);
  const neededWeekly =
    contributingWeeks === 0
      ? Number.POSITIVE_INFINITY
      : contributionToReachFund({
          targetFund: counterfactual.finalFund,
          periods: contributingWeeks,
          frequency: "weekly",
          annualRate: params.annualRate,
        });
  const weeklyToCloseGap =
    contributingWeeks === 0 ? null : round2(Math.max(0, neededWeekly - weeklyContribution));

  const annualDrawdownRita = round2(ritaCetes.finalFund / femaleRetirementYears);
  const annualDrawdownCounterfactual = round2(
    counterfactual.finalFund / maleRetirementYears,
  );

  return {
    inputs: {
      currentAge,
      weeklyContribution,
      carePauseYears: pauseYears,
      horizonYears: savingYears,
      wageGapFactor,
      contributingYears,
    },
    ritaCetes,
    ritaAfore,
    counterfactual,
    gapMxn,
    weeklyToCloseGap,
    extraRetirementYears,
    annualDrawdownRita,
    annualDrawdownCounterfactual,
    incomeGapMxn: round2(annualDrawdownCounterfactual - annualDrawdownRita),
    disclaimer:
      "Estimación educativa. No es una pensión, no sustituye AFORE/IMSS y no garantiza rendimientos.",
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
