import { Router } from "express";
import { getOnboarding, postOnboarding } from "../controllers/onboarding.js";

export const onboardingRouter = Router();

onboardingRouter.post("/", postOnboarding);
onboardingRouter.get("/:userId", getOnboarding);
