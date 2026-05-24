import { CSV_REQUIRED_HEADERS } from "../constants/csvFields.js";
import { validateTitle } from "./titleValidator.js";
import { analyzeDescriptionQuality } from "../utils/descriptionQuality.js";
import { parseProductAmount } from "../utils/productPricing.js";

export function normalizeCsvHeader(header = "") {
  return String(header).trim().toLowerCase().replace(/\s+/g, "_");
}

export function validateHeaders(headers = []) {
  const normalized = headers.map(normalizeCsvHeader).filter(Boolean);
  const missingHeaders = CSV_REQUIRED_HEADERS.filter((h) => !normalized.includes(h));

  return {
    valid: missingHeaders.length === 0,
    missingHeaders,
    headers: normalized,
  };
}

function issue({ severity, type, message, suggestedFix }) {
  return { severity, type, message, suggestedFix };
}

function normalizeAvailability(value) {
  const v = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (["in_stock", "in stock", "instock", "available"].includes(v)) return "in_stock";
  if (["out_of_stock", "out of stock", "outofstock", "unavailable"].includes(v)) return "out_of_stock";
  if (v === "limited") return "limited";
  return v;
}

function applyPenalties(issues) {
  let score = 100;
  for (const item of issues) {
    if (item.severity === "HIGH") score -= 25;
    else if (item.severity === "MEDIUM") score -= 10;
    else if (item.severity === "LOW") score -= 5;
  }
  return Math.max(0, Math.min(100, score));
}

/**
 * Validate a single CSV product row (deterministic).
 */
export function validateProductRow(row, rowNumber, context = {}) {
  const issues = [];
  const sku = String(row.sku_id || "").trim();
  const title = String(row.product_title || "").trim();
  const brand = String(row.brand || "").trim();
  const category = String(row.category || "").trim();
  const price = parseProductAmount(row.price);
  const mrp = parseProductAmount(row.mrp);
  const availability = normalizeAvailability(row.availability);
  const description = String(row.description || "").trim();

  if (!sku) {
    issues.push(
      issue({
        severity: "HIGH",
        type: "MISSING_SKU",
        message: "SKU is missing.",
        suggestedFix: "Add a unique sku_id for each product row.",
      })
    );
  }

  if (context.duplicateSkuInFile) {
    issues.push(
      issue({
        severity: "HIGH",
        type: "DUPLICATE_SKU_IN_CSV",
        message: `Duplicate SKU "${sku}" in uploaded CSV.`,
        suggestedFix: "Use unique SKU values within the file.",
      })
    );
  }

  if (context.duplicateSkuInDb) {
    issues.push(
      issue({
        severity: "HIGH",
        type: "DUPLICATE_SKU",
        message: `SKU "${sku}" already exists in your catalog.`,
        suggestedFix: "Use a new SKU or update the existing product in your account.",
      })
    );
  }

  if (!title) {
    issues.push(
      issue({
        severity: "HIGH",
        type: "MISSING_TITLE",
        message: "Product title is missing.",
        suggestedFix: "Add product_title for each row.",
      })
    );
  }

  if (price <= 0) {
    issues.push(
      issue({
        severity: "HIGH",
        type: "INVALID_PRICE",
        message: "Selling price is missing or invalid.",
        suggestedFix: "Set price greater than zero.",
      })
    );
  }

  if (mrp <= 0) {
    issues.push(
      issue({
        severity: "HIGH",
        type: "INVALID_MRP",
        message: "MRP is missing or invalid.",
        suggestedFix: "Set mrp greater than zero.",
      })
    );
  }

  if (price > 0 && mrp > 0 && mrp < price) {
    issues.push(
      issue({
        severity: "HIGH",
        type: "MRP_LOWER_THAN_PRICE",
        message: "MRP is lower than selling price.",
        suggestedFix: "Ensure mrp is greater than or equal to price.",
      })
    );
  }

  if (!brand) {
    issues.push(
      issue({
        severity: "MEDIUM",
        type: "MISSING_BRAND",
        message: "Brand is missing.",
        suggestedFix: "Add brand for better listing quality.",
      })
    );
  }

  if (title) {
    const titleValidation = validateTitle(title, { brand, category, productType: category });
    if (titleValidation.isWeak) {
      for (const msg of titleValidation.issues) {
        issues.push(
          issue({
            severity: "MEDIUM",
            type: "WEAK_TITLE",
            message: msg,
            suggestedFix: "Improve product_title with brand, category, and attributes.",
          })
        );
      }
    }
  }

  if (description) {
    const desc = analyzeDescriptionQuality(description);
    if (desc.isWeak) {
      for (const msg of desc.issues) {
        issues.push(
          issue({
            severity: "MEDIUM",
            type: "WEAK_DESCRIPTION",
            message: msg,
            suggestedFix: "Add more detailed product description.",
          })
        );
      }
    }
  }

  if (availability === "out_of_stock") {
    issues.push(
      issue({
        severity: "LOW",
        type: "OUT_OF_STOCK",
        message: "Product is marked out of stock.",
        suggestedFix: "Update availability when inventory is available.",
      })
    );
  }

  const qualityScore = applyPenalties(issues);
  const isValid = !issues.some((i) => i.severity === "HIGH");

  return {
    rowNumber,
    isValid,
    qualityScore,
    issues,
    normalizedRow: {
      sku_id: sku,
      product_title: title,
      brand,
      category,
      price,
      mrp,
      availability,
      description,
      color: String(row.color || "").trim(),
      material: String(row.material || "").trim(),
      size: String(row.size || "").trim(),
    },
  };
}
