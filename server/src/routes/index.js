import { Router } from "express";
import uploadRoutes from "./uploadRoutes.js";
import jobRoutes from "./jobRoutes.js";
import productRoutes from "./productRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import alertRoutes from "./alertRoutes.js";
import competitorRoutes from "./competitorRoutes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, message: "API is running" });
});

router.use(uploadRoutes);
router.use(jobRoutes);
router.use(productRoutes);
router.use(dashboardRoutes);
router.use(alertRoutes);
router.use(competitorRoutes);

export default router;
