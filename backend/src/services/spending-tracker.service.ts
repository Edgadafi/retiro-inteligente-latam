import { DAILY_SPENDING_LIMIT_MXNB } from "../config/contracts.js";
import { getSupabase, isSupabaseConfigured } from "../db/supabase.client.js";
import { AGENT_WALLET_KEY } from "../lib/wallet-address.js";

export interface SpendingSummary {
  dailyLimitMxnb: number;
  spentTodayMxnb: number;
  remainingMxnb: number;
  resetWindowHours: number;
}

interface DailySpend {
  date: string;
  amountMxnb: number;
}

const memoryLedger = new Map<string, DailySpend>();

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getDailySpentMxnb(walletKey: string): Promise<number> {
  const date = todayKey();

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await getSupabase()
        .from("wallet_daily_spend")
        .select("amount_mxnb")
        .eq("wallet_key", walletKey)
        .eq("spend_date", date)
        .maybeSingle();

      if (error) {
        if (error.code !== "42P01") {
          throw new Error(`Supabase wallet_daily_spend: ${error.message}`);
        }
      } else if (data) {
        return Number(data.amount_mxnb);
      } else {
        return 0;
      }
    } catch (err) {
      console.warn("[SpendingTracker] Supabase fallback a memoria:", err);
    }
  }

  const entry = memoryLedger.get(walletKey);
  if (!entry || entry.date !== date) return 0;
  return entry.amountMxnb;
}

export async function recordSpend(
  walletKey: string,
  amountMxnb: number,
): Promise<void> {
  const date = todayKey();

  if (isSupabaseConfigured()) {
    try {
      const spent = await getDailySpentMxnb(walletKey);
      const next = spent + amountMxnb;
      const { error } = await getSupabase().from("wallet_daily_spend").upsert(
        {
          wallet_key: walletKey,
          spend_date: date,
          amount_mxnb: next,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "wallet_key,spend_date" },
      );
      if (error) {
        if (error.code !== "42P01") {
          throw new Error(`Supabase recordSpend: ${error.message}`);
        }
      } else {
        return;
      }
    } catch (err) {
      console.warn("[SpendingTracker] Supabase record fallback a memoria:", err);
    }
  }

  const existing = memoryLedger.get(walletKey);
  if (!existing || existing.date !== date) {
    memoryLedger.set(walletKey, { date, amountMxnb });
    return;
  }
  existing.amountMxnb += amountMxnb;
}

export async function getSpendingSummary(
  walletKey: string = AGENT_WALLET_KEY,
): Promise<SpendingSummary> {
  const spent = await getDailySpentMxnb(walletKey);
  return {
    dailyLimitMxnb: DAILY_SPENDING_LIMIT_MXNB,
    spentTodayMxnb: spent,
    remainingMxnb: Math.max(0, DAILY_SPENDING_LIMIT_MXNB - spent),
    resetWindowHours: 24,
  };
}
