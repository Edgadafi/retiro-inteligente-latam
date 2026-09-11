import { RITA_SOUL_SYSTEM_PROMPT, RITA_SOUL_VERSION } from "./soul.js";

export const AGENT_PERSONAS = ["rita"] as const;
export type AgentPersona = (typeof AGENT_PERSONAS)[number];

/**
 * "rito" fue el nombre anterior de la asistente. Se sigue aceptando en la API
 * para no romper clientes ya desplegados, pero resuelve a Rita.
 */
export const LEGACY_PERSONA_ALIASES: Record<string, AgentPersona> = {
  rito: "rita",
};

export function isAgentPersona(value: unknown): value is AgentPersona {
  return value === "rita";
}

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
  if (isAgentPersona(value)) return value;
  // hasOwn, no `in`: evita que claves heredadas ("toString", "constructor")
  // devuelvan algo que no es una persona.
  if (value !== undefined && Object.hasOwn(LEGACY_PERSONA_ALIASES, value)) {
    return LEGACY_PERSONA_ALIASES[value];
  }
  return "rita";
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
