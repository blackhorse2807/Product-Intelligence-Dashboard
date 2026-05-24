import { Router } from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  enhanceTitle,
  setActiveTitleSource,
  getCompetitorPrices,
  downloadProductReport,
} from "../controllers/productController.js";

const router = Router();

router.get("/products", getProducts);
router.post("/products", createProduct);
router.get("/products/:id/competitor-prices", getCompetitorPrices);
router.get("/products/:id/report", downloadProductReport);
router.get("/products/:id", getProductById);
router.patch("/products/:id", updateProduct);
router.post("/products/:id/enhance-title", enhanceTitle);
router.patch("/products/:id/title-source", setActiveTitleSource);

export default router;
