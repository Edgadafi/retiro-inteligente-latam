import { Router } from "express";
import {
  getWallet,
  getWalletTransactions,
  linkUserWallet,
  requestWithdraw,
} from "../controllers/wallet.js";

export const walletRouter = Router();

walletRouter.get("/", getWallet);
walletRouter.get("/transactions", getWalletTransactions);
walletRouter.post("/link", linkUserWallet);
walletRouter.post("/withdraw", requestWithdraw);
