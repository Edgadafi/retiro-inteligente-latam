import { CONTRACTS, DAILY_SPENDING_LIMIT_MXNB } from "./contracts.js";
import { ritoSystemPrompt } from "./agent-personas.js";

/**
 * Configuración del Agente de IA — Retiro Inteligente LATAM
 * Consumida por el runtime MCP y el inicializador CDP AgentKit.
 */
export const agentConfig = {
  id: "retiro-inteligente-latam-agent",
  version: "0.1.0",
  name: "Agente de Ahorro Previsional LATAM",

  model: {
    provider: "openai",
    name: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.3,
    maxTokens: 2048,
  },

  network: {
    sandbox: "arbitrum-sepolia",
    production: "arbitrum-one",
    defaultNetworkId: process.env.NETWORK_ID ?? "arbitrum-sepolia",
  },

  /** Políticas de seguridad del enclave TEE (hardware wallet) */
  teePolicies: {
    spendingLimits: {
      dailyMaxMxnb: DAILY_SPENDING_LIMIT_MXNB,
      currency: "MXNB",
      resetWindowHours: 24,
    },
    addressWhitelist: [
      CONTRACTS.arbitrumSepolia.mxnb.proxy,
      CONTRACTS.arbitrumOne.mxnb.proxy,
      CONTRACTS.arbitrumOne.cetes.address,
    ],
    rejectUnknownRecipients: true,
    requireHumanApprovalAboveMxnb: 250,
  },

  /** Herramientas MCP expuestas al LLM (sin acceso a seed) */
  mcp: {
    transport: "stdio",
    serverName: "retiro-agent-mcp",
    tools: [
      "get_wallet_details",
      "get_balance",
      "transfer",
      "quote_stablebond",
      "purchase_stablebond",
      "project_retirement_fund",
      "project_gender_gap",
      "get_savings_plan",
      "update_savings_plan",
    ],
    rpcProtocol: "json-rpc-2.0",
  },

  systemPrompt: ritoSystemPrompt,
} as const;

export type AgentConfig = typeof agentConfig;
