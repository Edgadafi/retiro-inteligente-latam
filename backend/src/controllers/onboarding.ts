import type { Request, Response } from "express";
import { z } from "zod";
import { getOrCreateSavingsPlan, getSavingsPlan, updateSavingsPlan } from "../services/savings-plan.service.js";
import { env, getIntegrationStatus } from "../config/env.js";
import { initializeAgentWallet } from "../agent.js";
import { resolveAgentWalletAddress } from "../services/wallet.service.js";
import { sandboxWalletAddressForUser } from "../lib/wallet-address.js";

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
    let finalPlan = hasUpdates
      ? (await updateSavingsPlan(userId, updates)) ?? plan
      : plan;

    let walletStatus: "pending_cdp" | "agent_wallet_ready" | "sandbox" = "pending_cdp";
    let wallet: { address: string; networkId: string; mode: "agent" | "sandbox" };

    if (env.ONCHAIN_SANDBOX_MODE || !getIntegrationStatus().cdpAgent) {
      walletStatus = "sandbox";
      const address = sandboxWalletAddressForUser(userId);
      wallet = { address, networkId: env.NETWORK_ID, mode: "sandbox" };
      if (!finalPlan.walletAddress) {
        finalPlan =
          (await updateSavingsPlan(userId, { walletAddress: address })) ?? finalPlan;
      }
    } else {
      try {
        await initializeAgentWallet();
        const resolved = await resolveAgentWalletAddress();
        walletStatus = "agent_wallet_ready";
        wallet = resolved;
        if (!finalPlan.walletAddress || finalPlan.walletAddress !== resolved.address) {
          finalPlan =
            (await updateSavingsPlan(userId, { walletAddress: resolved.address })) ??
            finalPlan;
        }
      } catch {
        walletStatus = "sandbox";
        const address = sandboxWalletAddressForUser(userId);
        wallet = { address, networkId: env.NETWORK_ID, mode: "sandbox" };
        finalPlan =
          (await updateSavingsPlan(userId, { walletAddress: address })) ?? finalPlan;
      }
    }

    res.status(201).json({
      plan: finalPlan,
      integrations: getIntegrationStatus(),
      walletStatus,
      wallet,
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
