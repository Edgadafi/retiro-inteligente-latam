import { CdpAgentkit, GetWalletDetailsAction } from "@coinbase/cdp-agentkit-core";
import { agentConfig } from "./config/agent.config.js";
import { CONTRACTS, DAILY_SPENDING_LIMIT_MXNB } from "./config/contracts.js";
import { env } from "./config/env.js";
import { encryptWallet } from "./lib/crypto/wallet-crypto.js";
import {
  loadCachedWalletAddress,
  loadWalletExport,
  saveWalletExport,
} from "./lib/wallet-persistence.js";
import { extractWalletAddress } from "./lib/wallet-address.js";

export interface AgentInitResult {
  agentkit: CdpAgentkit;
  networkId: string;
  walletAddress?: string;
}

let cachedAgent: AgentInitResult | null = null;

function requireMasterKeyForProduction(): void {
  if (env.NODE_ENV === "production" && !env.WALLET_MASTER_KEY) {
    throw new Error(
      "WALLET_MASTER_KEY es obligatoria en producción para cifrar el monedero persistido.",
    );
  }
}

async function resolveWalletAddress(
  agentkit: CdpAgentkit,
): Promise<string | undefined> {
  const cached = await loadCachedWalletAddress();
  if (cached) return cached;

  const action = new GetWalletDetailsAction();
  const result = await agentkit.run(action, {} as never);
  return extractWalletAddress(result);
}

async function persistWallet(
  agentkit: CdpAgentkit,
  walletAddress?: string,
): Promise<void> {
  requireMasterKeyForProduction();

  const exported = await agentkit.exportWallet();
  const payload = env.WALLET_MASTER_KEY
    ? encryptWallet(exported, env.WALLET_MASTER_KEY)
    : exported;

  await saveWalletExport(payload, {
    networkId: env.NETWORK_ID,
    walletAddress,
  });
}

/**
 * Valida políticas TEE antes de ejecutar acciones on-chain vía el agente.
 */
export function enforceTeePolicy(params: {
  toAddress: string;
  amountMxnb: number;
  dailySpentMxnb?: number;
}): void {
  const normalizedTo = params.toAddress.toLowerCase();
  const isWhitelisted = agentConfig.teePolicies.addressWhitelist.some(
    (addr) => addr.toLowerCase() === normalizedTo,
  );

  if (!isWhitelisted && agentConfig.teePolicies.rejectUnknownRecipients) {
    throw new Error(
      `TEE Policy: dirección ${params.toAddress} no está en la whitelist (MXNB / Etherfuse).`,
    );
  }

  const projectedDaily = (params.dailySpentMxnb ?? 0) + params.amountMxnb;
  if (projectedDaily > DAILY_SPENDING_LIMIT_MXNB) {
    throw new Error(
      `TEE Policy: límite diario de ${DAILY_SPENDING_LIMIT_MXNB} MXNB excedido.`,
    );
  }
}

/**
 * Inicializa el monedero agéntico CDP con persistencia cifrada (disco o Supabase).
 */
export async function initializeAgentWallet(): Promise<AgentInitResult> {
  if (cachedAgent) return cachedAgent;

  const apiKeyName = env.CDP_API_KEY_NAME;
  const apiKeyPrivateKey = env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!apiKeyName || !apiKeyPrivateKey) {
    throw new Error(
      "CDP_API_KEY_NAME y CDP_API_KEY_PRIVATE_KEY son requeridos para el monedero agéntico.",
    );
  }

  requireMasterKeyForProduction();
  const persistedWallet = await loadWalletExport();

  const agentkit = await CdpAgentkit.configureWithWallet({
    cdpApiKeyName: apiKeyName,
    cdpApiKeyPrivateKey: apiKeyPrivateKey,
    networkId: env.NETWORK_ID,
    cdpWalletData: persistedWallet,
    source: agentConfig.id,
    sourceVersion: agentConfig.version,
  });

  const walletAddress = await resolveWalletAddress(agentkit);
  await persistWallet(agentkit, walletAddress);

  cachedAgent = {
    agentkit,
    networkId: env.NETWORK_ID,
    walletAddress,
  };

  console.info(
    `[Agent] Monedero agéntico inicializado en ${env.NETWORK_ID}`,
    walletAddress ? `| ${walletAddress}` : "",
    `| MXNB Sepolia: ${CONTRACTS.arbitrumSepolia.mxnb.proxy}`,
    `| Límite diario: ${DAILY_SPENDING_LIMIT_MXNB} MXNB`,
    `| Persistencia: ${env.WALLET_MASTER_KEY ? "cifrada AES-256-GCM" : "dev sin cifrar"}`,
  );

  return cachedAgent;
}

export function getCachedAgentWallet(): AgentInitResult | null {
  return cachedAgent;
}

export function getAgentConfig() {
  return agentConfig;
}

export async function getAgentkit(): Promise<CdpAgentkit> {
  const { agentkit } = await initializeAgentWallet();
  return agentkit;
}
