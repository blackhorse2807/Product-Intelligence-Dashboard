import { asyncHandler } from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import { findOwnedProduct } from "../utils/ownership.js";
import {
  getCompetitorPricingPayload,
  refreshCompetitorPrices,
} from "../services/competitorPricingService.js";

export const refreshCompetitorPricesForProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  await findOwnedProduct(productId, req.user._id);
  const payload = await refreshCompetitorPrices(productId);

  return successResponse(res, payload, "Competitor prices refreshed");
});

export const getCompetitorPricing = asyncHandler(async (req, res) => {
  const product = await findOwnedProduct(req.params.productId, req.user._id);
  const payload = await getCompetitorPricingPayload(product);
  return successResponse(res, payload, "Competitor pricing fetched");
});
