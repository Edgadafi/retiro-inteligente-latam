import fs from "node:fs";
import path from "node:path";
import { env } from "../config/env.js";
import {
  decryptWallet,
  isEncryptedWalletPayload,
} from "./crypto/wallet-crypto.js";
import { agentSecretsRepository } from "../services/agent-secrets.repository.js";
import { isSupabaseConfigured } from "../db/supabase.client.js";

const AGENT_WALLET_ID = "cdp_wallet";

function resolveWalletDataPath(): string {
  return path.isAbsolute(env.AGENT_WALLET_DATA_PATH)
    ? env.AGENT_WALLET_DATA_PATH
    : path.resolve(process.cwd(), env.AGENT_WALLET_DATA_PATH);
}

export function useSupabaseWalletPersistence(): boolean {
  return Boolean(process.env.VERCEL) && isSupabaseConfigured();
}

function decryptStoredExport(raw: string): string {
  if (isEncryptedWalletPayload(raw)) {
    if (!env.WALLET_MASTER_KEY) {
      throw new Error(
        "Wallet cifrado detectado pero WALLET_MASTER_KEY no está configurada.",
      );
    }
    return decryptWallet(raw, env.WALLET_MASTER_KEY);
  }

  if (env.NODE_ENV === "production") {
    throw new Error(
      "Wallet en texto plano detectado en producción. Migra con WALLET_MASTER_KEY activa.",
    );
  }

  console.warn(
    "[WalletPersistence] Export sin cifrar — solo desarrollo.",
  );
  return raw;
}

export async function loadWalletExport(): Promise<string | undefined> {
  if (useSupabaseWalletPersistence()) {
    const row = await agentSecretsRepository.findById(AGENT_WALLET_ID);
    if (!row?.encryptedExport) return undefined;
    return decryptStoredExport(row.encryptedExport);
  }

  const walletPath = resolveWalletDataPath();
  if (!fs.existsSync(walletPath)) return undefined;
  const raw = fs.readFileSync(walletPath, "utf8");
  return decryptStoredExport(raw);
}

export async function saveWalletExport(
  encryptedPayload: string,
  meta?: { networkId: string; walletAddress?: string },
): Promise<void> {
  if (useSupabaseWalletPersistence()) {
    await agentSecretsRepository.upsert({
      id: AGENT_WALLET_ID,
      encryptedExport: encryptedPayload,
      networkId: meta?.networkId ?? env.NETWORK_ID,
      walletAddress: meta?.walletAddress,
    });
    return;
  }

  const walletPath = resolveWalletDataPath();
  const dir = path.dirname(walletPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(walletPath, encryptedPayload, { encoding: "utf8", mode: 0o600 });
}

export async function loadCachedWalletAddress(): Promise<string | undefined> {
  if (!useSupabaseWalletPersistence()) return undefined;
  const row = await agentSecretsRepository.findById(AGENT_WALLET_ID);
  return row?.walletAddress;
}

export { AGENT_WALLET_ID };
