import { Router } from "express";
import { webhooksRouter } from "./webhooks.js";
import { agentRouter } from "./agent.js";
import { getDepositStatus, retryDepositSettlement } from "../controllers/payment.js";
import { compareWithAfore, projectRetirementFund } from "../services/projection.service.js";
import { getAgentConfig } from "../agent.js";
import { getIntegrationStatus } from "../config/env.js";
import { onboardingRouter } from "./onboarding.js";
import { demoRouter } from "./demo.js";
import { testDbConnection } from "../controllers/health.js";

export const apiRouter = Router();

apiRouter.get("/test-db-connection", testDbConnection);
apiRouter.post("/test-db-connection", testDbConnection);

apiRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "retiro-inteligente-latam",
    version: "0.1.0",
    integrations: getIntegrationStatus(),
  });
});

apiRouter.get("/agent/config", (_req, res) => {
  const config = getAgentConfig();
  res.json({
    id: config.id,
    name: config.name,
    teePolicies: config.teePolicies,
    mcp: config.mcp,
    network: config.network,
  });
});

apiRouter.post("/projection", (req, res) => {
  const { contributionPerPeriod, periods, frequency, annualRate } = req.body as {
    contributionPerPeriod?: number;
    periods?: number;
    frequency?: "daily" | "weekly";
    annualRate?: number;
  };

  if (!contributionPerPeriod || !periods) {
    res.status(400).json({ error: "contributionPerPeriod y periods son requeridos" });
    return;
  }

  const projection = projectRetirementFund({
    contributionPerPeriod,
    periods,
    frequency,
    annualRate,
  });

  res.json(compareWithAfore(projection));
});

apiRouter.get("/deposits/:fid", getDepositStatus);
apiRouter.post("/deposits/:fid/retry", retryDepositSettlement);

apiRouter.use("/onboarding", onboardingRouter);
apiRouter.use("/demo", demoRouter);
apiRouter.use("/agent", agentRouter);
apiRouter.use("/webhooks", webhooksRouter);
