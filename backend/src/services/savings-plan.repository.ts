import { getSupabase, isSupabaseConfigured } from "../db/supabase.client.js";
import type { SavingsPlan } from "../types/index.js";

const memoryPlans = new Map<string, SavingsPlan>();
const memoryClabeIndex = new Map<string, string>();

function rowToPlan(row: Record<string, unknown>): SavingsPlan {
  return {
    userId: String(row.user_id),
    clabe: String(row.clabe),
    walletAddress: row.wallet_address != null ? String(row.wallet_address) : undefined,
    linkedWalletAddress:
      row.linked_wallet_address != null ? String(row.linked_wallet_address) : undefined,
    linkedWalletVerifiedAt:
      row.linked_wallet_verified_at != null
        ? String(row.linked_wallet_verified_at)
        : undefined,
    contributionAmount: Number(row.contribution_amount),
    contributionFrequency: row.contribution_frequency as "daily" | "weekly",
    targetYears: Number(row.target_years),
    autoInvestCetes: Boolean(row.auto_invest_cetes),
  };
}

export class SavingsPlanRepository {
  async findByUserId(userId: string): Promise<SavingsPlan | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabase()
        .from("savings_plans")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw new Error(`Supabase savings_plans: ${error.message}`);
      return data ? rowToPlan(data) : null;
    }
    return memoryPlans.get(userId) ?? null;
  }

  async findByClabe(clabe: string): Promise<SavingsPlan | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabase()
        .from("savings_plans")
        .select("*")
        .eq("clabe", clabe)
        .maybeSingle();
      if (error) throw new Error(`Supabase savings_plans clabe: ${error.message}`);
      return data ? rowToPlan(data) : null;
    }
    const userId = memoryClabeIndex.get(clabe);
    return userId ? memoryPlans.get(userId) ?? null : null;
  }

  async upsert(plan: SavingsPlan): Promise<SavingsPlan> {
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabase()
        .from("savings_plans")
        .upsert(
          {
            user_id: plan.userId,
            clabe: plan.clabe,
            wallet_address: plan.walletAddress ?? null,
            linked_wallet_address: plan.linkedWalletAddress ?? null,
            linked_wallet_verified_at: plan.linkedWalletVerifiedAt ?? null,
            contribution_amount: plan.contributionAmount,
            contribution_frequency: plan.contributionFrequency,
            target_years: plan.targetYears,
            auto_invest_cetes: plan.autoInvestCetes,
          },
          { onConflict: "user_id" },
        )
        .select("*")
        .single();
      if (error) throw new Error(`Supabase upsert savings_plans: ${error.message}`);
      return rowToPlan(data);
    }

    memoryPlans.set(plan.userId, plan);
    memoryClabeIndex.set(plan.clabe, plan.userId);
    return plan;
  }

  /** CLABE sandbox determinística para demo sin Juno API */
  sandboxClabe(userId: string): string {
    const suffix = userId.replace(/[^a-zA-Z0-9]/g, "").padEnd(10, "0").slice(0, 10);
    return `6461801570${suffix}`;
  }

  async ensureSandboxPlan(userId: string): Promise<SavingsPlan> {
    const existing = await this.findByUserId(userId);
    if (existing) return existing;

    const plan: SavingsPlan = {
      userId,
      clabe: this.sandboxClabe(userId),
      contributionAmount: 50,
      contributionFrequency: "daily",
      targetYears: 20,
      autoInvestCetes: true,
    };
    return this.upsert(plan);
  }
}

export const savingsPlanRepository = new SavingsPlanRepository();
