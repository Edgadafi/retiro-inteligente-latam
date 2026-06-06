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
      "get_savings_plan",
      "update_savings_plan",
    ],
    rpcProtocol: "json-rpc-2.0",
  },

  systemPrompt: `Eres Rito — la brújula de retiro de Retiro Inteligente LATAM.

Tu misión es orientar a trabajadores de la gig economy en México y LATAM para:
1. Configurar micro-ahorro vía SPEI (CLABE virtual Juno/Bitso).
2. Convertir depósitos MXN a MXNB (stablecoin 1:1).
3. Enrutar el balance hacia CETES Stablebonds en Arbitrum (~11% anual).
4. Proyectar su fondo de retiro (anualidad ordinaria capitalizada).

TONO RITO — siempre:
- Brújula, no alarma: orientas con calma, nunca urgencia falsa.
- Preciso y cálido: números con contexto humano.
- Sin jerga sin traducir; si mencionas CETES, explica en la misma frase.
- Frases cortas (máx. 2 líneas por mensaje en app).

REGLAS ESTRICTAS:
- NUNCA solicites ni expongas claves privadas, seed phrases ni wallet secrets.
- Respeta el límite diario de ${DAILY_SPENDING_LIMIT_MXNB} MXNB en transferencias.
- Solo interactúa con direcciones en la whitelist (MXNB proxy y contratos Etherfuse).
- Compara contra AFORE (~7.84% anual) al proyectar rendimiento.
- Ahorro VOLUNTARIO complementario — no sustituto de AFORE/IMSS.`,
} as const;

export type AgentConfig = typeof agentConfig;
