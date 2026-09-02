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

  const dailyMatch = last.match(/(\d+)\s*(?:pesos\s*)?(?:diario|diarios|al día|al dia|por día|por dia)/);
  const weeklyMatch = last.match(/(\d+)\s*(?:pesos\s*)?(?:semanal|semanales|a la semana|por semana)/);
  const yearMatch = last.match(/(\d+)\s*años?/);
  const ageMatch = last.match(/(\d+)\s*años? de edad/) ?? last.match(/tengo (\d+)/);
  const pauseMatch = last.match(/(\d+)\s*años? (de )?(pausa|cuidados|maternidad)/);
  /** Solo cuenta como monto si trae `$` o la palabra "pesos" — un número suelto suele ser años. */
  const amountMatch = last.match(/\$\s*(\d+)/) ?? last.match(/(\d+)\s*pesos/);

  const genderGapIntent =
    persona === "rita" &&
    (last.includes("brecha") ||
      last.includes("pausa") ||
      last.includes("maternidad") ||
      last.includes("cuidados") ||
      last.includes("cuidado"));

  if (persona === "rita") {
    const canned = ritaCannedResponse(last);
    if (canned) return { message: canned, toolCalls };
  }

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
    const daily = dailyMatch
      ? Number(dailyMatch[1])
      : weeklyMatch
        ? Number(weeklyMatch[1]) / 7
        : amountMatch
          ? Number(amountMatch[1])
          : 50;
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
            ? `Tu CLABE para aportar por SPEI es ${plan.clabe ?? "—"}. Transfieres desde tu banco; el monto se convierte a MXNB, un peso digital respaldado 1:1, y se resguarda en CETES. Tú conservas la decisión y la custodia.`
            : `Tu CLABE para SPEI es ${plan.clabe ?? "—"}. Envía ahí y Rito separa automáticamente hacia CETES. Sin trámites bancarios extra.`,
        toolCalls,
      };
    }
  }

  if (last.includes("cetes") || last.includes("afore") || last.includes("rendimiento") || last.includes("modalidad")) {
    if (persona === "rita") {
      return {
        message:
          "Los CETES son bonos del gobierno mexicano, de renta fija. La proyección vigente ronda ~11% anual estimado, frente a ~7.8% de una AFORE promedio — son estimaciones, no rendimientos asegurados. Modalidad 40 es un trámite independiente ante el IMSS: esta reserva la complementa, no la sustituye.",
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
          ? `${AI_DECLARATION} Puedo estimar tu brecha de retiro, proyectar tu ahorro en CETES o explicarte el flujo de aportación.`
          : "Hola — soy Rito, tu brújula de retiro. Te ayudo a ahorrar vía SPEI, convertir a MXNB e invertir en CETES on-chain. Pregúntame por proyecciones, tu CLABE o cómo funciona el flujo.",
    };
  }

  return {
    message:
      persona === "rita"
        ? "Puedo estimar tu brecha de retiro (edad, aportación semanal y años de pausa por cuidados), proyectar CETES frente a tu AFORE o explicarte cómo se aporta por SPEI. ¿Con qué empezamos?"
        : "Puedo proyectar tu retiro (ej. «$50 diarios por 20 años»), explicarte CETES vs AFORE o darte tu CLABE SPEI. ¿Por dónde empezamos?",
  };
}

/** docs/rita-soul.md §10.1 */
const AI_DECLARATION =
  "Soy Rita, una asistente digital basada en inteligencia artificial de retirobtc.mx. Mi objetivo es darte información técnica, financiera y fiscal para acompañarte en tu planeación de retiro, sin presiones ni sesgos comerciales. Todas las decisiones sobre tu dinero y la custodia de tus activos son 100% tuyas.";

/**
 * Respuestas canónicas de docs/rita-soul.md §10 para el modo sin LLM.
 * El orden importa: los casos más específicos van primero.
 */
function ritaCannedResponse(last: string): string | null {
  const has = (...terms: string[]) => terms.some((t) => last.includes(t));

  if (has("eres humana", "eres una persona", "eres real", "eres un bot", "eres una ia", "hablo con una persona")) {
    return AI_DECLARATION;
  }

  if (has("esposo", "marido", "mi pareja maneja", "él maneja")) {
    return "Las dinámicas de administración en pareja son muy respetables y válidas. Al mismo tiempo, contar con una reserva personal para el retiro es una medida de protección preventiva para ti y para la estabilidad de toda la familia. Tener un ahorro a tu nombre no contradice la economía del hogar; suma una capa de certeza para tu vejez.";
  }

  if (has("estafa", "fraude", "pirámide", "piramide", "confiar")) {
    return "Te desgloso la arquitectura: aportas por SPEI desde tu banco, el monto se convierte a MXNB (un peso digital respaldado 1:1) y se resguarda en CETES, bonos del gobierno mexicano. La reserva de largo plazo en Bitcoin es opcional y de custodia individual. En todo momento conservas visibilidad sobre tus recursos y yo no ejecuto movimientos de dinero.";
  }

  if (has("resico", "sat", "deducir", "deducción", "deduccion", "impuesto", "declaración anual", "declaracion anual")) {
    return "Si tributas en RESICO, tienes tasas preferenciales de ISR (1% a 2.5%), pero ese régimen no permite deducciones personales anuales como los PPR del Art. 151 de la LISR. En Sueldos y Salarios o Servicios Profesionales, las aportaciones a planes de retiro sí pueden reducir tu base gravable. En ambos casos, la reserva de largo plazo funciona como resguardo patrimonial, independientemente de tu esquema fiscal. Para tu caso puntual conviene validarlo con un contador.";
  }

  if (has("volatilidad", "cayó", "cayo", "bajó bitcoin", "se desplomó", "perdí", "riesgoso")) {
    return "Las fluctuaciones marcadas de precio en periodos cortos son habituales en el mercado de Bitcoin. El ahorro para el retiro no se mide en días o meses, sino en ciclos de 10, 15 o 20 años. Si tu estrategia combina estabilidad de corto plazo en CETES con una reserva soberana de largo plazo, los movimientos diarios no alteran la meta de preservar tu poder adquisitivo.";
  }

  if (has("mi empresa", "recursos humanos", "colaboradoras", "empleadas", "asesor", "hablar con alguien", "persona del equipo", "no me llegó", "no me llego", "no se acreditó", "no se acredito")) {
    return "Para coordinar un esquema de ahorro corporativo o revisar un caso operativo con el equipo humano de retirobtc.mx, te pongo en contacto directo con nuestra área de atención: contacto@retirobtc.mx.";
  }

  if (has("divorcio", "sociedad conyugal", "bienes mancomunados", "separación", "separacion")) {
    return "Bajo el régimen de sociedad conyugal, los bienes adquiridos durante el matrimonio suelen formar parte del haber común, salvo capitulaciones específicas. La titularidad y las claves de custodia de activos digitales son de acceso estrictamente individual. Para tu situación concreta te sugiero validar los términos con un especialista en derecho familiar.";
  }

  if (has("no me alcanza", "no puedo ahorrar", "muy poco", "apenas me alcanza")) {
    return "Tu presupuesto es el punto de partida, no un examen. No hay un monto mínimo obligatorio y la prioridad siempre es la estabilidad de tu hogar en el presente. Cuando tengas margen, la constancia de las aportaciones suele pesar más que el monto inicial.";
  }

  return null;
}

export function isOpenAIQuotaError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes("429") || msg.includes("quota") || msg.includes("insufficient");
}
