import { asyncHandler } from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import { Alert } from "../models/Alert.js";
import { getUserProductIds } from "../utils/ownership.js";

export const getAlerts = asyncHandler(async (req, res) => {
  const productIds = await getUserProductIds(req.user._id);

  if (!productIds.length) {
    return successResponse(res, [], "Alerts fetched");
  }

  const alerts = await Alert.find({ productId: { $in: productIds } })
    .populate("productId", "skuId title")
    .sort({ createdAt: -1 });

  return successResponse(res, alerts, "Alerts fetched");
});
