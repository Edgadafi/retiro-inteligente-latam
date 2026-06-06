import { pollUntil } from "../lib/retry/exponential-backoff.js";
import type { JitterStrategy } from "../lib/retry/exponential-backoff.js";
import { env } from "../config/env.js";
import { junoService, JunoApiError } from "./juno.service.js";
import { sandboxOnchainService } from "./sandbox-onchain.service.js";
import { onDepositSettled } from "./cetes-investment.service.js";
import { depositRepository } from "./deposit.repository.js";
import { buildProviderAudit } from "../lib/observability/provider-audit.js";
import type { DepositRecord } from "../types/deposit.types.js";

export interface SettlementResult {
  deposit: DepositRecord;
  attempts: number;
  cetesInvested: boolean;
}

export class SettlementProcessor {
  async processDeposit(fid: string): Promise<SettlementResult> {
    const deposit = await depositRepository.findByFid(fid);
    if (!deposit) throw new Error(`Depósito no encontrado: ${fid}`);

    if (deposit.status === "invested") {
      return { deposit, attempts: 0, cetesInvested: true };
    }

    if (deposit.status === "investing" || deposit.status === "settled") {
      const invested = await onDepositSettled(fid);
      const updated = await depositRepository.findByFid(fid);
      return {
        deposit: updated!,
        attempts: 0,
        cetesInvested: invested.deposit.status === "invested",
      };
    }

    if (deposit.status === "failed") {
      throw new Error(`Depósito en estado failed: ${deposit.lastError ?? "sin detalle"}`);
    }

    await depositRepository.transitionStatus(fid, "processing", {
      metadata: { phase: "polling_juno_settlement" },
    });

    let attempts = 0;

    try {
      const { result: settlementCall, attempts: pollAttempts } = await pollUntil(
        async (attempt) => {
          attempts = attempt;

          try {
            const junoResult = await this.fetchSettlement(fid, deposit.amountMxn);

            await depositRepository.logProviderAudit({
              fid,
              message: `Juno getSettlementStatus intento ${attempt}`,
              audit: junoResult.audit,
              extra: { pollAttempt: attempt, sandbox: env.ONCHAIN_SANDBOX_MODE },
            });

            await depositRepository.transitionStatus(fid, "processing", {
              retryCount: attempt - 1,
              metadata: {
                lastPollAttempt: attempt,
                polledAt: new Date().toISOString(),
                lastJunoStatus: junoResult.data.status,
              },
            });

            return junoResult;
          } catch (error) {
            if (env.ONCHAIN_SANDBOX_MODE) {
              const mock = sandboxOnchainService.mockJunoSettlement(fid, deposit.amountMxn);
              await depositRepository.logProviderAudit({
                fid,
                message: `[sandbox] Juno settlement simulado tras error API`,
                audit: mock.audit,
                extra: { pollAttempt: attempt },
              });
              return mock;
            }

            const audit =
              error instanceof JunoApiError
                ? error.audit
                : buildProviderAudit({
                    provider: "juno",
                    operation: "getSettlementStatus",
                    requestedAt: new Date().toISOString(),
                    respondedAt: new Date().toISOString(),
                    error: error instanceof Error ? error.message : String(error),
                  });

            await depositRepository.logProviderAudit({
              fid,
              message: `Juno getSettlementStatus error intento ${attempt}`,
              audit,
              extra: { pollAttempt: attempt },
            });

            throw error;
          }
        },
        (call) => call.data.status === "completed" || call.data.status === "failed",
        {
          maxAttempts: env.SETTLEMENT_MAX_ATTEMPTS,
          baseDelayMs: env.SETTLEMENT_BASE_DELAY_MS,
          maxDelayMs: env.SETTLEMENT_MAX_DELAY_MS,
          jitter: true,
          jitterStrategy: env.SETTLEMENT_JITTER_STRATEGY as JitterStrategy,
        },
      );

      attempts = pollAttempts;
      const settlement = settlementCall.data;

      if (settlement.status === "failed") {
        const failed = await depositRepository.transitionStatus(fid, "failed", {
          lastError: "Juno reportó settlement failed",
          retryCount: pollAttempts,
          metadata: { junoFinalResponse: settlementCall.audit.rawResponse },
        });
        return { deposit: failed, attempts: pollAttempts, cetesInvested: false };
      }

      const mxnbAmount = settlement.mxnbAmount
        ? parseFloat(settlement.mxnbAmount)
        : deposit.amountMxn;

      const settled = await depositRepository.transitionStatus(fid, "settled", {
        mxnbAmount,
        txHash: settlement.txHash,
        settledAt: new Date().toISOString(),
        retryCount: pollAttempts,
        metadata: {
          settlementStatus: settlement.status,
          settledVia: env.ONCHAIN_SANDBOX_MODE ? "sandbox" : "juno_polling",
          junoFinalResponse: settlementCall.audit.rawResponse,
        },
      });

      let cetesInvested = false;
      try {
        const investment = await onDepositSettled(fid);
        cetesInvested = investment.deposit.status === "invested";
      } catch (error) {
        console.warn(
          `[Settlement] purchase_stablebond diferido fid=${fid}:`,
          error instanceof Error ? error.message : error,
        );
      }

      return {
        deposit: cetesInvested
          ? (await depositRepository.findByFid(fid))!
          : settled,
        attempts: pollAttempts,
        cetesInvested,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stuck = await depositRepository.transitionStatus(fid, "processing", {
        lastError: message,
        retryCount: attempts,
        metadata: {
          phase: "awaiting_reconciliation",
          lastFailureAt: new Date().toISOString(),
        },
      });

      throw Object.assign(new Error(message), { deposit: stuck, attempts });
    }
  }

  private async fetchSettlement(fid: string, amountMxn: number) {
    if (env.ONCHAIN_SANDBOX_MODE && !env.JUNO_API_KEY) {
      return sandboxOnchainService.mockJunoSettlement(fid, amountMxn);
    }
    return junoService.getSettlementStatus(fid);
  }

  async reconcileStuckDeposits(): Promise<number> {
    const stuck = await depositRepository.listByStatus([
      "pending",
      "processing",
      "settled",
      "investing",
    ]);
    let processed = 0;

    for (const deposit of stuck) {
      try {
        await this.processDeposit(deposit.fid);
        processed++;
      } catch (error) {
        console.warn(
          `[Settlement] Reconciliación diferida fid=${deposit.fid}:`,
          error instanceof Error ? error.message : error,
        );
      }
    }

    return processed;
  }
}

export const settlementProcessor = new SettlementProcessor();
