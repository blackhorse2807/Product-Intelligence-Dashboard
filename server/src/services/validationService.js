import { Product } from "../models/Product.js";
import { analyzeDescriptionQuality } from "../utils/descriptionQuality.js";
import { getMissingTitleEssentialFields } from "../utils/titleEssentials.js";
import { isCatalogValueMissing } from "../utils/missingFields.js";
import { validateTitle, titleValidationToIssues } from "../validators/titleValidator.js";

function issue({ severity, type, message, suggestedFix }) {
  return { severity, type, message, suggestedFix };
}

/**
 * Full product validation — listing quality, title essentials, description score.
 */
export async function validateProduct(product, options = {}) {
  const { excludeProductId, createdBy } = options;
  const issues = [];
  let score = 100;

  const descriptionAnalysis = analyzeDescriptionQuality(product.description);
  const descriptionPenalty = 100 - descriptionAnalysis.score;
  score -= Math.round(descriptionPenalty * 0.25);

  for (const field of getMissingTitleEssentialFields(product)) {
    issues.push(
      issue({
        severity: "HIGH",
        type: "MISSING_TITLE_FIELD",
        message: `${field.label} is required to build a suitable product title.`,
        suggestedFix: `Enter ${field.label} in the form below.`,
      })
    );
    score -= 12;
  }

  if (isCatalogValueMissing("title", product.title)) {
    issues.push(
      issue({
        severity: "HIGH",
        type: "MISSING_TITLE",
        message: "Product title is missing.",
        suggestedFix: "Add a clear, descriptive product title.",
      })
    );
    score -= 15;
  }

  let titleValidation = null;
  if (!isCatalogValueMissing("title", product.title)) {
    titleValidation = validateTitle(product.title, {
      brand: product.brand,
      category: product.category,
      productType: product.category,
    });

    if (titleValidation.isWeak) {
      titleValidationToIssues(titleValidation).forEach((item) => issues.push(issue(item)));
      score -= Math.round((100 - titleValidation.score) * 0.2);
    }
  }

  if (descriptionAnalysis.isWeak) {
    for (const msg of descriptionAnalysis.issues) {
      issues.push(
        issue({
          severity: "LOW",
          type: "WEAK_DESCRIPTION",
          message: msg,
          suggestedFix: "Add more detailed product information.",
        })
      );
    }
  } else if (!product.description?.trim()) {
    issues.push(
      issue({
        severity: "MEDIUM",
        type: "MISSING_DESCRIPTION",
        message: "Product description is missing.",
        suggestedFix: "Add features, materials, and use-case details.",
      })
    );
    score -= 15;
  }

  if (!product.price || Number(product.price) <= 0) {
    issues.push(
      issue({
        severity: "HIGH",
        type: "INVALID_PRICE",
        message: "Selling price is missing or invalid.",
        suggestedFix: "Set a valid price greater than zero.",
      })
    );
    score -= 15;
  } else if (product.mrp > 0 && Number(product.price) > Number(product.mrp)) {
    issues.push(
      issue({
        severity: "MEDIUM",
        type: "INVALID_PRICE",
        message: "Selling price is higher than MRP.",
        suggestedFix: "Ensure price is less than or equal to MRP.",
      })
    );
    score -= 10;
  }

  if (!product.videoPublicId && !product.imagePublicId) {
    issues.push(
      issue({
        severity: "HIGH",
        type: "MISSING_MEDIA",
        message: "Product media is missing.",
        suggestedFix: "Upload a product video to extract catalog data.",
      })
    );
    score -= 12;
  }

  if (product.skuId && !/^PENDING-/i.test(product.skuId)) {
    const duplicateQuery = { skuId: product.skuId };
    if (createdBy) duplicateQuery.createdBy = createdBy;
    if (excludeProductId) {
      duplicateQuery._id = { $ne: excludeProductId };
    }
    const duplicate = await Product.findOne(duplicateQuery).select("_id");
    if (duplicate) {
      issues.push(
        issue({
          severity: "HIGH",
          type: "DUPLICATE_SKU",
          message: `SKU "${product.skuId}" is already used in your catalog.`,
          suggestedFix: "Use a unique SKU for each of your listings.",
        })
      );
      score -= 20;
    }
  }

  const missingAttrs = ["color", "size", "material"].filter((key) =>
    isCatalogValueMissing(key, product[key])
  );
  if (missingAttrs.length >= 2) {
    issues.push(
      issue({
        severity: "MEDIUM",
        type: "MISSING_ATTRIBUTES",
        message: `Missing product attributes: ${missingAttrs.join(", ")}.`,
        suggestedFix: "Add color, size, and material where applicable.",
      })
    );
    score -= 10;
  }

  if (product.availability === "out_of_stock") {
    issues.push(
      issue({
        severity: "MEDIUM",
        type: "OUT_OF_STOCK",
        message: "Product is marked as out of stock.",
        suggestedFix: "Update availability or pause listing until restocked.",
      })
    );
    score -= 5;
  }

  const qualityScore = Math.max(0, Math.min(100, Math.round(score)));

  return {
    valid: issues.filter((i) => i.severity === "HIGH").length === 0,
    qualityScore,
    descriptionQuality: descriptionAnalysis,
    titleValidation,
    issues,
  };
}

/** @deprecated Use validateProduct */
export async function validateExtractedProduct(product, ocrOutput) {
  const result = await validateProduct(product);
  if (ocrOutput?.partial) {
    result.issues.push(
      issue({
        severity: "LOW",
        type: "PARTIAL_OCR",
        message: "OCR failed on one or more frames.",
        suggestedFix: "Review failed frames and re-upload if needed.",
      })
    );
    result.qualityScore = Math.max(0, result.qualityScore - 5);
  }
  return result;
}
