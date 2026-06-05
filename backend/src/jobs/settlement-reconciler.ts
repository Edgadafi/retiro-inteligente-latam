import { env } from "../config/env.js";
import { settlementProcessor } from "../services/settlement-processor.service.js";

let intervalHandle: ReturnType<typeof setInterval> | null = null;

/**
 * Job periódico que reconcilia depósitos SPEI atascados en pending/processing.
 */
export function startSettlementReconciler(): void {
  if (intervalHandle) return;

  const tick = async () => {
    try {
      const count = await settlementProcessor.reconcileStuckDeposits();
      if (count > 0) {
        console.info(`[Reconciler] Procesados ${count} depósito(s) atascado(s).`);
      }
    } catch (error) {
      console.error(
        "[Reconciler] Error:",
        error instanceof Error ? error.message : error,
      );
    }
  };

  void tick();
  intervalHandle = setInterval(tick, env.SETTLEMENT_RECONCILE_INTERVAL_MS);
  console.info(
    `[Reconciler] Activo cada ${env.SETTLEMENT_RECONCILE_INTERVAL_MS / 1000}s`,
  );
}

export function stopSettlementReconciler(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
