import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GENDER_GAP_DEFAULTS } from "../config/contracts.js";
import {
  contributionToReachFund,
  projectGenderGap,
  projectRetirementFund,
} from "./projection.service.js";

describe("projectRetirementFund", () => {
  it("compound annuity is greater than principal", () => {
    const p = projectRetirementFund({
      contributionPerPeriod: 50,
      periods: 365 * 20,
      frequency: "daily",
    });
    assert.ok(p.finalFund > p.totalContributed);
    assert.equal(p.totalContributed, 50 * 365 * 20);
  });
});

describe("projectGenderGap", () => {
  it("zero pause still leaves a gap from wage differential and longevity", () => {
    const gap = projectGenderGap({
      currentAge: 30,
      weeklyContribution: 200,
      carePauseYears: 0,
      horizonYears: 35,
    });
    assert.equal(gap.extraRetirementYears, GENDER_GAP_DEFAULTS.femaleLifeExpectancyYears - GENDER_GAP_DEFAULTS.maleLifeExpectancyYears);
    assert.ok(gap.gapMxn > 0);
    assert.ok(gap.incomeGapMxn > 0);
    assert.equal(gap.inputs.contributingYears, 35);
  });

  it("three years of care pause reduce Rita fund vs continuous career", () => {
    const base = projectGenderGap({
      currentAge: 30,
      weeklyContribution: 200,
      carePauseYears: 0,
      horizonYears: 35,
    });
    const paused = projectGenderGap({
      currentAge: 30,
      weeklyContribution: 200,
      carePauseYears: 3,
      horizonYears: 35,
    });
    assert.ok(paused.ritaCetes.finalFund < base.ritaCetes.finalFund);
    assert.equal(paused.inputs.contributingYears, 32);
    assert.ok(paused.gapMxn > base.gapMxn);
  });

  it("weeklyToCloseGap brings Rita fund to the frozen counterfactual", () => {
    const original = projectGenderGap({
      currentAge: 32,
      weeklyContribution: 150,
      carePauseYears: 2,
      horizonYears: 30,
    });
    assert.ok(original.weeklyToCloseGap !== null && original.weeklyToCloseGap > 0);
    const closed = projectRetirementFund({
      contributionPerPeriod: 150 + original.weeklyToCloseGap,
      periods: original.ritaCetes.periods,
      frequency: "weekly",
    });
    assert.ok(Math.abs(closed.finalFund - original.counterfactual.finalFund) < 50);
  });

  it("contributionToReachFund inverts the annuity", () => {
    const n = 52 * 10;
    const A = 100;
    const fund = projectRetirementFund({
      contributionPerPeriod: A,
      periods: n,
      frequency: "weekly",
    });
    const recovered = contributionToReachFund({
      targetFund: fund.finalFund,
      periods: n,
      frequency: "weekly",
    });
    assert.ok(Math.abs(recovered - A) < 0.05);
  });
});
