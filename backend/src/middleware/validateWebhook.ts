import type { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import { env } from "../config/env.js";

/**
 * Valida firma HMAC del webhook Bitso Business / Juno.
 */
export function validateBitsoWebhook(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!env.BITSO_WEBHOOK_SECRET) {
    if (env.NODE_ENV === "development") {
      next();
      return;
    }
    res.status(500).json({ error: "Webhook secret no configurado" });
    return;
  }

  const signature = req.headers["x-bitso-signature"] as string | undefined;
  if (!signature) {
    res.status(401).json({ error: "Firma de webhook ausente" });
    return;
  }

  const payload = JSON.stringify(req.body);
  const expected = crypto
    .createHmac("sha256", env.BITSO_WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    res.status(401).json({ error: "Firma de webhook inválida" });
    return;
  }

  next();
}
