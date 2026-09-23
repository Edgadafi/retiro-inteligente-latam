import type { AgentPersona } from "../config/agent-personas.js";

/**
 * docs/rita-soul.md §2 — El enlace a Aureo es obligatorio desde el CTA de la
 * calculadora. El prompt lo instruye, pero el modelo conoce el dominio y podría
 * escribirlo de todos modos, así que la regla se aplica también a la salida.
 */
const AUREO_DOMAIN = /(?:https?:\/\/)?(?:[a-z0-9-]+\.)*aureo(?:bitcoin)?\.(?:com|mx)[^\s)>\]"']*/gi;

const REDIRECT =
  "el enlace se habilita en la calculadora al seleccionar MXN como moneda de proyección";

export function stripAureoLinks(message: string): {
  message: string;
  redacted: boolean;
} {
  if (!AUREO_DOMAIN.test(message)) {
    AUREO_DOMAIN.lastIndex = 0;
    return { message, redacted: false };
  }
  AUREO_DOMAIN.lastIndex = 0;

  const cleaned = message
    .replace(AUREO_DOMAIN, REDIRECT)
    // "Aureo (el enlace se habilita...)" queda redundante entre paréntesis
    .replace(/\(\s*el enlace se habilita[^)]*\)/gi, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/ +([.,;])/g, "$1")
    .trim();

  return { message: cleaned, redacted: true };
}

export function applyPersonaOutputPolicy(
  persona: AgentPersona,
  message: string,
): string {
  if (persona !== "rita") return message;

  const { message: cleaned, redacted } = stripAureoLinks(message);
  if (redacted) {
    console.warn("[Rita] Enlace de Aureo removido de la respuesta (SOUL.md §2).");
  }
  return cleaned;
}
