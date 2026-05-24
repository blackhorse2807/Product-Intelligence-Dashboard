import { Router } from "express";
import {
  getCompetitorPricing,
  refreshCompetitorPricesForProduct,
} from "../controllers/competitorController.js";

const router = Router();

router.get("/competitor-prices/:productId", getCompetitorPricing);
router.post("/competitor-prices/refresh/:productId", refreshCompetitorPricesForProduct);

export default router;
