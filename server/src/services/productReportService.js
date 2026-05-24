import { Product } from "../models/Product.js";
import { ProductIssue } from "../models/ProductIssue.js";
import { Alert } from "../models/Alert.js";
import { validateProduct } from "./validationService.js";
import { getCompetitorPricingPayload } from "./competitorPricingService.js";

function escapeCsv(value) {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function csvRow(cells) {
  return cells.map(escapeCsv).join(",");
}

function buildReportData(productId) {
  return Promise.all([
    Product.findById(productId),
    ProductIssue.find({ productId }).sort({ createdAt: -1 }),
    Alert.find({ productId }).sort({ createdAt: -1 }),
  ]).then(async ([product, issues, alerts]) => {
    if (!product) {
      const err = new Error("Product not found");
      err.statusCode = 404;
      throw err;
    }

    const validation = await validateProduct(product.toObject(), {
      excludeProductId: product._id,
    });
    const competitorPricing = await getCompetitorPricingPayload(product);

    return {
      generatedAt: new Date().toISOString(),
      product: product.toObject(),
      validation,
      issues,
      alerts,
      competitorPricing,
      enhancedTitle: product.enhancedTitle || "",
      suggestedKeywords: product.suggestedKeywords || [],
    };
  });
}

export function buildProductReportJson(productId) {
  return buildReportData(productId);
}

export async function buildProductReportCsv(productId) {
  const report = await buildReportData(productId);
  const { product, validation, issues, alerts, competitorPricing } = report;
  const lines = [];

  lines.push("Quantacus Product Intelligence Report");
  lines.push(csvRow(["Generated at", report.generatedAt]));
  lines.push("");

  lines.push("=== PRODUCT OVERVIEW ===");
  lines.push(csvRow(["Field", "Value"]));
  const overview = [
    ["SKU", product.skuId],
    ["Title", product.title],
    ["Brand", product.brand],
    ["Category", product.category],
    ["Price", product.price],
    ["MRP", product.mrp],
    ["Availability", product.availability],
    ["Color", product.color],
    ["Size", product.size],
    ["Material", product.material],
    ["Quality Score", validation.qualityScore],
    ["Enhanced Title", report.enhancedTitle],
    ["Keywords", (report.suggestedKeywords || []).join("; ")],
    ["Description", product.description],
  ];
  overview.forEach((row) => lines.push(csvRow(row)));
  lines.push("");

  lines.push("=== VALIDATION ISSUES ===");
  lines.push(csvRow(["Severity", "Type", "Message", "Suggested Fix"]));
  (validation.issues || []).forEach((issue) => {
    lines.push(csvRow([issue.severity, issue.type, issue.message, issue.suggestedFix || ""]));
  });
  lines.push("");

  lines.push("=== STORED ISSUES ===");
  lines.push(csvRow(["Severity", "Type", "Message", "Suggested Fix"]));
  issues.forEach((issue) => {
    lines.push(csvRow([issue.severity, issue.type, issue.message, issue.suggestedFix || ""]));
  });
  lines.push("");

  lines.push("=== COMPETITOR PRICING ===");
  lines.push(csvRow(["Platform", "Price", "Difference", "% Difference"]));
  (competitorPricing?.prices || []).forEach((row) => {
    lines.push(
      csvRow([
        row.platform,
        row.competitorPrice,
        row.priceDifference ?? "",
        row.percentageDifference ?? "",
      ])
    );
  });
  if (competitorPricing?.analytics) {
    const a = competitorPricing.analytics;
    lines.push("");
    lines.push(csvRow(["Metric", "Value"]));
    lines.push(csvRow(["Lowest competitor", a.lowestCompetitorPrice]));
    lines.push(csvRow(["Highest competitor", a.highestCompetitorPrice]));
    lines.push(csvRow(["Average market", a.averageCompetitorPrice]));
    lines.push(csvRow(["Price gap", a.priceGap]));
    lines.push(csvRow(["% vs lowest", a.percentageDifference]));
  }
  if (competitorPricing?.recommendation) {
    const r = competitorPricing.recommendation;
    lines.push("");
    lines.push(csvRow(["Recommendation", r.message]));
    lines.push(csvRow(["Action", r.action]));
    lines.push(csvRow(["Severity", r.severity]));
  }
  lines.push("");

  lines.push("=== ALERTS ===");
  lines.push(csvRow(["Severity", "Message", "Resolved", "Created At"]));
  alerts.forEach((alert) => {
    lines.push(
      csvRow([alert.severity, alert.message, alert.resolved ? "Yes" : "No", alert.createdAt])
    );
  });

  const filename = `product-report-${product.skuId || product._id}.csv`.replace(/[^\w.-]+/g, "_");

  return {
    filename,
    content: `${lines.join("\n")}\n`,
    mimeType: "text/csv; charset=utf-8",
  };
}
