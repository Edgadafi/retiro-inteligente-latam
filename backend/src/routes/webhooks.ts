import { Router } from "express";
import { handleBitsoFundingWebhook } from "../controllers/payment.js";
import { validateBitsoWebhook } from "../middleware/validateWebhook.js";

export const webhooksRouter = Router();

webhooksRouter.post(
  "/bitso/funding",
  validateBitsoWebhook,
  handleBitsoFundingWebhook,
);
