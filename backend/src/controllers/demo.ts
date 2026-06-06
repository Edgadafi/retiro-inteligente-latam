import type { Request, Response } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";
import { getOrCreateSavingsPlan } from "../services/savings-plan.service.js";
import { depositRepository } from "../services/deposit.repository.js";
import { scheduleDepositPipeline } from "../services/deposit-orchestrator.service.js";
import { mapDepositToUi } from "../lib/deposit-ui-status.js";

const simulateSchema = z.object({
  userId: z.string().min(1),
  amountMxn: z.number().positive().default(100),
});

/**
 * Simula depósito SPEI — responde inmediato en pending y procesa en background
 * para que el frontend pueda hacer polling visual de estados.
 */
export async function simulateSpeiDeposit(req: Request, res: Response): Promise<void> {
  if (!env.ONCHAIN_SANDBOX_MODE && env.NODE_ENV === "production") {
    res.status(403).json({ status: "error", error: "Demo deshabilitada en producción" });
    return;
  }

  const parsed = simulateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ status: "error", error: "Payload inválido", details: parsed.error.flatten() });
    return;
  }

  const { userId, amountMxn } = parsed.data;

  try {
    const plan = await getOrCreateSavingsPlan(userId);
    const fid = `sandbox-${randomUUID()}`;

    const deposit = await depositRepository.create({
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

    scheduleDepositPipeline(fid);

    const ui = mapDepositToUi(deposit.status);

    res.status(202).json({
      status: "success",
      data: {
        fid,
        deposit,
        ui,
        pollUrl: `/api/deposits/${fid}`,
        message: "SPEI simulado — consulta pollUrl para estados en tiempo real",
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: error instanceof Error ? error.message : "Error en simulación",
    });
  }
}
