import { settlementProcessor } from "./settlement-processor.service.js";

const inFlight = new Set<string>();

/**
 * Procesa depósito en background: settlement SPEI → MXNB → purchase_stablebond.
 * Usado por webhooks, demo y reconciliador.
 */
export function scheduleDepositPipeline(fid: string): void {
  if (inFlight.has(fid)) return;
  inFlight.add(fid);

  void settlementProcessor
    .processDeposit(fid)
    .then((result) => {
      console.info(
        `[Pipeline] Completado fid=${fid}`,
        `| status=${result.deposit.status}`,
        `| cetes=${result.cetesInvested}`,
        `| attempts=${result.attempts}`,
      );
    })
    .catch((error) => {
      console.error(
        `[Pipeline] Diferido fid=${fid}:`,
        error instanceof Error ? error.message : error,
      );
    })
    .finally(() => {
      inFlight.delete(fid);
    });
}
