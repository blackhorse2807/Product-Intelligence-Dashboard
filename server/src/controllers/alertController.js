import { asyncHandler } from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import { Alert } from "../models/Alert.js";

export const getAlerts = asyncHandler(async (_req, res) => {
  const alerts = await Alert.find()
    .populate("productId", "skuId title")
    .sort({ createdAt: -1 });
  return successResponse(res, alerts, "Alerts fetched");
});
