import type { SavingsPlan } from "../types/index.js";
import { env } from "../config/env.js";
import { junoService } from "./juno.service.js";
import { savingsPlanRepository } from "./savings-plan.repository.js";

export async function getOrCreateSavingsPlan(userId: string): Promise<SavingsPlan> {
  const existing = await savingsPlanRepository.findByUserId(userId);
  if (existing) return existing;

  let clabe = savingsPlanRepository.sandboxClabe(userId);

  if (env.JUNO_API_KEY) {
    try {
      const { data: account } = await junoService.createAutoPaymentClabe(userId);
      clabe = account.clabe;
    } catch {
      console.warn(`[SavingsPlan] Juno CLABE falló para ${userId} — usando CLABE sandbox`);
    }
  }

  const plan: SavingsPlan = {
    userId,
    clabe,
    contributionAmount: 50,
    contributionFrequency: "daily",
    targetYears: 20,
    autoInvestCetes: true,
  };

  return savingsPlanRepository.upsert(plan);
}

export async function updateSavingsPlan(
  userId: string,
  updates: Partial<Omit<SavingsPlan, "userId">>,
): Promise<SavingsPlan | null> {
  const plan = await savingsPlanRepository.findByUserId(userId);
  if (!plan) return null;
  const updated = { ...plan, ...updates };
  return savingsPlanRepository.upsert(updated);
}

export async function getSavingsPlan(userId: string): Promise<SavingsPlan | null> {
  return savingsPlanRepository.findByUserId(userId);
}

export async function getUserByClabe(clabe: string): Promise<{ userId: string; clabe: string } | null> {
  const plan = await savingsPlanRepository.findByClabe(clabe);
  if (plan) return { userId: plan.userId, clabe: plan.clabe };

  if (env.JUNO_API_KEY) {
    const result = await junoService.getUserByClabe(clabe);
    if (result.data) return result.data;
  }

  return null;
}
