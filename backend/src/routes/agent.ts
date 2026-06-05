import { Router } from "express";
import { getAgentTools, postAgentChat } from "../controllers/agent.js";

export const agentRouter = Router();

agentRouter.get("/tools", getAgentTools);
agentRouter.post("/chat", postAgentChat);
