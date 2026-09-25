import type { Request, Response } from "express";
import { z } from "zod";
import { runAgentChat, listAgentTools } from "../services/agent-chat.service.js";
import { getAgentConfig } from "../agent.js";
import { resolvePersona } from "../config/agent-personas.js";

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1),
      }),
    )
    .min(1),
  userId: z.string().optional(),
  /** "rito" es el nombre anterior de la asistente; resuelve a "rita". */
  persona: z.enum(["rita", "rito"]).optional(),
});

export async function postAgentChat(req: Request, res: Response): Promise<void> {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Payload inválido", details: parsed.error.flatten() });
    return;
  }

  try {
    const result = await runAgentChat({
      ...parsed.data,
      persona: resolvePersona(parsed.data.persona),
    });
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error del agente";
    res.status(500).json({ error: message });
  }
}

export function getAgentTools(_req: Request, res: Response): void {
  res.json({
    server: getAgentConfig().mcp.serverName,
    tools: listAgentTools(),
    teePolicies: getAgentConfig().teePolicies,
  });
}
