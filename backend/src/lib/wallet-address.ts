import { createHash } from "node:crypto";

/** Extrae dirección 0x del resultado de GetWalletDetailsAction (formas variables). */
export function extractWalletAddress(details: unknown): string | undefined {
  if (!details) return undefined;

  if (typeof details === "string" && details.startsWith("0x")) {
    return details;
  }

  if (typeof details !== "object") return undefined;

  const obj = details as Record<string, unknown>;
  const candidates = [
    obj.address,
    obj.walletAddress,
    obj.wallet_address,
    (obj.wallet as Record<string, unknown> | undefined)?.address,
  ];

  for (const c of candidates) {
    if (typeof c === "string" && c.startsWith("0x")) return c;
  }

  const nested = obj.wallet ?? obj.data;
  if (nested && nested !== details) {
    return extractWalletAddress(nested);
  }

  return undefined;
}

/** Dirección determinística para demo sandbox (40 hex chars). */
export function sandboxWalletAddressForUser(userId: string): string {
  const hash = createHash("sha256").update(`retiro-sandbox:${userId}`).digest("hex");
  return `0x${hash.slice(0, 40)}`;
}

export const AGENT_WALLET_KEY = "default-wallet";

export function arbiscanAddressUrl(address: string, networkId: string): string {
  const base =
    networkId === "arbitrum-one"
      ? "https://arbiscan.io/address/"
      : "https://sepolia.arbiscan.io/address/";
  return `${base}${address}`;
}
