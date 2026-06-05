import { env } from "../config/env.js";
import { CONTRACTS } from "../config/contracts.js";
import { depositRepository } from "./deposit.repository.js";
import { savingsPlanRepository } from "./savings-plan.repository.js";
import { etherfuseService } from "./etherfuse.service.js";
import { sandboxOnchainService } from "./sandbox-onchain.service.js";
import { executeTool } from "../mcp/tools/handlers.js";
import { buildProviderAudit } from "../lib/observability/provider-audit.js";
import type { DepositRecord } from "../types/deposit.types.js";

export interface CetesInvestmentResult {
  deposit: DepositRecord;
  quoteId: string;
  orderId: string;
  investTxHash?: string;
  sandbox: boolean;
}

/**
 * Pipeline on-chain: MXNB (wallet agéntico) → cotización → compra CETES (Etherfuse).
 * En sandbox simula transacciones y persiste auditoría en deposit_state_logs.
 */
export class CetesInvestmentService {
  async investFromDeposit(fid: string): Promise<CetesInvestmentResult> {
    const deposit = await depositRepository.findByFid(fid);
    if (!deposit) throw new Error(`Depósito no encontrado: ${fid}`);

    if (deposit.status === "invested") {
      const meta = deposit.metadata ?? {};
      return {
        deposit,
        quoteId: String(meta.quoteId ?? "already-invested"),
        orderId: String(meta.orderId ?? "already-invested"),
        investTxHash: meta.investTxHash as string | undefined,
        sandbox: Boolean(meta.sandbox),
      };
    }

    if (deposit.status !== "settled" && deposit.status !== "investing") {
      throw new Error(
        `Depósito fid=${fid} en estado ${deposit.status}; requiere 'settled' previo`,
      );
    }

    const plan = await savingsPlanRepository.findByUserId(deposit.userId);
    if (plan && !plan.autoInvestCetes) {
      await depositRepository.logProviderAudit({
        fid,
        message: "Auto-inversión CETES desactivada en plan de ahorro",
        audit: buildProviderAudit({
          provider: "juno",
          operation: "skipCetesInvestment",
          requestedAt: new Date().toISOString(),
          respondedAt: new Date().toISOString(),
        }),
      });
      return {
        deposit,
        quoteId: "skipped",
        orderId: "skipped",
        sandbox: env.ONCHAIN_SANDBOX_MODE,
      };
    }

    const mxnbAmount = deposit.mxnbAmount ?? deposit.amountMxn;
    await depositRepository.transitionStatus(fid, "investing", {
      metadata: { phase: "cetes_quote_and_purchase", mxnbAmount },
    });

    const sandbox = env.ONCHAIN_SANDBOX_MODE;

    try {
      let quoteId: string;
      let orderId: string;
      let investTxHash: string | undefined;
      let quoteData: Record<string, unknown>;

      if (sandbox) {
        const quote = sandboxOnchainService.mockEtherfuseQuote(mxnbAmount);
        quoteId = `sandbox-quote-${fid.slice(0, 8)}`;
        quoteData = { ...quote, quoteId, sandbox: true };

        await depositRepository.logProviderAudit({
          fid,
          message: "[sandbox] Cotización CETES simulada",
          audit: buildProviderAudit({
            provider: "etherfuse",
            operation: "getQuote",
            requestedAt: new Date().toISOString(),
            respondedAt: new Date().toISOString(),
            httpStatus: 200,
            rawResponse: quoteData,
          }),
        });

        const order = sandboxOnchainService.mockEtherfuseOrder(quoteId);
        orderId = order.orderId;
        investTxHash = order.investTxHash;

        await depositRepository.logProviderAudit({
          fid,
          message: "[sandbox] Compra CETES simulada vía agente",
          audit: buildProviderAudit({
            provider: "etherfuse",
            operation: "purchaseStablebond",
            requestedAt: new Date().toISOString(),
            respondedAt: new Date().toISOString(),
            httpStatus: 200,
            rawResponse: {
              ...order,
              mxnbAmount,
              cetesContract: CONTRACTS.arbitrumOne.cetes.address,
              sandbox: true,
            },
          }),
        });
      } else {
        const quote = await etherfuseService.getQuote(mxnbAmount);
        quoteId = `quote-${Date.now()}`;
        quoteData = { ...quote, quoteId };

        await depositRepository.logProviderAudit({
          fid,
          message: "Cotización CETES Etherfuse",
          audit: buildProviderAudit({
            provider: "etherfuse",
            operation: "getQuote",
            requestedAt: new Date().toISOString(),
            respondedAt: new Date().toISOString(),
            httpStatus: 200,
            rawResponse: quoteData,
          }),
        });

        const walletResult = await executeTool("get_wallet_details", {});
        const walletInfo = walletResult.data as { wallet?: string } | undefined;

        const purchaseResult = await executeTool("purchase_stablebond", {
          quoteId,
          amountMxnb: mxnbAmount,
          walletAddress: plan?.walletAddress,
        });

        if (!purchaseResult.success) {
          throw new Error(purchaseResult.error ?? "purchase_stablebond falló");
        }

        const purchaseData = purchaseResult.data as {
          order?: { orderId: string; status: string };
        };
        orderId = purchaseData.order?.orderId ?? `order-${Date.now()}`;

        const transferResult = await executeTool("transfer", {
          amount: mxnbAmount,
          destination: CONTRACTS.arbitrumOne.cetes.address,
          assetId: CONTRACTS.arbitrumSepolia.mxnb.proxy,
        });

        if (transferResult.success) {
          const transferData = transferResult.data as { transfer?: string };
          const hashMatch = transferData.transfer?.match(/0x[a-fA-F0-9]{64}/);
          investTxHash = hashMatch?.[0];
        }

        void walletInfo;
      }

      const invested = await depositRepository.transitionStatus(fid, "invested", {
        metadata: {
          quoteId,
          orderId,
          investTxHash,
          cetesContract: CONTRACTS.arbitrumOne.cetes.address,
          mxnbInvested: mxnbAmount,
          sandbox,
          investedAt: new Date().toISOString(),
        },
      });

      return {
        deposit: invested,
        quoteId,
        orderId,
        investTxHash,
        sandbox,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await depositRepository.transitionStatus(fid, "settled", {
        lastError: `CETES investment failed: ${message}`,
        metadata: {
          phase: "cetes_failed",
          lastFailureAt: new Date().toISOString(),
        },
      });

      await depositRepository.logProviderAudit({
        fid,
        message: "Error en inversión CETES",
        audit: buildProviderAudit({
          provider: "etherfuse",
          operation: "investFromDeposit",
          requestedAt: new Date().toISOString(),
          respondedAt: new Date().toISOString(),
          error: message,
        }),
      });

      throw error;
    }
  }
}

export const cetesInvestmentService = new CetesInvestmentService();
