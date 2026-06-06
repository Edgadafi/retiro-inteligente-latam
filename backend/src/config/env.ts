import { config } from "dotenv";
import { z } from "zod";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../../../.env") });

/** Trata strings vacíos del .env como undefined (evita fallos Zod en campos opcionales). */
function emptyToUndefined(value: unknown): unknown {
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}

const optionalString = z.preprocess(emptyToUndefined, z.string().optional());
const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional());
const optionalMin1 = z.preprocess(emptyToUndefined, z.string().min(1).optional());
const optionalMasterKey = z.preprocess(emptyToUndefined, z.string().min(32).optional());

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),

  CDP_API_KEY_NAME: optionalMin1,
  CDP_API_KEY_PRIVATE_KEY: optionalMin1,
  CDP_API_KEY_ID: optionalMin1,
  CDP_API_KEY_SECRET: optionalMin1,
  NETWORK_ID: z.string().default("arbitrum-sepolia"),
  AGENT_WALLET_DATA_PATH: z.string().default("./data/agent-wallet.json"),
  /** Clave maestra para cifrar wallet en disco (32+ chars o 64 hex). En prod usar KMS/HSM. */
  WALLET_MASTER_KEY: optionalMasterKey,

  SUPABASE_URL: optionalUrl,
  SUPABASE_SERVICE_ROLE_KEY: optionalString,

  SETTLEMENT_MAX_ATTEMPTS: z.coerce.number().int().positive().default(10),
  SETTLEMENT_BASE_DELAY_MS: z.coerce.number().int().positive().default(2_000),
  SETTLEMENT_MAX_DELAY_MS: z.coerce.number().int().positive().default(120_000),
  SETTLEMENT_RECONCILE_INTERVAL_MS: z.coerce.number().int().positive().default(60_000),
  SETTLEMENT_JITTER_STRATEGY: z
    .enum(["full", "equal", "none"])
    .default("full"),


  JUNO_API_BASE_URL: z.string().url().default("https://stage.buildwithjuno.com"),
  JUNO_API_KEY: optionalString,
  BITSO_WEBHOOK_SECRET: optionalString,

  ETHERFUSE_API_BASE_URL: optionalUrl,
  ETHERFUSE_API_KEY: optionalString,

  ARBITRUM_SEPOLIA_RPC_URL: optionalUrl,
  ARBITRUM_ONE_RPC_URL: optionalUrl,

  OPENAI_API_KEY: optionalString,
  /** Modelo para chat del agente Rito (tool calling) */
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),

  /** Chat Rito sin OpenAI (reglas + MCP) — útil si falta key o quota 429 */
  AGENT_CHAT_SANDBOX_MODE: z
    .preprocess(
      (v) => (v === "true" || v === "1" ? true : v === "false" || v === "0" ? false : v),
      z.boolean().optional(),
    )
    .optional(),

  /** Simula mint MXNB + compra CETES cuando faltan credenciales CDP/Etherfuse */
  ONCHAIN_SANDBOX_MODE: z
    .preprocess(
      (v) => (v === "true" || v === "1" ? true : v === "false" || v === "0" ? false : v),
      z.boolean().optional(),
    )
    .optional(),
});

const parsed = envSchema.parse(process.env);

export const env = {
  ...parsed,
  CDP_API_KEY_NAME: parsed.CDP_API_KEY_NAME ?? parsed.CDP_API_KEY_ID,
  CDP_API_KEY_PRIVATE_KEY: parsed.CDP_API_KEY_PRIVATE_KEY ?? parsed.CDP_API_KEY_SECRET,
  AGENT_CHAT_SANDBOX_MODE:
    parsed.AGENT_CHAT_SANDBOX_MODE ?? !parsed.OPENAI_API_KEY,
  ONCHAIN_SANDBOX_MODE:
    parsed.ONCHAIN_SANDBOX_MODE ??
    (
      !(parsed.CDP_API_KEY_NAME ?? parsed.CDP_API_KEY_ID) ||
      !(parsed.CDP_API_KEY_PRIVATE_KEY ?? parsed.CDP_API_KEY_SECRET)
    ),
};

export function getIntegrationStatus() {
  return {
    supabase: Boolean(parsed.SUPABASE_URL && parsed.SUPABASE_SERVICE_ROLE_KEY),
    cdpAgent: Boolean(env.CDP_API_KEY_NAME && env.CDP_API_KEY_PRIVATE_KEY),
    juno: Boolean(parsed.JUNO_API_KEY),
    etherfuse: Boolean(parsed.ETHERFUSE_API_KEY),
    openai: Boolean(parsed.OPENAI_API_KEY) && !env.AGENT_CHAT_SANDBOX_MODE,
    openaiKeyPresent: Boolean(parsed.OPENAI_API_KEY),
    agentChatSandbox: env.AGENT_CHAT_SANDBOX_MODE,
    onchainSandbox: env.ONCHAIN_SANDBOX_MODE,
    networkId: parsed.NETWORK_ID,
  };
}
