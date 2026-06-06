import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { env, getIntegrationStatus } from "./config/env.js";
import { apiRouter } from "./routes/index.js";
import { initializeAgentWallet } from "./agent.js";
import { startSettlementReconciler } from "./jobs/settlement-reconciler.js";

let prepared = false;

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.VERCEL
        ? [env.CORS_ORIGIN, /\.vercel\.app$/]
        : env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json());
  // En Vercel el servicio ya tiene routePrefix /api — evita /api/api/*
  const apiPrefix = process.env.VERCEL ? "/" : "/api";
  app.use(apiPrefix, apiRouter);

  return app;
}

/** Inicialización compartida: dev (listen) y Vercel serverless */
export async function prepareServer(options?: { serverless?: boolean }): Promise<void> {
  if (prepared) return;
  prepared = true;

  try {
    if (env.CDP_API_KEY_NAME && env.CDP_API_KEY_PRIVATE_KEY) {
      await initializeAgentWallet();
    } else {
      console.warn(
        "[Agent] CDP credentials ausentes — monedero agéntico se inicializará bajo demanda.",
      );
    }
  } catch (error) {
    console.warn(
      "[Agent] Inicialización diferida:",
      error instanceof Error ? error.message : error,
    );
  }

  if (!options?.serverless) {
    startSettlementReconciler();
  } else {
    console.info("[Server] Reconciliador omitido en modo serverless (Vercel)");
  }

  const integrations = getIntegrationStatus();
  console.info(
    `[On-chain] sandbox=${integrations.onchainSandbox}`,
    `| cdp=${integrations.cdpAgent}`,
    `| juno=${integrations.juno}`,
    `| etherfuse=${integrations.etherfuse}`,
  );
}

/** Entrypoint Vercel serverless — requiere default export del Express app */
await prepareServer({ serverless: !!process.env.VERCEL });

export default createApp();
