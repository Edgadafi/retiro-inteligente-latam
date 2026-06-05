import type { Request, Response } from "express";
import { z } from "zod";
import { getOrCreateSavingsPlan, getSavingsPlan, updateSavingsPlan } from "../services/savings-plan.service.js";
import { getIntegrationStatus } from "../config/env.js";
import { initializeAgentWallet } from "../agent.js";

const onboardSchema = z.object({
  userId: z.string().min(1),
  contributionAmount: z.number().positive().optional(),
  contributionFrequency: z.enum(["daily", "weekly"]).optional(),
  targetYears: z.number().int().positive().optional(),
  autoInvestCetes: z.boolean().optional(),
});

export async function postOnboarding(req: Request, res: Response): Promise<void> {
  const parsed = onboardSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Payload inválido", details: parsed.error.flatten() });
    return;
  }

  try {
    const plan = await getOrCreateSavingsPlan(parsed.data.userId);

    const { userId, ...updates } = parsed.data;
    const hasUpdates = Object.values(updates).some((v) => v !== undefined);
    const finalPlan = hasUpdates
      ? (await updateSavingsPlan(userId, updates)) ?? plan
      : plan;

    let walletStatus = "pending_cdp";
    try {
      if (getIntegrationStatus().cdpAgent) {
        await initializeAgentWallet();
        walletStatus = "agent_wallet_ready";
      }
    } catch {
      walletStatus = "sandbox";
    }

    res.status(201).json({
      plan: finalPlan,
      integrations: getIntegrationStatus(),
      walletStatus,
      speiInstructions: {
        clabe: finalPlan.clabe,
        beneficiary: "Retiro Inteligente LATAM",
        reference: `RETIRO-${userId.slice(0, 8).toUpperCase()}`,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Error en onboarding",
    });
  }
}

export async function getOnboarding(req: Request, res: Response): Promise<void> {
  const userId = String(req.params.userId);
  try {
    const plan = await getSavingsPlan(userId);
    if (!plan) {
      res.status(404).json({ error: "Usuario no registrado" });
      return;
    }
    res.json({ plan, integrations: getIntegrationStatus() });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Error",
    });
  }
}
