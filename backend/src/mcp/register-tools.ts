import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { agentConfig } from "../config/agent.config.js";
import {
  executeTool,
  formatToolResult,
  type ToolName,
} from "./tools/handlers.js";

async function runTool(name: ToolName, args: Record<string, unknown>) {
  const result = await executeTool(name, args);
  return {
    content: [{ type: "text" as const, text: formatToolResult(result) }],
    isError: !result.success,
  };
}

/**
 * Registra las herramientas MCP definidas en agent.config.ts.
 * El LLM invoca estas tools vía JSON-RPC; nunca accede a la seed del wallet.
 */
export function registerRetiroTools(server: McpServer): void {
  server.registerTool(
    "get_wallet_details",
    {
      title: "Detalles del monedero agéntico",
      description:
        "Obtiene dirección, red y estado del monedero CDP protegido en TEE. No expone claves privadas.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => runTool("get_wallet_details", {}),
  );

  server.registerTool(
    "get_balance",
    {
      title: "Consultar balance",
      description: "Consulta el balance del monedero agéntico para un asset (MXNB por defecto).",
      inputSchema: {
        assetId: z
          .string()
          .optional()
          .describe("ID del asset o dirección del contrato MXNB"),
      },
      annotations: { readOnlyHint: true },
    },
    async (args) => runTool("get_balance", args),
  );

  server.registerTool(
    "transfer",
    {
      title: "Transferir MXNB",
      description: `Transfiere MXNB solo a direcciones en whitelist. Límite diario: ${agentConfig.teePolicies.spendingLimits.dailyMaxMxnb} MXNB.`,
      inputSchema: {
        amount: z.number().positive().describe("Monto en MXNB"),
        destination: z.string().describe("Dirección destino (debe estar en whitelist)"),
        assetId: z.string().optional().describe("Asset ID, default MXNB"),
        gasless: z.boolean().optional().describe("Usar transferencia gasless si disponible"),
      },
      annotations: { destructiveHint: true },
    },
    async (args) => runTool("transfer", args),
  );

  server.registerTool(
    "quote_stablebond",
    {
      title: "Cotizar CETES Stablebond",
      description: "Cotiza la compra de CETES tokenizados (Etherfuse) con MXNB.",
      inputSchema: {
        amountMxnb: z.number().positive().describe("Monto MXNB a invertir"),
      },
      annotations: { readOnlyHint: true },
    },
    async (args) => runTool("quote_stablebond", args),
  );

  server.registerTool(
    "purchase_stablebond",
    {
      title: "Comprar CETES Stablebond",
      description:
        "Ejecuta la compra de CETES tokenizados. Requiere quoteId previo y respeta políticas TEE.",
      inputSchema: {
        quoteId: z.string().describe("ID de cotización Etherfuse"),
        amountMxnb: z.number().positive().describe("Monto MXNB"),
        walletAddress: z.string().optional().describe("Dirección del monedero agéntico"),
      },
      annotations: { destructiveHint: true },
    },
    async (args) => runTool("purchase_stablebond", args),
  );

  server.registerTool(
    "project_retirement_fund",
    {
      title: "Proyectar fondo de retiro",
      description:
        "Calcula Vf usando anualidad ordinaria capitalizada. Compara CETES (~11%) vs AFORE (~7.84%).",
      inputSchema: {
        contributionPerPeriod: z.number().positive().describe("Aportación por periodo (MXN)"),
        periods: z.number().int().positive().describe("Número de periodos (ej. días)"),
        frequency: z
          .enum(["daily", "weekly"])
          .optional()
          .describe("Frecuencia de aportación"),
        annualRate: z.number().optional().describe("Tasa anual override"),
      },
      annotations: { readOnlyHint: true },
    },
    async (args) => runTool("project_retirement_fund", args),
  );

  server.registerTool(
    "get_savings_plan",
    {
      title: "Obtener plan de ahorro",
      description: "Consulta el plan de ahorro del usuario incluyendo CLABE SPEI virtual.",
      inputSchema: {
        userId: z.string().describe("ID del usuario"),
        createIfMissing: z
          .boolean()
          .optional()
          .describe("Crear plan con CLABE si no existe"),
      },
      annotations: { readOnlyHint: true },
    },
    async (args) => runTool("get_savings_plan", args),
  );

  server.registerTool(
    "update_savings_plan",
    {
      title: "Actualizar plan de ahorro",
      description: "Actualiza monto, frecuencia u horizonte del plan de micro-ahorro.",
      inputSchema: {
        userId: z.string().describe("ID del usuario"),
        contributionAmount: z.number().positive().optional(),
        contributionFrequency: z.enum(["daily", "weekly"]).optional(),
        targetYears: z.number().int().positive().optional(),
        autoInvestCetes: z.boolean().optional(),
      },
    },
    async (args) => runTool("update_savings_plan", args),
  );

  server.registerPrompt(
    "retiro_system",
    {
      title: "System Prompt — Retiro Inteligente LATAM",
      description: "Prompt base del agente de ahorro previsional",
      argsSchema: {},
    },
    async () => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: agentConfig.systemPrompt,
          },
        },
      ],
    }),
  );

}
