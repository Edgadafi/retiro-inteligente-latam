import fs from "node:fs";
import path from "node:path";
import { CdpAgentkit } from "@coinbase/cdp-agentkit-core";
import { agentConfig } from "./config/agent.config.js";
import { CONTRACTS, DAILY_SPENDING_LIMIT_MXNB } from "./config/contracts.js";
import { env } from "./config/env.js";
import {
  decryptWallet,
  encryptWallet,
  isEncryptedWalletPayload,
} from "./lib/crypto/wallet-crypto.js";

export interface AgentInitResult {
  agentkit: CdpAgentkit;
  networkId: string;
  walletAddress?: string;
}

let cachedAgent: AgentInitResult | null = null;

function resolveWalletDataPath(): string {
  return path.isAbsolute(env.AGENT_WALLET_DATA_PATH)
    ? env.AGENT_WALLET_DATA_PATH
    : path.resolve(process.cwd(), env.AGENT_WALLET_DATA_PATH);
}

function requireMasterKeyForProduction(): void {
  if (env.NODE_ENV === "production" && !env.WALLET_MASTER_KEY) {
    throw new Error(
      "WALLET_MASTER_KEY es obligatoria en producción para cifrar el monedero persistido.",
    );
  }
}

function loadPersistedWallet(): string | undefined {
  const walletPath = resolveWalletDataPath();
  if (!fs.existsSync(walletPath)) return undefined;

  const raw = fs.readFileSync(walletPath, "utf8");

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
    "[Agent] Wallet sin cifrar en disco — aceptable solo en desarrollo. " +
      "Define WALLET_MASTER_KEY antes de producción/KMS.",
  );
  return raw;
}

async function persistWallet(agentkit: CdpAgentkit): Promise<void> {
  requireMasterKeyForProduction();

  const walletPath = resolveWalletDataPath();
  const dir = path.dirname(walletPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const exported = await agentkit.exportWallet();

  const payload = env.WALLET_MASTER_KEY
    ? encryptWallet(exported, env.WALLET_MASTER_KEY)
    : exported;

  fs.writeFileSync(walletPath, payload, { encoding: "utf8", mode: 0o600 });
}

/**
 * Valida políticas TEE antes de ejecutar acciones on-chain vía el agente.
 * El LLM nunca accede a la seed; solo invoca herramientas MCP que pasan por aquí.
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
 * Inicializa el proveedor del monedero agéntico CDP con persistencia cifrada.
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
  const persistedWallet = loadPersistedWallet();

  const agentkit = await CdpAgentkit.configureWithWallet({
    cdpApiKeyName: apiKeyName,
    cdpApiKeyPrivateKey: apiKeyPrivateKey,
    networkId: env.NETWORK_ID,
    cdpWalletData: persistedWallet,
    source: agentConfig.id,
    sourceVersion: agentConfig.version,
  });

  await persistWallet(agentkit);

  cachedAgent = {
    agentkit,
    networkId: env.NETWORK_ID,
  };

  console.info(
    `[Agent] Monedero agéntico inicializado en ${env.NETWORK_ID}`,
    `| MXNB Sepolia: ${CONTRACTS.arbitrumSepolia.mxnb.proxy}`,
    `| Límite diario: ${DAILY_SPENDING_LIMIT_MXNB} MXNB`,
    `| Persistencia: ${env.WALLET_MASTER_KEY ? "cifrada AES-256-GCM" : "dev sin cifrar"}`,
  );

  return cachedAgent;
}

export function getAgentConfig() {
  return agentConfig;
}

export async function getAgentkit(): Promise<CdpAgentkit> {
  const { agentkit } = await initializeAgentWallet();
  return agentkit;
}
