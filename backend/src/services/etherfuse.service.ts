import { CONTRACTS } from "../config/contracts.js";
import { env } from "../config/env.js";
import { enforceTeePolicy } from "../agent.js";

export interface StablebondQuote {
  assetId: string;
  amountIn: string;
  amountOut: string;
  apy: number;
  expiresAt: string;
}

/**
 * Etherfuse Stablebonds API — cotización y compra de CETES con MXNB.
 */
export class EtherfuseService {
  private readonly baseUrl: string;
  private readonly apiKey?: string;

  constructor() {
    this.baseUrl = env.ETHERFUSE_API_BASE_URL ?? "https://api.etherfuse.com";
    this.apiKey = env.ETHERFUSE_API_KEY;
  }

  private headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
    };
  }

  async getAssets(): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/v1/assets`, {
      headers: this.headers(),
    });
    if (!response.ok) throw new Error(`Etherfuse assets failed: ${response.status}`);
    return response.json();
  }

  async getQuote(amountMxnb: number): Promise<StablebondQuote> {
    const response = await fetch(`${this.baseUrl}/v1/quotes`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        asset: CONTRACTS.arbitrumOne.cetes.address,
        amount_in: amountMxnb,
        currency: "MXNB",
        network: "arbitrum-one",
      }),
    });

    if (!response.ok) {
      throw new Error(`Etherfuse quote failed: ${response.status}`);
    }

    return response.json() as Promise<StablebondQuote>;
  }

  async purchaseStablebond(params: {
    quoteId: string;
    amountMxnb: number;
    walletAddress: string;
    dailySpentMxnb?: number;
  }): Promise<{ orderId: string; status: string }> {
    enforceTeePolicy({
      toAddress: CONTRACTS.arbitrumOne.cetes.address,
      amountMxnb: params.amountMxnb,
      dailySpentMxnb: params.dailySpentMxnb,
    });

    const response = await fetch(`${this.baseUrl}/v1/orders`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        quote_id: params.quoteId,
        wallet_address: params.walletAddress,
        amount: params.amountMxnb,
      }),
    });

    if (!response.ok) {
      throw new Error(`Etherfuse order failed: ${response.status}`);
    }

    return response.json() as Promise<{ orderId: string; status: string }>;
  }
}

export const etherfuseService = new EtherfuseService();
