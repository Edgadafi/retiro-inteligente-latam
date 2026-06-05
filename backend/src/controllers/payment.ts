import type { Request, Response } from "express";
import { z } from "zod";
import { getUserByClabe } from "../services/savings-plan.service.js";
import { depositRepository } from "../services/deposit.repository.js";
import { settlementProcessor } from "../services/settlement-processor.service.js";
import { buildProviderAudit } from "../lib/observability/provider-audit.js";
import type { BitsoFundingWebhookPayload } from "../types/webhook.types.js";
import type { DepositStatus } from "../types/deposit.types.js";

const webhookSchema = z.object({
  event: z.enum(["funding.completed", "funding.pending", "funding.failed", "payment.completed"]),
  payload: z.object({
    fid: z.string(),
    status: z.enum(["complete", "pending", "failed"]),
    created_at: z.string(),
    currency: z.literal("mxn"),
    method: z.string(),
    method_name: z.string(),
    amount: z.string(),
    asset: z.string(),
    network: z.string(),
    protocol: z.string(),
    integration: z.string(),
    details: z
      .object({
        receive_clabe: z.string().optional(),
        clabe: z.string().optional(),
        sender_name: z.string().optional(),
        concept: z.string().optional(),
      })
      .optional(),
  }),
});

/** Procesamiento async para no bloquear el ACK del webhook SPEI */
const inFlight = new Set<string>();

function mapInitialStatus(
  event: BitsoFundingWebhookPayload["event"],
  payloadStatus: BitsoFundingWebhookPayload["payload"]["status"],
): DepositStatus {
  if (event === "funding.failed" || payloadStatus === "failed") return "failed";
  if (event === "funding.pending" || payloadStatus === "pending") return "pending";
  return "processing";
}

function scheduleSettlement(fid: string): void {
  if (inFlight.has(fid)) return;
  inFlight.add(fid);

  void settlementProcessor
    .processDeposit(fid)
    .then((result) => {
      console.info(
        `[Payment] Settlement completado fid=${fid}`,
        `| status=${result.deposit.status}`,
        `| attempts=${result.attempts}`,
      );
    })
    .catch((error) => {
      console.error(
        `[Payment] Settlement diferido fid=${fid}:`,
        error instanceof Error ? error.message : error,
      );
    })
    .finally(() => {
      inFlight.delete(fid);
    });
}

/**
 * Webhook Bitso Business / Juno — resiliente ante latencia SPEI.
 *
 * 1. Idempotencia por `fid`
 * 2. Persistencia Supabase: pending → processing → settled | failed
 * 3. ACK inmediato 200 al proveedor
 * 4. Settlement con backoff exponencial en background + reconciler
 */
export async function handleBitsoFundingWebhook(
  req: Request,
  res: Response,
): Promise<void> {
  const parsed = webhookSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Payload de webhook inválido", details: parsed.error.flatten() });
    return;
  }

  const { event, payload } = parsed.data as BitsoFundingWebhookPayload;
  const webhookReceivedAt = new Date().toISOString();

  const bitsoAudit = buildProviderAudit({
    provider: "bitso",
    operation: "fundingWebhook",
    requestedAt: webhookReceivedAt,
    respondedAt: webhookReceivedAt,
    httpStatus: 200,
    rawRequest: req.body,
    rawResponse: { event, payload },
  });

  const clabe = payload.details?.receive_clabe ?? payload.details?.clabe;
  if (!clabe) {
    res.status(422).json({ error: "CLABE de destino no presente en el webhook" });
    return;
  }

  try {
    const existing = await depositRepository.findByFid(payload.fid);
    if (existing) {
      await depositRepository.logProviderAudit({
        fid: payload.fid,
        message: "Webhook Bitso re-entregado (idempotente)",
        audit: bitsoAudit,
        extra: { idempotent: true, event },
      });

      if (existing.status === "pending" || existing.status === "processing") {
        scheduleSettlement(payload.fid);
      }

      res.status(200).json({
        received: true,
        idempotent: true,
        deposit: existing,
        message: "Depósito ya registrado; reconciliación en curso si aplica",
      });
      return;
    }

    const account = await getUserByClabe(clabe);

    if (!account) {
      res.status(404).json({ error: `CLABE ${clabe} no registrada en el sistema` });
      return;
    }

    const amountMxn = parseFloat(payload.amount);
    if (isNaN(amountMxn) || amountMxn <= 0) {
      res.status(422).json({ error: "Monto MXN inválido" });
      return;
    }

    const initialStatus = mapInitialStatus(event, payload.status);

    const deposit = await depositRepository.create({
      fid: payload.fid,
      userId: account.userId,
      clabe,
      amountMxn,
      status: initialStatus,
      webhookEvent: event,
      metadata: {
        webhookReceivedAt,
        senderName: payload.details?.sender_name,
        concept: payload.details?.concept,
        providerAudit: bitsoAudit,
      },
    });

    await depositRepository.logProviderAudit({
      fid: payload.fid,
      message: "Webhook Bitso recibido",
      audit: bitsoAudit,
      extra: { initialStatus },
    });

    if (initialStatus !== "failed") {
      scheduleSettlement(payload.fid);
    } else {
      await depositRepository.transitionStatus(payload.fid, "failed", {
        lastError: `Webhook event=${event} status=${payload.status}`,
      });
    }

    res.status(200).json({
      received: true,
      deposit,
      message:
        initialStatus === "pending"
          ? "SPEI recibido; settlement en cola con reintentos"
          : "Depósito en procesamiento; settlement con backoff exponencial",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("[Payment] Webhook error:", message);
    res.status(500).json({ error: message });
  }
}

export async function getDepositStatus(req: Request, res: Response): Promise<void> {
  const fid = String(req.params.fid);

  try {
    const deposit = await depositRepository.findByFid(fid);
    if (!deposit) {
      res.status(404).json({ error: "Depósito no encontrado" });
      return;
    }

    const stateLogs = await depositRepository.getStateLogs(fid);
    res.json({ deposit, stateLogs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    res.status(500).json({ error: message });
  }
}

export async function retryDepositSettlement(req: Request, res: Response): Promise<void> {
  const fid = String(req.params.fid);

  try {
    scheduleSettlement(fid);
    res.status(202).json({
      accepted: true,
      fid,
      message: "Reintento de settlement encolado",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    res.status(500).json({ error: message });
  }
}
