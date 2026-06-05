export type BitsoWebhookEventType =
  | "funding.completed"
  | "funding.pending"
  | "funding.failed"
  | "payment.completed";

export interface BitsoFundingWebhookPayload {
  event: BitsoWebhookEventType;
  payload: {
    fid: string;
    status: "complete" | "pending" | "failed";
    created_at: string;
    currency: "mxn";
    method: "sp" | "spie";
    method_name: string;
    amount: string;
    asset: string;
    network: string;
    protocol: string;
    integration: string;
    details?: {
      sender_name?: string;
      sender_clabe?: string;
      receive_clabe?: string;
      clabe?: string;
      concept?: string;
      numeric_reference?: string;
    };
  };
}

export interface ProcessedDeposit {
  userId: string;
  fid: string;
  amountMxn: number;
  clabe: string;
  status: "minting_mxnb" | "completed" | "failed";
  mxnbAmount?: number;
  txHash?: string;
}
