import { executeTool, formatToolResult } from "../mcp/tools/handlers.js";
import type { AgentChatResponse, ChatMessage } from "./agent-chat.service.js";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

/**
 * Chat de Rito sin OpenAI — usa reglas + tools MCP reales.
 * Activo cuando AGENT_CHAT_SANDBOX_MODE=true o fallback por quota 429.
 */
export async function runAgentChatSandbox(params: {
  messages: ChatMessage[];
  userId?: string;
}): Promise<AgentChatResponse> {
  const last = params.messages[params.messages.length - 1]?.content.toLowerCase() ?? "";
  const userId = params.userId ?? "demo-gig-worker-001";
  const toolCalls: Array<{ name: string; result: string }> = [];

  const dailyMatch = last.match(/(\d+)\s*(diario|diarios|día|dia)/);
  const yearMatch = last.match(/(\d+)\s*años?/);
  const amountMatch = last.match(/\$?\s*(\d+)/);

  if (
    last.includes("proyect") ||
    last.includes("cuánto") ||
    last.includes("cuanto") ||
    last.includes("tendría") ||
    last.includes("tendria") ||
    (dailyMatch && yearMatch)
  ) {
    const daily = dailyMatch ? Number(dailyMatch[1]) : amountMatch ? Number(amountMatch[1]) : 50;
    const years = yearMatch ? Number(yearMatch[1]) : 20;
    const result = await executeTool("project_retirement_fund", {
      contributionPerPeriod: daily,
      periods: years * 365,
      frequency: "daily",
    });
    const text = formatToolResult(result);
    toolCalls.push({ name: "project_retirement_fund", result: text });

    if (result.success && result.data && typeof result.data === "object") {
      const data = result.data as {
        cetes?: { finalFund: number };
        afore?: { finalFund: number };
        advantageMxnb?: number;
        advantagePercent?: number;
      };
      return {
        message: `Con ${fmt(daily)} al día durante ${years} años, tu norte apunta a ${fmt(data.cetes?.finalFund ?? 0)} en CETES — ${fmt(data.advantageMxnb ?? 0)} más que un AFORE promedio (${data.advantagePercent ?? 0}%). Buen rumbo.`,
        toolCalls,
      };
    }
  }

  if (last.includes("clabe") || last.includes("spei") || last.includes("deposit")) {
    const result = await executeTool("get_savings_plan", {
      userId,
      createIfMissing: true,
    });
    const text = formatToolResult(result);
    toolCalls.push({ name: "get_savings_plan", result: text });

    if (result.success && result.data && typeof result.data === "object") {
      const plan = result.data as { clabe?: string };
      return {
        message: `Tu CLABE para SPEI es ${plan.clabe ?? "—"}. Envía ahí y Rito separa automáticamente hacia CETES. Sin trámites bancarios extra.`,
        toolCalls,
      };
    }
  }

  if (last.includes("cetes") || last.includes("afore") || last.includes("rendimiento")) {
    return {
      message:
        "Los CETES son bonos del gobierno mexicano — los más seguros del mercado. En Rito rinden ~11% anual tokenizados; un AFORE promedio ronda ~7.8%. Misma disciplina de ahorro, más retiro al final. ¿Proyectamos con tus números?",
      toolCalls,
    };
  }

  if (last.includes("hola") || last.includes("qué eres") || last.includes("que eres")) {
    return {
      message:
        "Hola — soy Rito, tu brújula de retiro. Te ayudo a ahorrar vía SPEI, convertir a MXNB e invertir en CETES on-chain. Pregúntame por proyecciones, tu CLABE o cómo funciona el flujo.",
    };
  }

  return {
    message:
      "Puedo proyectar tu retiro (ej. «$50 diarios por 20 años»), explicarte CETES vs AFORE o darte tu CLABE SPEI. ¿Por dónde empezamos?",
  };
}

export function isOpenAIQuotaError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes("429") || msg.includes("quota") || msg.includes("insufficient");
}
