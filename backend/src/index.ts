import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env, getIntegrationStatus } from "./config/env.js";
import { apiRouter } from "./routes/index.js";
import { initializeAgentWallet } from "./agent.js";
import { startSettlementReconciler } from "./jobs/settlement-reconciler.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

app.use("/api", apiRouter);

async function bootstrap() {
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

  startSettlementReconciler();

  const integrations = getIntegrationStatus();
  console.info(
    `[On-chain] sandbox=${integrations.onchainSandbox}`,
    `| cdp=${integrations.cdpAgent}`,
    `| juno=${integrations.juno}`,
    `| etherfuse=${integrations.etherfuse}`,
  );

  app.listen(env.PORT, () => {
    console.info(`[Server] Retiro Inteligente LATAM API → http://localhost:${env.PORT}`);
  });
}

bootstrap();
