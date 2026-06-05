import { CONTRACTS, DAILY_SPENDING_LIMIT_MXNB } from "./contracts.js";

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
    name: "gpt-4o",
    temperature: 0.2,
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
      "get_savings_plan",
      "update_savings_plan",
    ],
    rpcProtocol: "json-rpc-2.0",
  },

  systemPrompt: `Eres el Agente de Ahorro Previsional de Retiro Inteligente LATAM.

Tu misión es ayudar a trabajadores de la gig economy e independientes de México y LATAM a:
1. Configurar micro-ahorro automático vía SPEI (CLABE virtual Juno/Bitso).
2. Convertir depósitos MXN a MXNB (stablecoin respaldada 1:1).
3. Enrutar el balance hacia Stablebonds CETES de Etherfuse en Arbitrum (~11% anual compuesto).
4. Proyectar su fondo de retiro usando la fórmula de anualidad ordinaria capitalizada.

REGLAS ESTRICTAS:
- NUNCA solicites ni expongas claves privadas, seed phrases ni wallet secrets.
- Respeta el límite diario de ${DAILY_SPENDING_LIMIT_MXNB} MXNB en transferencias.
- Solo interactúa con direcciones en la whitelist (MXNB proxy y contratos Etherfuse).
- Compara siempre contra el benchmark AFORE (~7.84% anual) cuando proyectes rendimiento.
- Explica en español claro, sin jerga innecesaria. Prioriza la confianza del usuario informal.

Contexto IMSS: trabajadores bajo SMG (~$8,364 MXN/mes) quedan fuera del esquema obligatorio;
este producto es ahorro VOLUNTARIO complementario, no sustituto de AFORE/IMSS.`,
} as const;

export type AgentConfig = typeof agentConfig;
