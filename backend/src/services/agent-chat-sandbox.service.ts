import { executeTool, formatToolResult } from "../mcp/tools/handlers.js";
import { resolvePersona, type AgentPersona } from "../config/agent-personas.js";
import type { AgentChatResponse, ChatMessage } from "./agent-chat.service.js";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

/**
 * Chat sin OpenAI — reglas + tools MCP reales.
 * Activo cuando AGENT_CHAT_SANDBOX_MODE=true o fallback por quota 429.
 */
export async function runAgentChatSandbox(params: {
  messages: ChatMessage[];
  userId?: string;
  persona?: AgentPersona;
}): Promise<AgentChatResponse> {
  const last = params.messages[params.messages.length - 1]?.content.toLowerCase() ?? "";
  const persona = resolvePersona(params.persona);
  const userId = params.userId ?? (persona === "rita" ? "demo-rita-001" : "demo-gig-worker-001");
  const toolCalls: Array<{ name: string; result: string }> = [];

  const dailyMatch = last.match(/(\d+)\s*(diario|diarios|día|dia)/);
  const weeklyMatch = last.match(/(\d+)\s*(semanal|semana)/);
  const yearMatch = last.match(/(\d+)\s*años?/);
  const ageMatch = last.match(/(\d+)\s*años? de edad/) ?? last.match(/tengo (\d+)/);
  const pauseMatch = last.match(/(\d+)\s*años? (de )?(pausa|cuidados|maternidad)/);
  const amountMatch = last.match(/\$?\s*(\d+)/);

  const genderGapIntent =
    persona === "rita" &&
    (last.includes("brecha") ||
      last.includes("pausa") ||
      last.includes("maternidad") ||
      last.includes("cuidados") ||
      last.includes("cuidado"));

  if (genderGapIntent) {
    const weekly = weeklyMatch
      ? Number(weeklyMatch[1])
      : dailyMatch
        ? Number(dailyMatch[1]) * 7
        : amountMatch
          ? Number(amountMatch[1])
          : 200;
    const currentAge = ageMatch ? Number(ageMatch[1]) : 32;
    const carePauseYears = pauseMatch ? Number(pauseMatch[1]) : last.includes("pausa") ? 3 : 0;
    const result = await executeTool("project_gender_gap", {
      currentAge,
      weeklyContribution: weekly,
      carePauseYears,
    });
    const text = formatToolResult(result);
    toolCalls.push({ name: "project_gender_gap", result: text });

    if (result.success && result.data && typeof result.data === "object") {
      const data = result.data as {
        gapMxn?: number;
        weeklyToCloseGap?: number | null;
        extraRetirementYears?: number;
        ritaCetes?: { finalFund: number };
      };
      const extra = data.weeklyToCloseGap
        ? ` Con ${fmt(data.weeklyToCloseGap)} extra a la semana se cierra la brecha de acumulación.`
        : "";
      return {
        message: `Con ${fmt(weekly)} semanales y ${carePauseYears} años de pausa, tu fondo en CETES apunta a ${fmt(data.ritaCetes?.finalFund ?? 0)}. La brecha vs una carrera continua es ${fmt(data.gapMxn ?? 0)} — y hay ${data.extraRetirementYears ?? 6} años extra de retiro que financiar.${extra} Es ahorro voluntario, no una pensión.`,
        toolCalls,
      };
    }
  }

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
      const close =
        persona === "rita"
          ? `Con ${fmt(daily)} al día durante ${years} años, el fondo en CETES apunta a ${fmt(data.cetes?.finalFund ?? 0)} — ${fmt(data.advantageMxnb ?? 0)} más que un AFORE promedio. Si quieres, calculamos la brecha con pausas por cuidados.`
          : `Con ${fmt(daily)} al día durante ${years} años, tu norte apunta a ${fmt(data.cetes?.finalFund ?? 0)} en CETES — ${fmt(data.advantageMxnb ?? 0)} más que un AFORE promedio (${data.advantagePercent ?? 0}%). Buen rumbo.`;
      return { message: close, toolCalls };
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
        message:
          persona === "rita"
            ? `Tu CLABE para SPEI es ${plan.clabe ?? "—"}. Envías desde tu banco; Rita separa hacia CETES. Tú no tocas cripto.`
            : `Tu CLABE para SPEI es ${plan.clabe ?? "—"}. Envía ahí y Rito separa automáticamente hacia CETES. Sin trámites bancarios extra.`,
        toolCalls,
      };
    }
  }

  if (last.includes("cetes") || last.includes("afore") || last.includes("rendimiento") || last.includes("modalidad")) {
    if (persona === "rita") {
      return {
        message:
          "Los CETES son bonos del gobierno mexicano. Aquí rinden ~11% anual tokenizados; un AFORE promedio ronda ~7.8%. Modalidad 40 es un trámite IMSS aparte: Rita no la sustituye, solo complementa el ahorro voluntario. ¿Calculamos tu brecha?",
        toolCalls,
      };
    }
    return {
      message:
        "Los CETES son bonos del gobierno mexicano — los más seguros del mercado. En Rito rinden ~11% anual tokenizados; un AFORE promedio ronda ~7.8%. Misma disciplina de ahorro, más retiro al final. ¿Proyectamos con tus números?",
      toolCalls,
    };
  }

  if (last.includes("hola") || last.includes("qué eres") || last.includes("que eres")) {
    return {
      message:
        persona === "rita"
          ? "Hola — soy Rita. Te ayudo a ver la brecha pensional de género y a ahorrar vía SPEI hacia CETES, sin pedirte que aprendas cripto. Pregúntame por tu brecha, una pausa por cuidados o tu CLABE."
          : "Hola — soy Rito, tu brújula de retiro. Te ayudo a ahorrar vía SPEI, convertir a MXNB e invertir en CETES on-chain. Pregúntame por proyecciones, tu CLABE o cómo funciona el flujo.",
    };
  }

  return {
    message:
      persona === "rita"
        ? "Puedo estimar tu brecha (edad, ahorro semanal y años de pausa), proyectar CETES vs AFORE o darte tu CLABE SPEI. ¿Por dónde empezamos?"
        : "Puedo proyectar tu retiro (ej. «$50 diarios por 20 años»), explicarte CETES vs AFORE o darte tu CLABE SPEI. ¿Por dónde empezamos?",
  };
}

export function isOpenAIQuotaError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes("429") || msg.includes("quota") || msg.includes("insufficient");
}
