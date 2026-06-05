import OpenAI from "openai";
import { agentConfig } from "../config/agent.config.js";
import { env } from "../config/env.js";
import {
  executeTool,
  formatToolResult,
  toolHandlers,
  type ToolName,
} from "../mcp/tools/handlers.js";

const openaiTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_wallet_details",
      description: "Obtiene detalles del monedero agéntico CDP (sin claves privadas).",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "get_balance",
      description: "Consulta balance de MXNB u otro asset.",
      parameters: {
        type: "object",
        properties: {
          assetId: { type: "string", description: "Asset ID o contrato MXNB" },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "transfer",
      description: "Transfiere MXNB respetando whitelist y límite diario TEE.",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number" },
          destination: { type: "string" },
          assetId: { type: "string" },
          gasless: { type: "boolean" },
        },
        required: ["amount", "destination"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "quote_stablebond",
      description: "Cotiza compra de CETES Stablebonds con MXNB.",
      parameters: {
        type: "object",
        properties: { amountMxnb: { type: "number" } },
        required: ["amountMxnb"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "purchase_stablebond",
      description: "Compra CETES tokenizados vía Etherfuse.",
      parameters: {
        type: "object",
        properties: {
          quoteId: { type: "string" },
          amountMxnb: { type: "number" },
          walletAddress: { type: "string" },
        },
        required: ["quoteId", "amountMxnb"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "project_retirement_fund",
      description: "Proyecta fondo de retiro CETES vs AFORE.",
      parameters: {
        type: "object",
        properties: {
          contributionPerPeriod: { type: "number" },
          periods: { type: "number" },
          frequency: { type: "string", enum: ["daily", "weekly"] },
          annualRate: { type: "number" },
        },
        required: ["contributionPerPeriod", "periods"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_savings_plan",
      description: "Obtiene plan de ahorro y CLABE SPEI del usuario.",
      parameters: {
        type: "object",
        properties: {
          userId: { type: "string" },
          createIfMissing: { type: "boolean" },
        },
        required: ["userId"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_savings_plan",
      description: "Actualiza configuración del plan de micro-ahorro.",
      parameters: {
        type: "object",
        properties: {
          userId: { type: "string" },
          contributionAmount: { type: "number" },
          contributionFrequency: { type: "string", enum: ["daily", "weekly"] },
          targetYears: { type: "number" },
          autoInvestCetes: { type: "boolean" },
        },
        required: ["userId"],
        additionalProperties: false,
      },
    },
  },
];

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AgentChatResponse {
  message: string;
  toolCalls?: Array<{ name: string; result: string }>;
}

/**
 * Orquesta conversación LLM ↔ herramientas MCP (mismos handlers que el servidor stdio).
 */
export async function runAgentChat(params: {
  messages: ChatMessage[];
  userId?: string;
}): Promise<AgentChatResponse> {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY requerida para el chat del agente.");
  }

  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const toolCallsLog: Array<{ name: string; result: string }> = [];

  const systemWithUser = params.userId
    ? `${agentConfig.systemPrompt}\n\nUsuario activo: ${params.userId}`
    : agentConfig.systemPrompt;

  const conversation: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemWithUser },
    ...params.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ];

  const MAX_ITERATIONS = 6;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const completion = await client.chat.completions.create({
      model: agentConfig.model.name,
      temperature: agentConfig.model.temperature,
      max_tokens: agentConfig.model.maxTokens,
      messages: conversation,
      tools: openaiTools,
      tool_choice: "auto",
    });

    const choice = completion.choices[0];
    if (!choice?.message) {
      throw new Error("Respuesta vacía del modelo.");
    }

    conversation.push(choice.message);

    const toolCalls = choice.message.tool_calls;
    if (!toolCalls?.length) {
      return {
        message: choice.message.content ?? "",
        toolCalls: toolCallsLog.length ? toolCallsLog : undefined,
      };
    }

    for (const toolCall of toolCalls) {
      if (toolCall.type !== "function") continue;

      const name = toolCall.function.name as ToolName;
      let args: Record<string, unknown> = {};

      try {
        args = JSON.parse(toolCall.function.arguments || "{}") as Record<string, unknown>;
      } catch {
        args = {};
      }

      if (params.userId && name === "get_savings_plan" && !args.userId) {
        args.userId = params.userId;
        args.createIfMissing = true;
      }

      const result =
        name in toolHandlers
          ? await executeTool(name, args)
          : { success: false, error: `Tool no registrada: ${name}` };

      const resultText = formatToolResult(result);
      toolCallsLog.push({ name, result: resultText });

      conversation.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: resultText,
      });
    }
  }

  return {
    message: "Alcancé el límite de iteraciones de herramientas. Intenta una consulta más específica.",
    toolCalls: toolCallsLog,
  };
}

export function listAgentTools() {
  return Object.keys(toolHandlers).map((name) => ({
    name,
    protocol: agentConfig.mcp.rpcProtocol,
    transport: agentConfig.mcp.transport,
  }));
}
