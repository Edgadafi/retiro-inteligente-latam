import { randomUUID } from "node:crypto";
import { CONTRACTS } from "../config/contracts.js";
import { buildProviderAudit } from "../lib/observability/provider-audit.js";
import type { JunoCallResult, JunoSettlementStatus } from "./juno.service.js";
import type { StablebondQuote } from "./etherfuse.service.js";

/**
 * Respuestas simuladas para demo/hackathon cuando ONCHAIN_SANDBOX_MODE=true.
 */
export class SandboxOnchainService {
  mockJunoSettlement(fid: string, amountMxn: number): JunoCallResult<JunoSettlementStatus> {
    const now = new Date().toISOString();
    const mxnbAmount = amountMxn.toFixed(6);
    const txHash = `0x${randomUUID().replace(/-/g, "")}${randomUUID().replace(/-/g, "").slice(0, 8)}`;

    return {
      data: {
        status: "completed",
        mxnbAmount,
        txHash,
      },
      audit: buildProviderAudit({
        provider: "juno",
        operation: "getSettlementStatus",
        requestedAt: now,
        respondedAt: now,
        httpStatus: 200,
        rawResponse: {
          fid,
          status: "completed",
          mxnbAmount,
          txHash,
          sandbox: true,
          network: "arbitrum-sepolia",
          asset: "MXNB",
        },
      }),
    };
  }

  mockEtherfuseQuote(amountMxnb: number): StablebondQuote {
    const apy = 0.11;
    const amountOut = (amountMxnb * (1 + apy / 365)).toFixed(6);
    return {
      assetId: CONTRACTS.arbitrumOne.cetes.address,
      amountIn: amountMxnb.toFixed(6),
      amountOut,
      apy,
      expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
    };
  }

  mockEtherfuseOrder(quoteId: string): { orderId: string; status: string; investTxHash: string } {
    return {
      orderId: `sandbox-order-${quoteId.slice(0, 8)}`,
      status: "completed",
      investTxHash: `0x${randomUUID().replace(/-/g, "")}${randomUUID().replace(/-/g, "").slice(0, 8)}`,
    };
  }
}

export const sandboxOnchainService = new SandboxOnchainService();
