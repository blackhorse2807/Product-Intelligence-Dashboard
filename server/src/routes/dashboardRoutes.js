import { Router } from "express";
import { getQualitySummary } from "../controllers/dashboardController.js";

const router = Router();

router.get("/dashboard/quality-summary", getQualitySummary);

export default router;
