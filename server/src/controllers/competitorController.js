import { asyncHandler } from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import { Product } from "../models/Product.js";
import {
  getCompetitorPricingPayload,
  refreshCompetitorPrices,
} from "../services/competitorPricingService.js";

export const refreshCompetitorPricesForProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const payload = await refreshCompetitorPrices(productId);

  return successResponse(res, payload, "Competitor prices refreshed");
});

export const getCompetitorPricing = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }

  const payload = await getCompetitorPricingPayload(product);
  return successResponse(res, payload, "Competitor pricing fetched");
});
