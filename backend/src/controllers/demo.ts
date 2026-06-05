import type { Request, Response } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";
import { getOrCreateSavingsPlan } from "../services/savings-plan.service.js";
import { depositRepository } from "../services/deposit.repository.js";
import { settlementProcessor } from "../services/settlement-processor.service.js";

const simulateSchema = z.object({
  userId: z.string().min(1),
  amountMxn: z.number().positive().default(100),
});

/**
 * Simula depósito SPEI completo: pending → settled → invested (sandbox on-chain).
 * Solo disponible con ONCHAIN_SANDBOX_MODE o NODE_ENV=development.
 */
export async function simulateSpeiDeposit(req: Request, res: Response): Promise<void> {
  if (!env.ONCHAIN_SANDBOX_MODE && env.NODE_ENV === "production") {
    res.status(403).json({ error: "Demo deshabilitada en producción" });
    return;
  }

  const parsed = simulateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Payload inválido", details: parsed.error.flatten() });
    return;
  }

  const { userId, amountMxn } = parsed.data;

  try {
    const plan = await getOrCreateSavingsPlan(userId);
    const fid = `sandbox-${randomUUID()}`;

    await depositRepository.create({
      fid,
      userId,
      clabe: plan.clabe,
      amountMxn,
      status: "pending",
      webhookEvent: "demo.simulate",
      metadata: {
        sandbox: true,
        simulatedAt: new Date().toISOString(),
      },
    });

    const result = await settlementProcessor.processDeposit(fid);

    res.status(201).json({
      message: "Flujo SPEI → MXNB → CETES simulado",
      deposit: result.deposit,
      cetesInvested: result.cetesInvested,
      attempts: result.attempts,
      traceUrl: `/api/deposits/${fid}`,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Error en simulación",
    });
  }
}
