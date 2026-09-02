import { DAILY_SPENDING_LIMIT_MXNB } from "./contracts.js";
import { RITA_SOUL_SYSTEM_PROMPT, RITA_SOUL_VERSION } from "./soul.js";

export const AGENT_PERSONAS = ["rito", "rita"] as const;
export type AgentPersona = (typeof AGENT_PERSONAS)[number];

export function isAgentPersona(value: unknown): value is AgentPersona {
  return value === "rito" || value === "rita";
}

const SHARED_RULES = `
REGLAS ESTRICTAS:
- NUNCA solicites ni expongas claves privadas, seed phrases ni wallet secrets.
- Respeta el límite diario de ${DAILY_SPENDING_LIMIT_MXNB} MXNB en transferencias.
- Solo interactúa con direcciones en la whitelist (MXNB proxy y contratos Etherfuse).
- Compara contra AFORE (~7.84% anual) al proyectar rendimiento.
- Ahorro VOLUNTARIO complementario — no sustituto de AFORE/IMSS ni pensión pública.
- No prometas rendimientos garantizados; las tasas son estimados educativos.`;

export const ritoSystemPrompt = `Eres Rito — la brújula de retiro de Retiro Inteligente LATAM.

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
${SHARED_RULES}`;

/** Ver docs/rita-soul.md §10.4 — el prompt vive en soul.ts, no se duplica aquí. */
export const ritaSystemPrompt = RITA_SOUL_SYSTEM_PROMPT;

/**
 * Tools permitidas por persona.
 * SOUL.md §2 y §6.9: Rita calcula y explica, no opera — sin `transfer`
 * ni `purchase_stablebond`, que mueven dinero en nombre de la usuaria.
 */
const RITA_TOOLS = [
  "get_wallet_details",
  "get_balance",
  "quote_stablebond",
  "project_retirement_fund",
  "project_gender_gap",
  "get_savings_plan",
  "update_savings_plan",
] as const;

export const personaMeta = {
  rito: {
    id: "rito",
    displayName: "Rito",
    tagline: "Brújula de retiro",
    systemPrompt: ritoSystemPrompt,
    /** null = sin restricción; hereda la lista de agentConfig.mcp.tools */
    allowedTools: null,
  },
  rita: {
    id: "rita-retirobtc",
    displayName: "Rita",
    role: "Asistente Digital de Retiro Soberano con Bitcoin",
    tagline: "Retiro soberano para mujeres",
    soulVersion: RITA_SOUL_VERSION,
    systemPrompt: ritaSystemPrompt,
    allowedTools: RITA_TOOLS,
  },
} as const;

/** Contrato declarado en docs/rita-soul.md §10.4. */
export const ritaPersona = {
  id: personaMeta.rita.id,
  name: personaMeta.rita.displayName,
  role: personaMeta.rita.role,
  systemInstruction: RITA_SOUL_SYSTEM_PROMPT,
  temperature: 0.3,
} as const;

export function resolvePersona(value?: string): AgentPersona {
  return isAgentPersona(value) ? value : "rito";
}

export function getPersonaPrompt(persona?: string): string {
  return personaMeta[resolvePersona(persona)].systemPrompt;
}

/** Devuelve la allowlist de tools, o null si la persona no restringe ninguna. */
export function getPersonaAllowedTools(persona?: string): readonly string[] | null {
  return personaMeta[resolvePersona(persona)].allowedTools;
}

export function isToolAllowedForPersona(persona: string | undefined, tool: string): boolean {
  const allowed = getPersonaAllowedTools(persona);
  return allowed === null || allowed.includes(tool);
}
