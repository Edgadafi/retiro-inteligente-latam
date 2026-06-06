import type { Request, Response } from "express";
import { z } from "zod";
import { SiweMessage } from "siwe";
import { env } from "../config/env.js";
import { arbiscanAddressUrl } from "../lib/wallet-address.js";
import { getSavingsPlan, updateSavingsPlan } from "../services/savings-plan.service.js";
import {
  getWalletForUser,
  listWalletTransactions,
} from "../services/wallet.service.js";

const userIdQuery = z.object({
  userId: z.string().min(1),
});

const linkSchema = z.object({
  userId: z.string().min(1),
  message: z.string().min(1),
  signature: z.string().min(1),
});

const withdrawSchema = z.object({
  userId: z.string().min(1),
  amountMxnb: z.number().positive().max(500),
});

export async function getWallet(req: Request, res: Response): Promise<void> {
  const parsed = userIdQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "userId requerido" });
    return;
  }

  try {
    const wallet = await getWalletForUser(parsed.data.userId);
    res.json({
      ...wallet,
      explorerUrl: arbiscanAddressUrl(wallet.address, wallet.networkId),
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Error al obtener wallet",
    });
  }
}

export async function getWalletTransactions(
  req: Request,
  res: Response,
): Promise<void> {
  const parsed = userIdQuery
    .extend({ limit: z.coerce.number().int().positive().max(50).optional() })
    .safeParse(req.query);

  if (!parsed.success) {
    res.status(400).json({ error: "userId requerido" });
    return;
  }

  try {
    const transactions = await listWalletTransactions(
      parsed.data.userId,
      parsed.data.limit ?? 20,
    );
    res.json({ transactions });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Error al listar transacciones",
    });
  }
}

export async function linkUserWallet(req: Request, res: Response): Promise<void> {
  const parsed = linkSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Payload inválido", details: parsed.error.flatten() });
    return;
  }

  const { userId, message, signature } = parsed.data;

  try {
    const plan = await getSavingsPlan(userId);
    if (!plan) {
      res.status(404).json({ error: "Usuario no registrado — completa onboarding primero" });
      return;
    }

    const siwe = new SiweMessage(message);
    const origin = env.CORS_ORIGIN.replace(/\/$/, "");
    const { data } = await siwe.verify({
      signature,
      domain: new URL(origin).host,
      nonce: siwe.nonce,
    });

    const address = data.address;
    const verifiedAt = new Date().toISOString();
    const updated = await updateSavingsPlan(userId, {
      linkedWalletAddress: address,
      linkedWalletVerifiedAt: verifiedAt,
    });

    res.json({
      status: "linked",
      linkedWalletAddress: address,
      linkedWalletVerifiedAt: verifiedAt,
      plan: updated,
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Verificación SIWE fallida",
    });
  }
}

export async function requestWithdraw(req: Request, res: Response): Promise<void> {
  const parsed = withdrawSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Payload inválido", details: parsed.error.flatten() });
    return;
  }

  const { userId, amountMxnb } = parsed.data;

  try {
    const plan = await getSavingsPlan(userId);
    if (!plan) {
      res.status(404).json({ error: "Usuario no registrado" });
      return;
    }

    if (!plan.linkedWalletAddress) {
      res.status(400).json({
        error: "Vincula tu wallet con SIWE antes de solicitar un retiro",
      });
      return;
    }

    res.status(202).json({
      status: "pending",
      message:
        "Retiro encolado (stub). La ejecución on-chain se habilitará en una iteración posterior.",
      withdraw: {
        userId,
        amountMxnb,
        destination: plan.linkedWalletAddress,
        requestedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Error al solicitar retiro",
    });
  }
}
