import { Router } from "express";
import { simulateSpeiDeposit } from "../controllers/demo.js";

export const demoRouter = Router();

demoRouter.post("/simulate-spei", simulateSpeiDeposit);
