import { DAILY_SPENDING_LIMIT_MXNB } from "../config/contracts.js";

interface DailySpend {
  date: string;
  amountMxnb: number;
}

const ledger = new Map<string, DailySpend>();

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getDailySpentMxnb(walletKey: string): number {
  const entry = ledger.get(walletKey);
  if (!entry || entry.date !== todayKey()) return 0;
  return entry.amountMxnb;
}

export function recordSpend(walletKey: string, amountMxnb: number): void {
  const date = todayKey();
  const existing = ledger.get(walletKey);
  if (!existing || existing.date !== date) {
    ledger.set(walletKey, { date, amountMxnb });
    return;
  }
  existing.amountMxnb += amountMxnb;
}

export function getSpendingSummary(walletKey: string) {
  const spent = getDailySpentMxnb(walletKey);
  return {
    dailyLimitMxnb: DAILY_SPENDING_LIMIT_MXNB,
    spentTodayMxnb: spent,
    remainingMxnb: Math.max(0, DAILY_SPENDING_LIMIT_MXNB - spent),
    resetWindowHours: 24,
  };
}
