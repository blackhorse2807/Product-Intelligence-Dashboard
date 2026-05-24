import { asyncHandler } from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import { Product } from "../models/Product.js";
import { ProductIssue } from "../models/ProductIssue.js";
import { Alert } from "../models/Alert.js";
export const getQualitySummary = asyncHandler(async (_req, res) => {
  const [totalProducts, avgQuality, issueCounts, openAlerts] = await Promise.all([
    Product.countDocuments(),
    Product.aggregate([{ $group: { _id: null, avg: { $avg: "$qualityScore" } } }]),
    ProductIssue.aggregate([{ $group: { _id: "$severity", count: { $sum: 1 } } }]),
    Alert.countDocuments({ resolved: false }),
  ]);

  const summary = {
    totalProducts,
    averageQualityScore: Math.round(avgQuality[0]?.avg || 0),
    issuesBySeverity: issueCounts.reduce((acc, row) => {
      acc[row._id] = row.count;
      return acc;
    }, { HIGH: 0, MEDIUM: 0, LOW: 0 }),
    openAlerts,
    qualityDistribution: {
      excellent: 0,
      good: 0,
      needsWork: 0,
    },
  };

  const products = await Product.find({}, "qualityScore");
  products.forEach((p) => {
    if (p.qualityScore >= 80) summary.qualityDistribution.excellent += 1;
    else if (p.qualityScore >= 60) summary.qualityDistribution.good += 1;
    else summary.qualityDistribution.needsWork += 1;
  });

  return successResponse(res, summary, "Quality summary fetched");
});
